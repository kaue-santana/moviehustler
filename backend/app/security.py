import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITMO = "HS256"
MINUTOS_PARA_EXPIRAR = 60 * 24  # 1 dia


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode(), senha_hash.encode())


def criar_token(dados: dict) -> str:
    dados_do_token = dados.copy()
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_PARA_EXPIRAR)
    dados_do_token["exp"] = expira_em
    return jwt.encode(dados_do_token, SECRET_KEY, algorithm=ALGORITMO)


def decodificar_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
