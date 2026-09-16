from datetime import datetime
from pydantic import BaseModel

from app.schemas.filme import FilmeOut
from app.schemas.agencia import AgenciaOut


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
