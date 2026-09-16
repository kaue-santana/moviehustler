from pydantic import BaseModel


class FilmeBase(BaseModel):
    titulo: str
    generos: list[str]
    ano: int
    faixa: str
    duracao: str
    diretor: str
    sinopse: str
    streamings: list[str]
    valor: float


class FilmeCreate(FilmeBase):
    pass


class FilmeOut(FilmeBase):
    id: int

    class Config:
        from_attributes = True
