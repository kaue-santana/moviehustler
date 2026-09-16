"""Promove uma conta já existente a administrador.

Uso: ./.venv/Scripts/python tornar_admin.py email@exemplo.com

Não existe rota de API pra isso de propósito — criar um admin exige
acesso direto ao servidor/banco, não só estar logado como usuário comum.
"""

import sys

from app.database import SessionLocal
from app.models.usuario import Usuario

if len(sys.argv) != 2:
    print("Uso: python tornar_admin.py <email>")
    sys.exit(1)

email = sys.argv[1]
db = SessionLocal()

usuario = db.query(Usuario).filter(Usuario.email == email).first()
if not usuario:
    print(f"Nenhum usuário encontrado com o e-mail {email}")
else:
    usuario.is_admin = True
    db.commit()
    print(f"{usuario.nome} ({usuario.email}) agora é administrador.")

db.close()
