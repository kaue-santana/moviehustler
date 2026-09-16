import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.security import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_usuario_atual(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
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
        raise erro_credenciais

    usuario = db.query(Usuario).filter(Usuario.id == int(usuario_id)).first()
    if usuario is None:
        raise erro_credenciais

    return usuario


def get_admin_atual(usuario_atual: Usuario = Depends(get_usuario_atual)) -> Usuario:
    if not usuario_atual.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao administrador",
        )
    return usuario_atual
