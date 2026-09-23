from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_usuario_atual
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.recibo import gerar_recibo_pdf
from app.schemas.pedido import PedidoOut

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


# Chamada pelo frontend uma vez, no início do "Finalizar carrinho" (ver
# frontend/src/carrinho.js) — antes do loop que cria um Aluguel por item.
# O Pedido nasce "vazio" (sem nenhum Aluguel ainda); os Alugueis se associam
# a ele depois, um a um, em POST /alugueis/ (ver pedido_id em AluguelCreate).
@router.post("/", response_model=PedidoOut)
def criar_pedido(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    novo_pedido = Pedido(usuario_id=usuario_atual.id)
    db.add(novo_pedido)
    db.commit()
    db.refresh(novo_pedido)
    return novo_pedido


@router.get("/{pedido_id}/recibo")
def baixar_recibo(
    pedido_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    # Mesmo padrão de checagem de dono usado em criar_aluguel (app/routes/
    # alugueis.py): filtra por usuario_id junto do id, não só pelo id —
    # sem isso, qualquer usuário logado poderia baixar o recibo de outra
    # pessoa só adivinhando o número do pedido na URL.
    pedido = (
        db.query(Pedido)
        .filter(Pedido.id == pedido_id, Pedido.usuario_id == usuario_atual.id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    pdf_bytes = gerar_recibo_pdf(pedido)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        # inline (não attachment): abre o PDF direto no navegador em vez de
        # forçar um download — a pessoa decide se quer salvar (Ctrl+S/ícone
        # de download do próprio visualizador de PDF do navegador).
        headers={"Content-Disposition": f'inline; filename="recibo-pedido-{pedido.id}.pdf"'},
    )
