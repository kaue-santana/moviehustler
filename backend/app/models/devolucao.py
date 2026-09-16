from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Devolucao(Base):
    __tablename__ = "devolucoes"

    id = Column(Integer, primary_key=True, index=True)
    aluguel_id = Column(Integer, ForeignKey("alugueis.id"), unique=True, nullable=False)
    data_devolucao = Column(DateTime, default=datetime.utcnow, nullable=False)

    aluguel = relationship("Aluguel")
