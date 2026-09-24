# Tudo que envolve senha e autenticação (login) do usuário mora aqui.
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

# Vem do backend/.env — se essa chave vazar, qualquer um consegue forjar um
# token válido de qualquer usuário (inclusive admin). Nunca commitar o .env real.
SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITMO = "HS256"
MINUTOS_PARA_EXPIRAR = 60 * 24  # 1 dia


def hash_senha(senha: str) -> str:
    # bcrypt.gensalt() gera um "sal" aleatório a cada chamada, então o mesmo
    # texto de senha nunca produz o mesmo hash duas vezes — isso dificulta
    # ataques de rainbow table caso o banco vaze.
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    # Não dá pra "descriptografar" o hash de volta pra senha — em vez disso,
    # a gente faz o hash da senha digitada de novo e compara os dois hashes.
    return bcrypt.checkpw(senha.encode(), senha_hash.encode())


def criar_token(dados: dict) -> str:
    # JWT = um "crachá" assinado que o frontend guarda e manda em cada request.
    # Ele carrega os `dados` (normalmente o id/email do usuário) + validade (exp),
    # tudo assinado com SECRET_KEY — então o backend confia nele sem consultar
    # o banco a cada request, só verificando a assinatura.
    dados_do_token = dados.copy()
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_PARA_EXPIRAR)
    dados_do_token["exp"] = expira_em
    return jwt.encode(dados_do_token, SECRET_KEY, algorithm=ALGORITMO)


def decodificar_token(token: str) -> dict:
    # Levanta jwt.ExpiredSignatureError / jwt.InvalidTokenError se o token
    # estiver vencido ou tiver sido adulterado — quem chama trata isso
    # (ver app/dependencies.py) pra devolver 401 pro frontend.
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])


def gerar_token_redefinicao() -> str:
    # secrets.token_urlsafe (não random/uuid) porque é a função do Python
    # pensada especificamente pra gerar segredos - usa uma fonte de
    # aleatoriedade segura (os.urandom por baixo). 32 bytes = praticamente
    # impossível de adivinhar ou forçar por tentativa e erro.
    return secrets.token_urlsafe(32)


def hash_token_redefinicao(token: str) -> str:
    # SHA-256 aqui, não bcrypt: bcrypt é lento DE PROPÓSITO pra dificultar
    # forçar senhas curtas escolhidas por humanos (baixa entropia). Esse
    # token já nasce aleatório e com entropia altíssima (32 bytes) - forçar
    # ele por tentativa e erro já é inviável independente da velocidade do
    # hash. SHA-256 aqui cumpre só o papel de "não guardar o segredo em
    # texto puro no banco" (mesmo motivo do hash_senha), sem o custo extra
    # do bcrypt, que não compra nenhuma segurança a mais nesse caso.
    return hashlib.sha256(token.encode()).hexdigest()
