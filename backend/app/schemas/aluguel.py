from datetime import datetime
from pydantic import BaseModel

from app.schemas.filme import FilmeOut
from app.schemas.agencia import AgenciaOut
from app.schemas.usuario import UsuarioOut


class AluguelCreate(BaseModel):
    filme_id: int
    agencia_id: int


class AluguelOut(BaseModel):
    id: int
    data_aluguel: datetime
    filme: FilmeOut
    agencia: AgenciaOut

    class Config:
        from_attributes = True


class VendaOut(AluguelOut):
    """Mesmo formato de AluguelOut, com o cliente incluído — só pra visão do admin
    (o cliente comum já sabe quem é ao ver o próprio histórico, não precisa disso)."""

    usuario: UsuarioOut
