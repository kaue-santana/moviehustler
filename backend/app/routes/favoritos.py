from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_usuario_atual
from app.models.favorito import Favorito
from app.models.filme import Filme
from app.models.usuario import Usuario
from app.schemas.favorito import FavoritoCreate, FavoritoOut

router = APIRouter(prefix="/favoritos", tags=["favoritos"])


@router.get("/", response_model=list[FavoritoOut])
def listar_favoritos(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    return db.query(Favorito).filter(Favorito.usuario_id == usuario_atual.id).all()


@router.post("/", response_model=FavoritoOut)
def adicionar_favorito(
    favorito: FavoritoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    filme = db.query(Filme).filter(Filme.id == favorito.filme_id).first()
    if not filme:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

    existente = (
        db.query(Favorito)
        .filter(
            Favorito.usuario_id == usuario_atual.id,
            Favorito.filme_id == favorito.filme_id,
        )
        .first()
    )
    if existente:
        return existente

    novo_favorito = Favorito(usuario_id=usuario_atual.id, filme_id=favorito.filme_id)
    db.add(novo_favorito)
    db.commit()
    db.refresh(novo_favorito)
    return novo_favorito


@router.delete("/{filme_id}")
def remover_favorito(
    filme_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    favorito = (
        db.query(Favorito)
        .filter(Favorito.usuario_id == usuario_atual.id, Favorito.filme_id == filme_id)
        .first()
    )
    if not favorito:
        raise HTTPException(status_code=404, detail="Favorito não encontrado")
    db.delete(favorito)
    db.commit()
    return {"ok": True}
