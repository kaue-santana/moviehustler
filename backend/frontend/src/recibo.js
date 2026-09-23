// Modal que mostra o PDF do recibo dentro da própria página, num <iframe> —
// em vez de window.open() numa aba nova. Isso é proposital: o PDF só chega
// depois de um fetch autenticado (com await), então na hora em que a gente
// teria o Blob pronto pra abrir, o navegador já não considera mais isso
// "resultado direto de um clique do usuário" — e bloqueia window.open()
// como popup. Um <iframe> dentro de um modal já existente na página não
// esbarra nessa regra.
import { buscarReciboPedido } from "./movies.js";

const reciboFundo = document.getElementById("recibo-fundo");
const reciboFechar = document.getElementById("recibo-fechar");
const reciboIframe = document.getElementById("recibo-iframe");

// Guarda a URL do Blob atual pra poder liberar a memória (revokeObjectURL)
// quando o modal fecha ou um recibo novo é aberto — sem isso, cada recibo
// aberto ficaria ocupando memória pelo resto da sessão da página.
let urlAtual = null;

function liberarUrlAtual() {
  if (urlAtual) {
    URL.revokeObjectURL(urlAtual);
    urlAtual = null;
  }
}

export async function abrirRecibo(pedidoId) {
  reciboIframe.src = "about:blank";
  reciboFundo.classList.add("aberto");

  try {
    const blob = await buscarReciboPedido(pedidoId);
    liberarUrlAtual();
    urlAtual = URL.createObjectURL(blob);
    reciboIframe.src = urlAtual;
  } catch (erro) {
    console.error(erro);
    // Sem elemento de mensagem de erro dedicado no modal — como isso só
    // pode falhar por rede/servidor (o pedido acabou de ser criado com
    // sucesso, então "não existe" não é um caso real aqui), um alert simples
    // já cobre o caso raro sem precisar de mais UI só pra isso.
    // NOTA: "Meus pedidos" ainda não tem um jeito de reabrir o recibo depois
    // (lista aluguéis avulsos, não pedidos) — se essa falha acontecer, o
    // usuário perde o acesso ao PDF por ora. Melhorar isso é trabalho futuro.
    alert("Não foi possível carregar o recibo, mas seu aluguel foi registrado normalmente.");
    fecharRecibo();
  }
}

export function fecharRecibo() {
  reciboFundo.classList.remove("aberto");
  reciboIframe.src = "about:blank";
  liberarUrlAtual();
}

reciboFechar.addEventListener("click", fecharRecibo);

reciboFundo.addEventListener("click", (evento) => {
  if (evento.target === reciboFundo) {
    fecharRecibo();
  }
});
