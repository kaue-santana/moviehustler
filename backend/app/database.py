# Configuração central de conexão com o Postgres — todo model importa `Base`
# daqui (pra virar uma tabela) e toda rota usa `get_db` (pra pegar uma sessão).
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

# Lê o arquivo .env (não commitado) e injeta as variáveis em os.environ —
# ver backend/.env.example pro formato esperado.
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# engine = o "canal" de conexão com o Postgres (pool de conexões etc).
# SessionLocal = fábrica de sessões — cada request cria a sua própria via get_db.
#
# NullPool (sem pool próprio do SQLAlchemy) porque quem já faz pooling aqui é
# o Supabase (Supavisor, na connection string via porta 6543 — ver README):
# manter um segundo pool em cima do pool deles só duplicaria conexões
# ociosas. Em produção serverless (Vercel) isso importa ainda mais — cada
# invocação é um processo novo, e um pool próprio nesse cenário manteria
# conexões abertas que nunca são reaproveitadas entre invocações.
engine = create_engine(DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Toda classe de model (Filme, Usuario, Aluguel...) herda de Base — é isso
# que permite ao Base.metadata.create_all() (em main.py) saber quais tabelas criar.
Base = declarative_base()


def get_db():
    # Dependency do FastAPI: abre uma sessão por requisição e garante que ela
    # feche no final (o `finally`), mesmo se a rota levantar uma exceção no meio.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
