# Schemas de saída dos relatórios do admin (app/routes/admin.py), que rodam
# SQL agregado direto (SUM, COUNT, GROUP BY) em vez de passar por um model —
# por isso não têm um model correspondente em app/models/.
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
    ticket_medio: float  # faturamento médio por aluguel
    media_mensal: float  # faturamento médio por mês
