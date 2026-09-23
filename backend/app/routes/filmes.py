from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_atual
from app.models.filme import Filme
from app.models.aluguel import Aluguel
from app.models.usuario import Usuario
from app.schemas.filme import FilmeCreate, FilmeOut

router = APIRouter(prefix="/filmes", tags=["filmes"])


# Leitura é pública (sem Depends de autenticação) — qualquer visitante pode
# ver o catálogo, inclusive sem conta (ver fluxo "continuar sem conta" no
# README). Escrita (criar/atualizar/deletar) abaixo exige get_admin_atual.
@router.get("/", response_model=list[FilmeOut])
def listar_filmes(db: Session = Depends(get_db)):
    return db.query(Filme).all()


@router.get("/{filme_id}", response_model=FilmeOut)
def buscar_filme(filme_id: int, db: Session = Depends(get_db)):
    filme = db.query(Filme).filter(Filme.id == filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return filme


@router.post("/", response_model=FilmeOut)
def criar_filme(
    filme: FilmeCreate,
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    # model_dump() converte o schema Pydantic num dict simples; como os nomes
    # dos campos batem 1:1 com as colunas do model, dá pra usar **dict direto
    # no construtor do Filme em vez de listar campo por campo.
    novo_filme = Filme(**filme.model_dump())
    db.add(novo_filme)
    db.commit()
    db.refresh(novo_filme)
    return novo_filme


@router.put("/{filme_id}", response_model=FilmeOut)
def atualizar_filme(
    filme_id: int,
    dados: FilmeCreate,
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    filme = db.query(Filme).filter(Filme.id == filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    # setattr em loop em vez de reatribuir campo por campo — atualiza todas
    # as colunas de uma vez a partir do que veio no corpo da requisição.
    for campo, valor in dados.model_dump().items():
        setattr(filme, campo, valor)

    db.commit()
    db.refresh(filme)
    return filme


@router.delete("/{filme_id}")
def deletar_filme(
    filme_id: int,
    db: Session = Depends(get_db),
    admin_atual: Usuario = Depends(get_admin_atual),
):
    filme = db.query(Filme).filter(Filme.id == filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    # Trava de integridade: deletar o Filme deixaria os Alugueis antigos
    # com uma FK apontando pro nada. Em vez de permitir isso (ou de fazer
    # cascade delete, que apagaria histórico de verdade), bloqueia com 409.
    tem_aluguel = db.query(Aluguel).filter(Aluguel.filme_id == filme_id).first()
    if tem_aluguel:
        raise HTTPException(
            status_code=409,
            detail="Não é possível excluir um filme com histórico de aluguéis.",
        )

    db.delete(filme)
    db.commit()
    return {"ok": True}
