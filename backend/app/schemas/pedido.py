# Só existe PedidoOut (nenhum PedidoCreate) porque criar um Pedido não pede
# nenhum dado do cliente — o corpo da requisição é vazio, tudo vem do
# usuario_atual (token) e do banco (data_pedido = agora). Ver POST /pedidos/
# em app/routes/pedidos.py.
from datetime import datetime
from pydantic import BaseModel


class PedidoOut(BaseModel):
    id: int
    data_pedido: datetime

    class Config:
        from_attributes = True
