from datetime import datetime
from pydantic import BaseModel

from app.schemas.filme import FilmeOut
from app.schemas.agencia import AgenciaOut
from app.schemas.usuario import UsuarioOut


class AluguelCreate(BaseModel):
    # Assim como em Favorito, usuario_id não vem daqui — vem do token de
    # quem está logado, pra ninguém conseguir alugar "em nome" de outro usuário.
    filme_id: int
    agencia_id: int
    # Opcional: liga este aluguel ao Pedido da finalização de carrinho atual
    # (ver POST /pedidos/). None é um Aluguel "avulso", sem pedido associado
    # — mantido opcional pra não quebrar nenhum outro fluxo que crie um
    # Aluguel sem passar por um Pedido.
    pedido_id: int | None = None


class AluguelOut(BaseModel):
    id: int
    data_aluguel: datetime
    filme: FilmeOut
    agencia: AgenciaOut

    class Config:
        from_attributes = True


class VendaOut(AluguelOut):
    """Mesmo formato de AluguelOut, com o cliente incluído — só pra visão do admin
    (o cliente comum já sabe quem é ao ver o próprio histórico, não precisa disso)."""

    usuario: UsuarioOut
