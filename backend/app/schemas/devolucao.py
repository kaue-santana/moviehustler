from datetime import datetime
from pydantic import BaseModel

from app.schemas.aluguel import VendaOut


class DevolucaoCreate(BaseModel):
    aluguel_id: int


class DevolucaoOut(BaseModel):
    id: int
    data_devolucao: datetime
    # Usa VendaOut (que inclui o usuario) em vez de AluguelOut porque essa
    # tela é só do admin — precisa saber de quem é o aluguel devolvido.
    aluguel: VendaOut

    class Config:
        from_attributes = True
