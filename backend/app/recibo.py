# Geração do PDF do recibo de um Pedido. Isolado num módulo próprio (em vez
# de ficar dentro da rota) porque montar o PDF é uma responsabilidade
# separada de "responder a uma requisição HTTP" — assim dá pra testar essa
# função sozinha, sem precisar de um Request/Response do FastAPI.
#
# Usa reportlab.platypus (o "layout engine" de mais alto nível do ReportLab):
# em vez de desenhar texto em coordenadas x/y manualmente (a API de mais
# baixo nível, reportlab.pdfgen.canvas), a gente monta uma lista de
# "flowables" (Paragraph, Table, Spacer) e deixa o SimpleDocTemplate decidir
# onde cada um cai na página — inclusive quebrando página sozinho se a
# tabela de itens for grande demais pra caber numa só.
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def formatar_preco(valor: float) -> str:
    # Mesmo formato do formatarPreco() em frontend/src/utilitarios.js —
    # reescrito aqui porque o backend Python não compartilha código com o
    # frontend JS (são dois times/times de execução diferentes).
    return f"R$ {valor:.2f}".replace(".", ",")

styles = getSampleStyleSheet()
estilo_titulo = ParagraphStyle("TituloRecibo", parent=styles["Title"], fontSize=18, spaceAfter=2)
estilo_subtitulo = ParagraphStyle("Subtitulo", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
estilo_secao = ParagraphStyle("Secao", parent=styles["Heading3"], spaceBefore=14, spaceAfter=6)
estilo_aviso = ParagraphStyle("Aviso", parent=styles["Normal"], fontSize=8, textColor=colors.grey, spaceBefore=18)
# Uma Table do ReportLab, por padrão, não quebra linha de texto puro — se a
# célula recebe uma string, ela só estoura a largura da coluna (foi o que
# aconteceu com nomes de agência longos no primeiro teste). Envolver o texto
# num Paragraph resolve isso: Paragraph sabe quebrar linha (word wrap) pra
# caber na largura da coluna.
estilo_celula = ParagraphStyle("Celula", parent=styles["Normal"], fontSize=9, leading=11)
estilo_celula_cabecalho = ParagraphStyle("CelulaCabecalho", parent=estilo_celula, textColor=colors.white, fontName="Helvetica-Bold")


def _endereco_formatado(usuario):
    partes = [usuario.endereco_logradouro, usuario.endereco_numero]
    linha1 = ", ".join(p for p in partes if p)
    if usuario.endereco_complemento:
        linha1 = f"{linha1} - {usuario.endereco_complemento}" if linha1 else usuario.endereco_complemento

    partes2 = [usuario.endereco_bairro, usuario.endereco_cidade, usuario.endereco_estado]
    linha2 = " - ".join(p for p in partes2 if p)
    if usuario.endereco_cep:
        linha2 = f"{linha2} - CEP {usuario.endereco_cep}" if linha2 else f"CEP {usuario.endereco_cep}"

    linhas = [linha for linha in (linha1, linha2) if linha]
    return " / ".join(linhas) if linhas else "Não informado"


def gerar_recibo_pdf(pedido) -> bytes:
    # BytesIO no lugar de um arquivo em disco: o PDF é montado inteiramente
    # em memória e devolvido como bytes — a rota decide o que fazer com eles
    # (nesse caso, mandar direto na resposta HTTP, sem nunca tocar o disco).
    buffer = io.BytesIO()
    documento = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )

    elementos = []

    elementos.append(Paragraph("MOVIEHUSTLER", estilo_titulo))
    elementos.append(Paragraph("Locadora de filmes — CNPJ fictício 00.000.000/0001-00", estilo_subtitulo))
    elementos.append(Spacer(1, 0.5 * cm))

    elementos.append(Paragraph(f"Recibo do Pedido #{pedido.id}", estilo_secao))
    elementos.append(Paragraph(f"Data: {pedido.data_pedido.strftime('%d/%m/%Y às %H:%M')}", styles["Normal"]))

    elementos.append(Paragraph("Cliente", estilo_secao))
    elementos.append(Paragraph(pedido.usuario.nome, styles["Normal"]))
    elementos.append(Paragraph(f"E-mail: {pedido.usuario.email}", styles["Normal"]))
    elementos.append(Paragraph(f"CPF: {pedido.usuario.cpf or 'Não informado'}", styles["Normal"]))
    elementos.append(Paragraph(f"Endereço: {_endereco_formatado(pedido.usuario)}", styles["Normal"]))

    elementos.append(Paragraph("Itens alugados", estilo_secao))

    def celula(texto, cabecalho=False):
        return Paragraph(texto, estilo_celula_cabecalho if cabecalho else estilo_celula)

    linhas_tabela = [[celula("Filme", True), celula("Agência (retirada)", True), celula("Valor", True)]]
    total = 0.0
    for aluguel in pedido.alugueis:
        # valor_pago é o preço congelado no momento do aluguel (ver
        # app/models/aluguel.py) — só cai pro valor atual do filme em
        # aluguéis antigos, criados antes dessa coluna existir.
        valor = aluguel.valor_pago if aluguel.valor_pago is not None else aluguel.filme.valor
        linhas_tabela.append(
            [
                celula(aluguel.filme.titulo),
                celula(f"{aluguel.agencia.nome} — {aluguel.agencia.bairro}"),
                celula(formatar_preco(valor)),
            ]
        )
        total += valor
    linhas_tabela.append([celula(""), celula("<b>Total</b>"), celula(f"<b>{formatar_preco(total)}</b>")])

    tabela = Table(linhas_tabela, colWidths=[6.5 * cm, 6.5 * cm, 4 * cm])
    tabela.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a2b6b")),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -2), 0.5, colors.lightgrey),
                ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elementos.append(tabela)

    # Disclaimer explícito: isto é um comprovante interno, não um documento
    # fiscal emitido junto à Receita/prefeitura (ver conversa sobre NFS-e —
    # emitir de verdade exige CNPJ e integração com um provedor autorizado).
    elementos.append(
        Paragraph(
            "Este comprovante é gerado internamente pelo MovieHustler e não tem valor fiscal "
            "(não é uma Nota Fiscal de Serviço Eletrônica nem qualquer documento emitido junto "
            "à Receita Federal ou prefeitura).",
            estilo_aviso,
        )
    )

    documento.build(elementos)
    return buffer.getvalue()
