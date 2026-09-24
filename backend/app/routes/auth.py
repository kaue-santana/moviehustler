from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_usuario_atual
from app.email import enviar_email_redefinicao
from app.models.usuario import Usuario
from app.schemas.usuario import (
    EsqueciSenhaRequest,
    RedefinirSenhaRequest,
    UsuarioCreate,
    UsuarioAtualizar,
    UsuarioOut,
    Token,
)
from app.security import gerar_token_redefinicao, hash_senha, hash_token_redefinicao, verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Link de redefinição válido por 30 minutos — curto de propósito: quanto
# maior a janela, maior o tempo em que um e-mail interceptado (ou um link
# esquecido aberto numa aba) pode ser usado por outra pessoa pra trocar a
# senha da conta.
MINUTOS_VALIDADE_TOKEN_REDEFINICAO = 30


@router.post("/registrar", response_model=UsuarioOut)
def registrar(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=409, detail="Já existe uma conta com esse e-mail")

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        # A senha só existe em texto puro aqui, dentro da requisição —
        # é transformada em hash antes de tocar o banco.
        senha_hash=hash_senha(usuario.senha),
    )
    db.add(novo_usuario)
    db.commit()
    # refresh() recarrega o objeto a partir do banco depois do commit, pra
    # pegar o `id` que o Postgres gerou (autoincrement) e devolver no response.
    db.refresh(novo_usuario)
    return novo_usuario


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm é um padrão do FastAPI: espera form-data com
    # campos "username" e "password" (não JSON) — por isso form.username em
    # vez de form.email, mesmo o login sendo por e-mail aqui.
    usuario = db.query(Usuario).filter(Usuario.email == form.username).first()
    if not usuario or not verificar_senha(form.password, usuario.senha_hash):
        # Mesma mensagem de erro pra "não existe" e "senha errada" de propósito:
        # não dá pra um atacante descobrir se um e-mail está cadastrado ou não.
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    # "sub" (subject) é o nome de campo padrão do JWT pra "de quem é esse token".
    token = criar_token({"sub": str(usuario.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioOut)
def ler_usuario_atual(usuario_atual: Usuario = Depends(get_usuario_atual)):
    # Depends(get_usuario_atual) já decodifica o token do header Authorization
    # e busca o Usuario correspondente (ver app/dependencies.py) — se o token
    # for inválido/expirado, a exceção é levantada lá antes de chegar aqui.
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

    # Campos do recibo/nota fiscal: todos opcionais, então setattr em loop
    # em vez de 8 linhas repetidas — cada um só é sobrescrito se vier
    # preenchido, permitindo atualizar só nome/email sem apagar um CPF
    # que a pessoa já tinha cadastrado antes.
    campos_recibo = [
        "cpf",
        "endereco_logradouro",
        "endereco_numero",
        "endereco_complemento",
        "endereco_bairro",
        "endereco_cidade",
        "endereco_estado",
        "endereco_cep",
    ]
    for campo in campos_recibo:
        valor = getattr(dados, campo)
        if valor is not None:
            setattr(usuario_atual, campo, valor)

    if dados.senha:
        # 400, não 401: um 401 aqui seria confundido com token inválido/expirado
        # por fetchAutenticado() no frontend, que desloga a pessoa automaticamente
        # em qualquer 401 (ver "sessao-expirada" em auth.js) — a senha atual errada
        # não tem nada a ver com o token da requisição estar ou não válido.
        if not dados.senha_atual or not verificar_senha(dados.senha_atual, usuario_atual.senha_hash):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        usuario_atual.senha_hash = hash_senha(dados.senha)

    db.commit()
    db.refresh(usuario_atual)
    return usuario_atual


@router.post("/esqueci-senha")
def esqueci_senha(dados: EsqueciSenhaRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == dados.email).first()

    # Só gera/manda o token se o e-mail existir de verdade — mas a resposta
    # da rota é IDÊNTICA nos dois casos (ver return no final). Se a mensagem
    # mudasse ("e-mail não encontrado" vs "e-mail enviado"), essa rota vira
    # uma forma de descobrir, um e-mail de cada vez, quais endereços têm
    # conta no site — o mesmo cuidado já tomado no login (capítulo 09/16).
    if usuario:
        token = gerar_token_redefinicao()
        usuario.token_redefinicao_hash = hash_token_redefinicao(token)
        usuario.token_redefinicao_expira = datetime.utcnow() + timedelta(
            minutes=MINUTOS_VALIDADE_TOKEN_REDEFINICAO
        )
        db.commit()
        enviar_email_redefinicao(usuario.email, token)

    return {"mensagem": "Se esse e-mail estiver cadastrado, enviamos um link de redefinição."}


@router.post("/redefinir-senha")
def redefinir_senha(dados: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    # Erro genérico de propósito: "token não existe" e "token expirado" viram
    # a mesma mensagem pro cliente, sem dar pista de qual dos dois aconteceu.
    erro_token = HTTPException(status_code=400, detail="Link inválido ou expirado")

    hash_recebido = hash_token_redefinicao(dados.token)
    usuario = db.query(Usuario).filter(Usuario.token_redefinicao_hash == hash_recebido).first()
    if not usuario:
        raise erro_token
    if usuario.token_redefinicao_expira is None or usuario.token_redefinicao_expira < datetime.utcnow():
        raise erro_token

    usuario.senha_hash = hash_senha(dados.senha_nova)
    # Apaga o token depois de usado — é isso que impede o mesmo link de
    # funcionar duas vezes (ver comentário em app/models/usuario.py).
    usuario.token_redefinicao_hash = None
    usuario.token_redefinicao_expira = None
    db.commit()

    return {"mensagem": "Senha redefinida com sucesso."}
