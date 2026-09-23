from datetime import datetime

from sqlalchemy import Column, Float, Integer, DateTime, ForeignKey
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

    # Cópia do Filme.valor no momento em que o aluguel foi criado — resolve o
    # aviso deixado em Filme.valor: sem isso, o recibo e o histórico de
    # "Meus pedidos" mostrariam o preço ATUAL do filme, não o que foi pago de
    # fato. nullable=True pelo mesmo motivo do pedido_id: alugueis antigos,
    # criados antes desta coluna existir, não têm como preencher isso
    # retroativamente — quem lê essa coluna trata None como "usar
    # filme.valor como aproximação" (ver app/recibo.py e perfil.js).
    valor_pago = Column(Float, nullable=True)

    filme = relationship("Filme")
    agencia = relationship("Agencia")
    usuario = relationship("Usuario")
    # back_populates="alugueis" fecha a promessa feita em Pedido.alugueis —
    # agora dá pra navegar dos dois lados: aluguel.pedido e pedido.alugueis.
    pedido = relationship("Pedido", back_populates="alugueis")
