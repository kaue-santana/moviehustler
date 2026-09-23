from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class Filme(Base):
    __tablename__ = "filmes"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    # Coluna JSON: Postgres guarda isso como um array/objeto de verdade (jsonb-like),
    # então dá pra salvar uma lista de gêneros sem precisar de tabela separada.
    generos = Column(JSON, nullable=False)
    ano = Column(Integer, nullable=False)
    faixa = Column(String, nullable=False)  # classificação indicativa, ex: "14 anos"
    duracao = Column(String, nullable=False)
    diretor = Column(String, nullable=False)
    sinopse = Column(String, nullable=False)
    # Lista de onde o filme está disponível pra streaming (Netflix, Prime, etc).
    streamings = Column(JSON, nullable=False)
    # Preço do aluguel. É lido "ao vivo" daqui sempre que alguém aluga —
    # o Aluguel não guarda uma cópia do valor, então se o preço do filme
    # mudar depois, o histórico de aluguéis antigos reflete o valor atual,
    # não o valor pago na hora (relevante pro recibo que estamos construindo).
    valor = Column(Float, nullable=False)
    poster_url = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    # Id do filme na API do TMDB (The Movie Database) — usado pelo script
    # popular_filmes_tmdb.py pra não duplicar o mesmo filme ao rodar de novo.
    tmdb_id = Column(Integer, unique=True, nullable=True)
