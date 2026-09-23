from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Favorito(Base):
    __tablename__ = "favoritos"
    # UniqueConstraint garante, no nível do banco, que o mesmo usuário não pode
    # favoritar o mesmo filme duas vezes (evita duplicata mesmo com bug no backend).
    __table_args__ = (UniqueConstraint("usuario_id", "filme_id", name="uq_favorito_usuario_filme"),)

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    filme_id = Column(Integer, ForeignKey("filmes.id"), nullable=False)

    # relationship() não cria coluna nenhuma — é só um atalho em Python.
    # Graças a isso, dá pra fazer `favorito.filme.titulo` em vez de fazer
    # uma query separada buscando o Filme pelo filme_id manualmente.
    filme = relationship("Filme")
