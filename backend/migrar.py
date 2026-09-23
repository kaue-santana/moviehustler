"""Script de migração do schema — roda contra o banco definido em DATABASE_URL.

Cria as tabelas que ainda não existem (Base.metadata.create_all) e aplica os
ALTER TABLE manuais pra colunas adicionadas depois que a tabela já existia
(create_all não altera tabela existente, só cria as que faltam — o projeto
não usa uma ferramenta de migração como Alembic).

Rode à mão sempre que o schema mudar (novo model, nova coluna):

    ./.venv/Scripts/python migrar.py

Isso deixou de rodar como efeito colateral de importar `app.main` (era assim
antes): em produção serverless (Vercel), rodar DDL a cada invocação seria
arriscado (lock disputado entre invocações concorrentes) e desnecessário —
o schema já está pronto depois da primeira migração.
"""

from sqlalchemy import text

from app.database import Base, engine

# Importados só pelo efeito colateral: é isso que registra cada classe em
# Base.metadata, permitindo o create_all() abaixo "enxergar" todas as
# tabelas — sem essas linhas, create_all() não criaria nada.
from app.models import agencia, aluguel, devolucao, favorito, filme, pedido, usuario  # noqa: F401

MIGRACOES_MANUAIS = [
    "ALTER TABLE alugueis ADD COLUMN IF NOT EXISTS pedido_id INTEGER REFERENCES pedidos(id)",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_logradouro VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR",
]


def migrar():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conexao:
        for comando in MIGRACOES_MANUAIS:
            conexao.execute(text(comando))
    print("Schema atualizado.")


if __name__ == "__main__":
    migrar()
