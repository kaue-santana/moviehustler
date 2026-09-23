# Dependencies do FastAPI: funções que rotas "pedem" via Depends(...) e que
# rodam antes do corpo da rota — aqui usadas pra extrair e validar quem está
# fazendo a requisição a partir do token JWT no header Authorization.
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.security import decodificar_token

# Diz ao FastAPI onde fica o endpoint de login (usado só pra gerar a doc do
# Swagger/OpenAPI — o "cadeado" em /docs aponta pra essa URL).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_usuario_atual(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    # Reaproveitada nos três pontos de falha abaixo pra sempre devolver o
    # mesmo erro genérico, sem dar pista de qual etapa falhou (token
    # ausente, corrompido, ou usuário que não existe mais).
    erro_credenciais = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decodificar_token(token)
        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise erro_credenciais
    except jwt.PyJWTError:
        # Cobre token expirado, assinatura inválida, JSON corrompido, etc.
        raise erro_credenciais

    usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if usuario is None:
        # Token ainda válido, mas o usuário foi deletado do banco depois
        # de ele ter sido emitido — trata como se o token fosse inválido.
        raise erro_credenciais

    return usuario


def get_admin_atual(usuario_atual: Usuario = Depends(get_usuario_atual)) -> Usuario:
    # Encadeia em cima de get_usuario_atual: primeiro confirma que o token é
    # válido, depois checa is_admin. Rotas de /admin usam esta em vez da
    # get_usuario_atual pura pra bloquear usuários comuns com 403.
    if not usuario_atual.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao administrador",
        )
    return usuario_atual
