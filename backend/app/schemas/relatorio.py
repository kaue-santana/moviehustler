from datetime import date
from pydantic import BaseModel


class FaturamentoMensal(BaseModel):
    mes: date
    faturamento: float
    total_alugueis: int

    class Config:
        from_attributes = True


class FilmeMaisAlugado(BaseModel):
    filme_id: int
    titulo: str
    total_alugueis: int

    class Config:
        from_attributes = True


class FaturamentoMedio(BaseModel):
    ticket_medio: float
    media_mensal: float
