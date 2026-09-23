# Model SQLAlchemy = a representação em Python de uma tabela do banco.
# Cada atributo de classe vira uma coluna; a classe em si vira a tabela.
from sqlalchemy import Column, Integer, String
from app.database import Base


class Agencia(Base):
    # __tablename__ é o nome real da tabela no Postgres (a classe pode ter outro nome).
    __tablename__ = "agencias"

    # Uma "loja física" da locadora — cada Aluguel acontece amarrado a uma Agencia.
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    bairro = Column(String, nullable=False)
