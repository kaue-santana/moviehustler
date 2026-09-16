from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class Pagina(BaseModel, Generic[T]):
    itens: list[T]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
