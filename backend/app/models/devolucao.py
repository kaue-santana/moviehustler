from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Devolucao(Base):
    __tablename__ = "devolucoes"

    id = Column(Integer, primary_key=True, index=True)
    # unique=True é o que garante "no máximo 1 devolução por aluguel" —
    # sem isso, nada impediria devolver o mesmo aluguel duas vezes no banco.
    aluguel_id = Column(Integer, ForeignKey("alugueis.id"), unique=True, nullable=False)
    data_devolucao = Column(DateTime, default=datetime.utcnow, nullable=False)

    aluguel = relationship("Aluguel")
