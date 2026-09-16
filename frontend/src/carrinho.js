import { formatarPreco } from "./utilitarios.js";

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
    titulo: filme.titulo,
    valor: filme.valor,
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

botaoFinalizar.addEventListener("click", () => {
  carrinho = [];
  atualizarContadorCarrinho();
  renderizarCarrinho();
  salvarCarrinho();
  fecharCarrinho();
  alert("Aluguel finalizado! Seus filmes vão te esperar nas agências escolhidas.");
});

export function iniciarCarrinho() {
  carregarCarrinhoSalvo();
  atualizarContadorCarrinho();
}
