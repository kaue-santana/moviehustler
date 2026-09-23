# Schemas Pydantic definem o formato dos dados que entram e saem da API —
# são diferentes dos models de app/models/ (que definem o formato no banco).
# Padrão comum aqui: um *Base com os campos comuns, um *Create pro que o
# cliente manda ao criar, e um *Out pro que a API devolve (normalmente com id).
from pydantic import BaseModel


class AgenciaBase(BaseModel):
    nome: str
    bairro: str


class AgenciaOut(AgenciaBase):
    id: int

    class Config:
        # from_attributes=True permite criar este schema a partir de um objeto
        # SQLAlchemy (Agencia) diretamente, lendo os atributos (agencia.nome,
        # agencia.bairro...) em vez de exigir um dict.
        from_attributes = True
