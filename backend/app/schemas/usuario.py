from pydantic import BaseModel, EmailStr


class UsuarioCreate(BaseModel):
    # EmailStr (do pydantic[email]) já valida o formato do e-mail sozinho —
    # se vier algo inválido, o FastAPI recusa a requisição com 422 automaticamente.
    nome: str
    email: EmailStr
    senha: str


class UsuarioAtualizar(BaseModel):
    nome: str
    email: EmailStr
    # senha e senha_atual são opcionais porque dá pra atualizar só nome/email
    # sem trocar a senha. Quando o cliente quer trocar a senha, manda os dois:
    # senha_atual é conferida no backend antes de aceitar a nova senha.
    senha: str | None = None
    senha_atual: str | None = None
    # Todos opcionais, assim como no model (ver app/models/usuario.py) — dá
    # pra atualizar nome/email sem preencher CPF/endereço, e vice-versa.
    cpf: str | None = None
    endereco_logradouro: str | None = None
    endereco_numero: str | None = None
    endereco_complemento: str | None = None
    endereco_bairro: str | None = None
    endereco_cidade: str | None = None
    endereco_estado: str | None = None
    endereco_cep: str | None = None


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    is_admin: bool
    cpf: str | None = None
    endereco_logradouro: str | None = None
    endereco_numero: str | None = None
    endereco_complemento: str | None = None
    endereco_bairro: str | None = None
    endereco_cidade: str | None = None
    endereco_estado: str | None = None
    endereco_cep: str | None = None
    # Note: nunca expõe senha_hash aqui — é assim que a API evita vazar o
    # hash da senha em qualquer resposta, mesmo sem esforço extra na rota.

    class Config:
        from_attributes = True


class Token(BaseModel):
    # Formato padrão OAuth2 — é o que o frontend recebe no login e guarda
    # (ver frontend/src/auth.js) pra mandar em "Authorization: Bearer <token>".
    access_token: str
    token_type: str


class EsqueciSenhaRequest(BaseModel):
    email: EmailStr


class RedefinirSenhaRequest(BaseModel):
    # token vem do link que a pessoa recebeu por e-mail (ver query string em
    # redefinir-senha.html) — não tem relação com o JWT de login, é o token
    # de uso único gerado por gerar_token_redefinicao().
    token: str
    senha_nova: str
