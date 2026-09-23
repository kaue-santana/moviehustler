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
    poster_url: str | None = None
    logo_url: str | None = None


class FilmeCreate(FilmeBase):
    # Idêntico ao FilmeBase por enquanto — existe como classe separada pra
    # deixar claro na assinatura das rotas ("recebe um FilmeCreate") e pra
    # já ter onde adicionar validações extras de criação no futuro sem
    # afetar o FilmeOut.
    pass


class FilmeOut(FilmeBase):
    id: int

    class Config:
        from_attributes = True
