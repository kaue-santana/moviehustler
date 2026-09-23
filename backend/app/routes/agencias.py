from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agencia import Agencia
from app.schemas.agencia import AgenciaOut

router = APIRouter(prefix="/agencias", tags=["agencias"])


@router.get("/", response_model=list[AgenciaOut])
def listar_agencias(db: Session = Depends(get_db)):
    # Sem Depends(get_usuario_atual) de propósito: a lista de agências
    # aparece na tela de aluguel antes mesmo de logar, então é pública.
    return db.query(Agencia).all()
