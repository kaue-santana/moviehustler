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

    filme = relationship("Filme")
    agencia = relationship("Agencia")
    usuario = relationship("Usuario")
