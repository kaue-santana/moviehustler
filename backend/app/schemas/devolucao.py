from datetime import datetime
from pydantic import BaseModel

from app.schemas.aluguel import VendaOut


class DevolucaoCreate(BaseModel):
    aluguel_id: int


class DevolucaoOut(BaseModel):
    id: int
    data_devolucao: datetime
    aluguel: VendaOut

    class Config:
        from_attributes = True
