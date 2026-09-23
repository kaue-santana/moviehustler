# Pedido é o "agrupador" que representa uma finalização de carrinho: quando o
# cliente aluga vários filmes de uma vez e clica em "Finalizar", todos esses
# Alugueis passam a apontar pro mesmo Pedido. É essa tabela que vamos usar
# como base pra gerar o recibo (um recibo por Pedido, não um por Aluguel).
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data_pedido = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario")
    # back_populates="pedido" promete que o model Aluguel vai ter um campo
    # `pedido` apontando de volta pra cá — ainda precisa ser adicionado lá
    # junto com a coluna pedido_id (ver comentário em app/models/aluguel.py).
    alugueis = relationship("Aluguel", back_populates="pedido")
