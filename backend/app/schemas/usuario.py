from pydantic import BaseModel, EmailStr


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str


class UsuarioAtualizar(BaseModel):
    nome: str
    email: EmailStr
    senha: str | None = None


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    is_admin: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
