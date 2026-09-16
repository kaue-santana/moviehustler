from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class Filme(Base):
    __tablename__ = "filmes"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    generos = Column(JSON, nullable=False)
    ano = Column(Integer, nullable=False)
    faixa = Column(String, nullable=False)
    duracao = Column(String, nullable=False)
    diretor = Column(String, nullable=False)
    sinopse = Column(String, nullable=False)
    streamings = Column(JSON, nullable=False)
    valor = Column(Float, nullable=False)
