from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_usuario_atual
from app.models.aluguel import Aluguel
from app.models.filme import Filme
from app.models.agencia import Agencia
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.aluguel import AluguelCreate, AluguelOut

router = APIRouter(prefix="/alugueis", tags=["alugueis"])


@router.get("/", response_model=list[AluguelOut])
def listar_alugueis(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    return (
        db.query(Aluguel)
        .filter(Aluguel.usuario_id == usuario_atual.id)
        .order_by(Aluguel.data_aluguel.desc())
        .all()
    )


# Chamada uma vez por item do carrinho ao "Finalizar" (ver
# frontend/src/carrinho.js) — o frontend cria o Pedido primeiro (POST
# /pedidos/) e passa o id dele em pedido_id a cada chamada daqui, pra
# agrupar os itens da mesma finalização sob o mesmo Pedido.
@router.post("/", response_model=AluguelOut)
def criar_aluguel(
    aluguel: AluguelCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    filme = db.query(Filme).filter(Filme.id == aluguel.filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    agencia = db.query(Agencia).filter(Agencia.id == aluguel.agencia_id).first()
    if not agencia:
        raise HTTPException(status_code=404, detail="Agência não encontrada")

    if aluguel.pedido_id is not None:
        # Confere que o Pedido existe E pertence a quem está fazendo a
        # requisição — sem o filtro por usuario_id, qualquer pessoa logada
        # poderia "grudar" um aluguel no pedido de outra pessoa só
        # adivinhando o id (mesmo risco do cancelar_aluguel logo abaixo).
        pedido = (
            db.query(Pedido)
            .filter(Pedido.id == aluguel.pedido_id, Pedido.usuario_id == usuario_atual.id)
            .first()
        )
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")

    novo_aluguel = Aluguel(
        filme_id=aluguel.filme_id,
        agencia_id=aluguel.agencia_id,
        usuario_id=usuario_atual.id,
        pedido_id=aluguel.pedido_id,
    )
    db.add(novo_aluguel)
    db.commit()
    db.refresh(novo_aluguel)
    return novo_aluguel


@router.delete("/{aluguel_id}")
def cancelar_aluguel(
    aluguel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    aluguel = (
        db.query(Aluguel)
        # O filtro por usuario_id (não só id) é o que impede um usuário de
        # cancelar o aluguel de outra pessoa só adivinhando o id na URL.
        .filter(Aluguel.id == aluguel_id, Aluguel.usuario_id == usuario_atual.id)
        .first()
    )
    if not aluguel:
        raise HTTPException(status_code=404, detail="Aluguel não encontrado")
    db.delete(aluguel)
    db.commit()
    return {"ok": True}
