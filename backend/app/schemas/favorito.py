from pydantic import BaseModel

from app.schemas.filme import FilmeOut


class FavoritoCreate(BaseModel):
    # Ao favoritar, o cliente só manda o id do filme — usuario_id vem do
    # token JWT (usuario_atual), nunca do corpo da requisição.
    filme_id: int


class FavoritoOut(BaseModel):
    id: int
    filme_id: int
    # Incluir o FilmeOut inteiro (não só o id) evita o frontend ter que
    # fazer uma segunda chamada pra buscar os dados do filme favoritado.
    filme: FilmeOut

    class Config:
        from_attributes = True
