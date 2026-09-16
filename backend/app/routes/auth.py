from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_usuario_atual
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioAtualizar, UsuarioOut, Token
from app.security import hash_senha, verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/registrar", response_model=UsuarioOut)
def registrar(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=409, detail="Já existe uma conta com esse e-mail")

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=hash_senha(usuario.senha),
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == form.username).first()
    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    token = criar_token({"sub": str(usuario.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioOut)
def ler_usuario_atual(usuario_atual: Usuario = Depends(get_usuario_atual)):
    return usuario_atual


@router.put("/me", response_model=UsuarioOut)
def atualizar_usuario_atual(
    dados: UsuarioAtualizar,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    if dados.email != usuario_atual.email:
        existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
        if existente:
            raise HTTPException(status_code=409, detail="Já existe uma conta com esse e-mail")

    usuario_atual.nome = dados.nome
    usuario_atual.email = dados.email
    if dados.senha:
        usuario_atual.senha_hash = hash_senha(dados.senha)

    db.commit()
    db.refresh(usuario_atual)
    return usuario_atual
