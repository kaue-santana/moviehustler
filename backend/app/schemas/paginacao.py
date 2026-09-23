# Schema genérico reaproveitado pra qualquer listagem paginada da API
# (ex: Pagina[VendaOut], Pagina[UsuarioOut] em app/routes/admin.py) —
# em vez de duplicar essa estrutura de paginação pra cada tipo de item.
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class Pagina(BaseModel, Generic[T]):
    itens: list[T]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
