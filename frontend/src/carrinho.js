import { formatarPreco } from "./utilitarios.js";
import { criarAluguel } from "./movies.js";

const CHAVE_CARRINHO = "moviehustler_carrinho";

let carrinho = [];
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

  const falharam = [];

  for (const item of carrinho) {
    try {
      await criarAluguel(item.filmeId, item.agenciaId);
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
    alert("Aluguel finalizado! Seus filmes vão te esperar nas agências escolhidas.");
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
