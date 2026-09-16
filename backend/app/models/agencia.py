from sqlalchemy import Column, Integer, String
from app.database import Base


class Agencia(Base):
    __tablename__ = "agencias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    bairro = Column(String, nullable=False)
