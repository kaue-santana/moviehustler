from pydantic import BaseModel


class AgenciaBase(BaseModel):
    nome: str
    bairro: str


class AgenciaOut(AgenciaBase):
    id: int

    class Config:
        from_attributes = True
