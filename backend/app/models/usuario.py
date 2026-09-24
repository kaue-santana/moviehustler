from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    # Nunca guardamos a senha em texto puro — só o hash (ver app/security.py,
    # que usa bcrypt pra gerar e comparar esse valor).
    senha_hash = Column(String, nullable=False)
    # Controla quem enxerga as rotas de /admin (ver app/dependencies.py).
    is_admin = Column(Boolean, default=False, nullable=False)

    # NOTA (recibo/nota fiscal): todos os campos abaixo são opcionais
    # (nullable=True) de propósito — cadastro continua pedindo só nome/
    # email/senha. CPF e endereço só passam a ser exigidos na hora de gerar
    # um recibo (validado na rota, não aqui no model), do mesmo jeito que
    # sistemas reais (iFood, Uber etc.) fazem: pedir o documento fiscal só
    # quando ele é de fato necessário, não travando o cadastro por causa disso.
    cpf = Column(String, nullable=True)
    endereco_logradouro = Column(String, nullable=True)
    endereco_numero = Column(String, nullable=True)
    endereco_complemento = Column(String, nullable=True)
    endereco_bairro = Column(String, nullable=True)
    endereco_cidade = Column(String, nullable=True)
    endereco_estado = Column(String, nullable=True)  # sigla da UF, ex: "SP"
    endereco_cep = Column(String, nullable=True)

    # "Esqueci minha senha": mesmo princípio de nunca guardar um segredo em
    # texto puro que já vale pra senha_hash — aqui guardamos o HASH do token
    # de redefinição, não o token em si. Se o banco vazar, ninguém consegue
    # usar essas colunas pra trocar a senha de alguém (precisaria do token
    # original, que só existe no link mandado por email). token_redefinicao_expira
    # é o que torna o link de "uso único" na prática: depois de expirado (ou
    # usado — ver redefinir_senha em app/routes/auth.py), o hash é apagado.
    token_redefinicao_hash = Column(String, nullable=True)
    token_redefinicao_expira = Column(DateTime, nullable=True)
