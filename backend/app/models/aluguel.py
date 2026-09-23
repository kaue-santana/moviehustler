from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Aluguel(Base):
    __tablename__ = "alugueis"

    id = Column(Integer, primary_key=True, index=True)
    filme_id = Column(Integer, ForeignKey("filmes.id"), nullable=False)
    agencia_id = Column(Integer, ForeignKey("agencias.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data_aluguel = Column(DateTime, default=datetime.utcnow, nullable=False)

    # nullable=True de propósito: todo Aluguel criado antes deste campo
    # existir fica com pedido_id = NULL no banco (não dá pra preencher
    # retroativamente um agrupamento que nunca existiu) — "sem pedido
    # associado" é um estado válido, não um erro.
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=True)

    filme = relationship("Filme")
    agencia = relationship("Agencia")
    usuario = relationship("Usuario")
    # back_populates="alugueis" fecha a promessa feita em Pedido.alugueis —
    # agora dá pra navegar dos dois lados: aluguel.pedido e pedido.alugueis.
    pedido = relationship("Pedido", back_populates="alugueis")
