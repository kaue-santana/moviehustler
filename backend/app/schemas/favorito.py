from pydantic import BaseModel

from app.schemas.filme import FilmeOut


class FavoritoCreate(BaseModel):
    filme_id: int


class FavoritoOut(BaseModel):
    id: int
    filme_id: int
    filme: FilmeOut

    class Config:
        from_attributes = True
