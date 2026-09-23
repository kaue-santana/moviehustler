import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_atual
from app.models.usuario import Usuario
from app.models.aluguel import Aluguel
from app.models.filme import Filme
from app.models.devolucao import Devolucao
from app.schemas.usuario import UsuarioOut
from app.schemas.aluguel import VendaOut
from app.schemas.devolucao import DevolucaoCreate, DevolucaoOut
from app.schemas.relatorio import FaturamentoMensal, FilmeMaisAlugado, FaturamentoMedio
from app.schemas.paginacao import Pagina

router = APIRouter(prefix="/admin", tags=["admin"])


# Helper reaproveitado pelas listagens paginadas abaixo (clientes, vendas).
# Recebe uma query do SQLAlchemy ainda não executada (sem .all()), aplica
# offset/limit por cima dela, e só então dispara duas queries no banco:
# uma pra contar o total (pro total_paginas) e outra pra pegar a página atual.
def paginar(query, pagina: int, por_pagina: int) -> dict:
    total = query.count()
    itens = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()
    return {
        "itens": itens,
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_paginas": max(1, math.ceil(total / por_pagina)),
    }


@router.get("/clientes/", response_model=Pagina[UsuarioOut])
def listar_clientes(
    busca: str | None = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    query = db.query(Usuario).order_by(Usuario.nome)
    if busca:
        termo = f"%{busca}%"
        query = query.filter(or_(Usuario.nome.ilike(termo), Usuario.email.ilike(termo)))
    return paginar(query, pagina, por_pagina)


# "Vendas" aqui é só um nome de apresentação pro admin — não existe uma
# tabela Venda, é a mesma tabela Aluguel vista com o VendaOut (que inclui o
# usuário). Ver o comentário na classe VendaOut em app/schemas/aluguel.py.
@router.get("/vendas/", response_model=Pagina[VendaOut])
def listar_vendas(
    busca: str | None = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    query = (
        db.query(Aluguel)
        .join(Filme, Aluguel.filme_id == Filme.id)
        .join(Usuario, Aluguel.usuario_id == Usuario.id)
        .order_by(Aluguel.data_aluguel.desc())
    )
    if busca:
        termo = f"%{busca}%"
        # ilike = LIKE case-insensitive do Postgres; o % nas duas pontas faz
        # a busca casar com qualquer trecho do título/nome, não só o início.
        query = query.filter(or_(Filme.titulo.ilike(termo), Usuario.nome.ilike(termo)))
    return paginar(query, pagina, por_pagina)


@router.get("/devolucoes/", response_model=list[DevolucaoOut])
def listar_devolucoes(
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    return db.query(Devolucao).order_by(Devolucao.data_devolucao.desc()).all()


@router.post("/devolucoes/", response_model=DevolucaoOut)
def registrar_devolucao(
    devolucao: DevolucaoCreate,
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    aluguel = db.query(Aluguel).filter(Aluguel.id == devolucao.aluguel_id).first()
    if not aluguel:
        raise HTTPException(status_code=404, detail="Aluguel não encontrado")

    existente = (
        db.query(Devolucao).filter(Devolucao.aluguel_id == devolucao.aluguel_id).first()
    )
    if existente:
        # Reforça em Python a mesma regra que o unique=True de Devolucao.aluguel_id
        # já garante no banco — aqui só pra devolver uma mensagem legível em
        # vez de deixar estourar um erro cru de constraint violation do Postgres.
        raise HTTPException(status_code=409, detail="Esse aluguel já foi devolvido")

    nova_devolucao = Devolucao(aluguel_id=devolucao.aluguel_id)
    db.add(nova_devolucao)
    db.commit()
    db.refresh(nova_devolucao)
    return nova_devolucao


# Os três relatórios abaixo somam/contam direto no SQL (SUM/COUNT/GROUP BY)
# em vez de trazer todos os Alugueis pro Python e somar lá — importante
# porque isso escala mesmo com milhares de linhas na tabela alugueis.
# LEMBRETE: faturamento aqui é sempre `Filme.valor` no momento da consulta,
# não o valor pago de fato na hora do aluguel (ver nota em app/models/filme.py) —
# isso vai ficar mais preciso quando o Pedido/recibo guardar o valor congelado.
@router.get("/relatorios/faturamento-mensal", response_model=list[FaturamentoMensal])
def relatorio_faturamento_mensal(
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    # date_trunc("month", ...) arredonda cada data pro primeiro dia do mês
    # correspondente — é o que permite agrupar (GROUP BY) aluguéis de dias
    # diferentes do mesmo mês numa única linha do relatório.
    mes = func.date_trunc("month", Aluguel.data_aluguel).label("mes")
    resultados = (
        db.query(
            mes,
            func.sum(Filme.valor).label("faturamento"),
            func.count(Aluguel.id).label("total_alugueis"),
        )
        .join(Filme, Aluguel.filme_id == Filme.id)
        .group_by(mes)
        .order_by(mes)
        .all()
    )
    return [
        {
            "mes": linha.mes.date(),
            "faturamento": float(linha.faturamento),
            "total_alugueis": linha.total_alugueis,
        }
        for linha in resultados
    ]


@router.get("/relatorios/filmes-mais-alugados", response_model=list[FilmeMaisAlugado])
def relatorio_filmes_mais_alugados(
    limite: int = 10,
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    # Um JOIN + GROUP BY Filme.id: conta quantas linhas de Aluguel cada filme
    # tem, ordena do mais alugado pro menos, e corta em `limite` — o SQL
    # inteiro do "top 10" roda como uma query só.
    return (
        db.query(
            Filme.id.label("filme_id"),
            Filme.titulo,
            func.count(Aluguel.id).label("total_alugueis"),
        )
        .join(Aluguel, Aluguel.filme_id == Filme.id)
        .group_by(Filme.id)
        .order_by(func.count(Aluguel.id).desc())
        .limit(limite)
        .all()
    )


@router.get("/relatorios/faturamento-medio", response_model=FaturamentoMedio)
def relatorio_faturamento_medio(
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    # Ticket médio = média do valor de CADA aluguel individual (não por mês).
    ticket_medio = (
        db.query(func.avg(Filme.valor))
        .select_from(Aluguel)
        .join(Filme, Aluguel.filme_id == Filme.id)
        .scalar()
    )

    # Média mensal é diferente: primeiro soma o faturamento de cada mês
    # (subquery), depois tira a média DESSAS somas — por isso não dá pra
    # calcular com um único func.avg() direto, precisa de duas etapas:
    # 1) subquery agrupando por mês, 2) média em cima do resultado dela.
    mes = func.date_trunc("month", Aluguel.data_aluguel).label("mes")
    subquery = (
        db.query(func.sum(Filme.valor).label("total_mes"))
        .select_from(Aluguel)
        .join(Filme, Aluguel.filme_id == Filme.id)
        .group_by(mes)
        .subquery()
    )
    media_mensal = db.query(func.avg(subquery.c.total_mes)).scalar()

    return {
        # `or 0.0` pro caso de não haver nenhum aluguel ainda — scalar() nesse
        # caso devolveria None, e o schema espera float.
        "ticket_medio": float(ticket_medio) if ticket_medio else 0.0,
        "media_mensal": float(media_mensal) if media_mensal else 0.0,
    }
