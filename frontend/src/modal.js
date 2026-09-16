import { buscarAgencias } from "./movies.js";
import { formatarPreco } from "./utilitarios.js";
import { adicionarAoCarrinho } from "./carrinho.js";
import { estaLogado } from "./auth.js";
import { abrirConta } from "./conta.js";

let agencias = [];

const modalFundo = document.getElementById("modal-fundo");
const modalPoster = document.getElementById("modal-poster");
const modalTitulo = document.getElementById("modal-titulo");
const modalDuracao = document.getElementById("modal-duracao");
const modalDiretor = document.getElementById("modal-diretor");
const modalGenero = document.getElementById("modal-genero");
const modalSinopse = document.getElementById("modal-sinopse");
const modalStreamingsLista = document.getElementById("modal-streamings-lista");
const botaoFecharModal = document.getElementById("modal-fechar");
const modalPreco = document.getElementById("modal-preco");
const selectAgencia = document.getElementById("select-agencia");
const botaoAlugar = document.getElementById("botao-alugar");
const mensagemAluguel = document.getElementById("mensagem-aluguel");

export function abrirModal(filme) {
  modalPoster.textContent = filme.titulo;
  modalTitulo.textContent = filme.titulo;
  modalDuracao.textContent = `Duração: ${filme.duracao}`;
  modalDiretor.textContent = `Direção: ${filme.diretor}`;
  const rotuloGenero = filme.generos.length > 1 ? "Gêneros" : "Gênero";
  modalGenero.textContent = `${rotuloGenero}: ${filme.generos.join(", ")}`;
  modalSinopse.textContent = filme.sinopse;

  modalStreamingsLista.innerHTML = "";
  for (const streaming of filme.streamings) {
    const pill = document.createElement("span");
    pill.className = "pill-streaming";
    pill.textContent = streaming;
    modalStreamingsLista.appendChild(pill);
  }

  modalPreco.textContent = `${formatarPreco(filme.valor)} / aluguel`;

  selectAgencia.innerHTML = "";
  for (const agencia of agencias) {
    const opcao = document.createElement("option");
    opcao.value = agencia.id;
    opcao.textContent = `${agencia.nome} — ${agencia.bairro}`;
    selectAgencia.appendChild(opcao);
  }

  const temAgencias = agencias.length > 0;
  selectAgencia.disabled = !temAgencias;
  botaoAlugar.disabled = !temAgencias;
  botaoAlugar.textContent = estaLogado() ? "Alugar agora" : "Entrar para alugar";
  mensagemAluguel.hidden = true;
  botaoAlugar.onclick = () => confirmarAluguel(filme);

  modalFundo.classList.add("aberto");
}

function confirmarAluguel(filme) {
  if (!estaLogado()) {
    fecharModal();
    abrirConta();
    return;
  }

  const agenciaEscolhida = agencias.find((a) => a.id === Number(selectAgencia.value));

  adicionarAoCarrinho(filme, agenciaEscolhida);

  selectAgencia.disabled = true;
  botaoAlugar.disabled = true;
  botaoAlugar.textContent = "Adicionado ao carrinho ✓";
  mensagemAluguel.textContent = `"${filme.titulo}" adicionado ao carrinho! Retirada em ${agenciaEscolhida.nome} (${agenciaEscolhida.bairro}). O aluguel só é confirmado ao finalizar no carrinho.`;
  mensagemAluguel.hidden = false;
}

export function fecharModal() {
  modalFundo.classList.remove("aberto");
}

export async function iniciarModal() {
  try {
    agencias = await buscarAgencias();
  } catch (erro) {
    console.error("Não foi possível carregar as agências.", erro);
  }
}

botaoFecharModal.addEventListener("click", fecharModal);

modalFundo.addEventListener("click", (evento) => {
  if (evento.target === modalFundo) {
    fecharModal();
  }
});
