from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.filme import Filme
from app.models.aluguel import Aluguel
from app.schemas.filme import FilmeCreate, FilmeOut

router = APIRouter(prefix="/filmes", tags=["filmes"])


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
def criar_filme(filme: FilmeCreate, db: Session = Depends(get_db)):
    novo_filme = Filme(**filme.model_dump())
    db.add(novo_filme)
    db.commit()
    db.refresh(novo_filme)
    return novo_filme


@router.put("/{filme_id}", response_model=FilmeOut)
def atualizar_filme(filme_id: int, dados: FilmeCreate, db: Session = Depends(get_db)):
    filme = db.query(Filme).filter(Filme.id == filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(filme, campo, valor)

    db.commit()
    db.refresh(filme)
    return filme


@router.delete("/{filme_id}")
def deletar_filme(filme_id: int, db: Session = Depends(get_db)):
    filme = db.query(Filme).filter(Filme.id == filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    tem_aluguel = db.query(Aluguel).filter(Aluguel.filme_id == filme_id).first()
    if tem_aluguel:
        raise HTTPException(
            status_code=409,
            detail="Não é possível excluir um filme com histórico de aluguéis.",
        )

    db.delete(filme)
    db.commit()
    return {"ok": True}
