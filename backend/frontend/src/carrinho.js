// O carrinho é puramente local (localStorage) até o clique em "Finalizar" —
// nada é enviado ao backend enquanto os itens estão só "na sacola". Isso é
// intencional (ver o bug antigo mencionado no README: o carrinho já foi
// "fake" no sentido de o aluguel acontecer cedo demais, antes de finalizar).
import { formatarPreco } from "./utilitarios.js";
import { criarPedido, criarAluguel } from "./movies.js";
import { abrirRecibo } from "./recibo.js";

const CHAVE_CARRINHO = "moviehustler_carrinho";

let carrinho = [];
// Id local, só pra identificar linhas do carrinho na tela (não tem relação
// com nenhum id do backend — os Alugueis só existem depois de finalizar).
let proximoIdCarrinho = 1;

const botaoCarrinho = document.getElementById("botao-carrinho");
const carrinhoContador = document.getElementById("carrinho-contador");
const carrinhoFundo = document.getElementById("carrinho-fundo");
const carrinhoLista = document.getElementById("carrinho-lista");
const carrinhoTotal = document.getElementById("carrinho-total");
const carrinhoFechar = document.getElementById("carrinho-fechar");
const botaoFinalizar = document.getElementById("botao-finalizar");
const mensagemCarrinho = document.getElementById("mensagem-carrinho");

function salvarCarrinho() {
  try {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  } catch (erro) {
    console.warn("Não foi possível salvar o carrinho no localStorage.", erro);
  }
}

function carregarCarrinhoSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_CARRINHO);
    if (!salvo) return;

    carrinho = JSON.parse(salvo);
    // Continua a contagem de onde parou (não reinicia em 1) pra nunca gerar
    // um idCarrinho duplicado entre o que já estava salvo e itens novos.
    if (carrinho.length > 0) {
      proximoIdCarrinho = Math.max(...carrinho.map((item) => item.idCarrinho)) + 1;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar o carrinho salvo.", erro);
    carrinho = [];
  }
}

export function adicionarAoCarrinho(filme, agencia) {
  carrinho.push({
    idCarrinho: proximoIdCarrinho++,
    filmeId: filme.id,
    titulo: filme.titulo,
    // Copia o valor do filme NO MOMENTO de adicionar ao carrinho. Se o
    // preço do filme mudar no catálogo depois, o item já no carrinho não
    // muda — mas repare que isso é só cosmético: o valor final de verdade
    // é decidido pelo backend quando o aluguel é criado (ver nota em
    // app/models/filme.py sobre o preço ser lido "ao vivo" do Filme).
    valor: filme.valor,
    agenciaId: agencia.id,
    agenciaNome: agencia.nome,
    agenciaBairro: agencia.bairro,
  });

  atualizarContadorCarrinho();
  salvarCarrinho();
}

function removerDoCarrinho(idCarrinho) {
  carrinho = carrinho.filter((item) => item.idCarrinho !== idCarrinho);
  atualizarContadorCarrinho();
  renderizarCarrinho();
  salvarCarrinho();
}

function atualizarContadorCarrinho() {
  carrinhoContador.textContent = carrinho.length;
  carrinhoContador.hidden = carrinho.length === 0;
}

function renderizarCarrinho() {
  carrinhoLista.innerHTML = "";

  if (carrinho.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "carrinho-vazio";
    vazio.textContent = "Seu carrinho está vazio.";
    carrinhoLista.appendChild(vazio);
    carrinhoTotal.textContent = "";
    botaoFinalizar.disabled = true;
    return;
  }

  let total = 0;

  for (const item of carrinho) {
    total += item.valor;

    const linha = document.createElement("div");
    linha.className = "item-carrinho";
    linha.innerHTML = `
      <div>
        <strong>${item.titulo}</strong>
        <p class="item-carrinho-meta">${item.agenciaNome} — ${item.agenciaBairro}</p>
      </div>
      <div class="item-carrinho-direita">
        <span>${formatarPreco(item.valor)}</span>
        <button type="button" class="botao-remover-item" aria-label="Remover do carrinho">&times;</button>
      </div>
    `;

    linha.querySelector(".botao-remover-item").addEventListener("click", () => {
      removerDoCarrinho(item.idCarrinho);
    });

    carrinhoLista.appendChild(linha);
  }

  carrinhoTotal.textContent = `Total: ${formatarPreco(total)}`;
  botaoFinalizar.disabled = false;
}

export function abrirCarrinho() {
  renderizarCarrinho();
  carrinhoFundo.classList.add("aberto");
}

export function fecharCarrinho() {
  carrinhoFundo.classList.remove("aberto");
}

botaoCarrinho.addEventListener("click", abrirCarrinho);
carrinhoFechar.addEventListener("click", fecharCarrinho);

carrinhoFundo.addEventListener("click", (evento) => {
  if (evento.target === carrinhoFundo) {
    fecharCarrinho();
  }
});

botaoFinalizar.addEventListener("click", async () => {
  botaoFinalizar.disabled = true;
  botaoFinalizar.textContent = "Finalizando...";
  mensagemCarrinho.hidden = true;

  // Cria o "cabeçalho" do pedido primeiro — se isso falhar (rede caiu, token
  // expirou etc), nem começa a criar aluguéis: sem pedido_id não tem como
  // agrupar os itens, então é melhor abortar cedo do que criar aluguéis órfãos.
  let pedido;
  try {
    pedido = await criarPedido();
  } catch (erro) {
    console.error(erro);
    botaoFinalizar.disabled = false;
    botaoFinalizar.textContent = "Finalizar aluguel";
    mensagemCarrinho.textContent = "Não foi possível iniciar o pedido. Tente novamente.";
    mensagemCarrinho.hidden = false;
    return;
  }

  const falharam = [];

  // Um POST /alugueis/ por item — não é uma transação atômica no backend
  // (não existe "tudo ou nada"): se o item 2 de 3 falhar, os itens 1 e 3
  // já viraram Aluguel de verdade no banco, associados ao mesmo pedido.id.
  // Por isso o tratamento abaixo é per-item: só os que falharam voltam pro
  // carrinho, os que deram certo já saem da lista mesmo que outros tenham
  // falhado. LIMITAÇÃO CONHECIDA: se a pessoa clicar em "Finalizar" de novo
  // pro que sobrou, isso cria um Pedido NOVO — os itens que falharam na
  // primeira tentativa acabam num pedido diferente dos que já tinham dado
  // certo. Aceitável por ora (ainda não geramos o recibo de verdade);
  // resolver isso deixaria de ser um passo pequeno.
  for (const item of carrinho) {
    try {
      await criarAluguel(item.filmeId, item.agenciaId, pedido.id);
    } catch (erro) {
      console.error(erro);
      falharam.push(item);
    }
  }

  carrinho = falharam;
  atualizarContadorCarrinho();
  renderizarCarrinho();
  salvarCarrinho();
  botaoFinalizar.textContent = "Finalizar aluguel";

  if (falharam.length === 0) {
    fecharCarrinho();
    // Abre o recibo em PDF do pedido que acabou de ser fechado — troca o
    // alert() genérico de antes por um documento de verdade, com os itens
    // e o total. Ver recibo.js pro porquê disso ser um modal com <iframe>
    // em vez de window.open() numa aba nova.
    abrirRecibo(pedido.id);
    return;
  }

  botaoFinalizar.disabled = false;
  const plural = falharam.length > 1;
  mensagemCarrinho.textContent = `Não foi possível registrar ${falharam.length} ite${plural ? "ns" : "m"} (${falharam
    .map((item) => item.titulo)
    .join(", ")}). Os outros foram alugados normalmente — tente de novo pro que sobrou.`;
  mensagemCarrinho.hidden = false;
});

export function iniciarCarrinho() {
  carregarCarrinhoSalvo();
  atualizarContadorCarrinho();
}
