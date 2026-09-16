import { CATEGORIAS, buscarFilmes } from "./movies.js";
import { formatarPreco, normalizarTexto } from "./utilitarios.js";
import { carregarFavoritos, ehFavorito, alternarFavorito } from "./favoritos.js";
import { abrirModal } from "./modal.js";

const containerCategorias = document.getElementById("categorias");
const containerGrade = document.getElementById("grade-filmes");
const tituloSecao = document.getElementById("titulo-secao");
const campoBusca = document.getElementById("campo-busca");
const selectOrdenar = document.getElementById("ordenar");

let categoriaAtual = "Todos";
let termoBusca = "";
let criterioOrdenacao = "padrao";
let filmes = [];

function ordenarFilmes(lista, criterio) {
  const copia = [...lista];

  switch (criterio) {
    case "preco-asc":
      return copia.sort((a, b) => a.valor - b.valor);
    case "preco-desc":
      return copia.sort((a, b) => b.valor - a.valor);
    case "ano-asc":
      return copia.sort((a, b) => a.ano - b.ano);
    case "ano-desc":
      return copia.sort((a, b) => b.ano - a.ano);
    case "nome":
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    default:
      return copia;
  }
}

function criarBotaoCategoria(nome, ativo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-categoria" + (ativo ? " ativo" : "");
  botao.textContent = nome;
  botao.addEventListener("click", () => selecionarCategoria(nome));
  return botao;
}

function renderizarCategorias(categoriaAtiva) {
  containerCategorias.innerHTML = "";
  containerCategorias.appendChild(criarBotaoCategoria("Todos", categoriaAtiva === "Todos"));
  for (const categoria of CATEGORIAS) {
    containerCategorias.appendChild(criarBotaoCategoria(categoria, categoriaAtiva === categoria));
  }
}

export function criarCardFilme(filme, aoMudarFavorito = renderizarFilmes) {
  const card = document.createElement("article");
  card.className = "card-filme";

  const favoritado = ehFavorito(filme.id);

  card.innerHTML = `
    <div class="capa-placeholder">
      <button
        type="button"
        class="botao-favorito"
        aria-label="${favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
      >${favoritado ? "❤️" : "🤍"}</button>
      <span>${filme.titulo}</span>
      <span class="faixa-etaria">${filme.faixa}</span>
    </div>
    <div class="info-filme">
      <h3>${filme.titulo}</h3>
      <p class="meta">${filme.ano}</p>
      <span class="categoria-tag">${filme.generos.join(", ")}</span>
      <p class="preco-card">${formatarPreco(filme.valor)}</p>
    </div>
  `;

  card.querySelector(".botao-favorito").addEventListener("click", (evento) => {
    evento.stopPropagation();
    alternarFavorito(filme.id, aoMudarFavorito);
  });

  card.addEventListener("click", () => abrirModal(filme));

  return card;
}

function mostrarCarregando() {
  containerGrade.innerHTML = '<p class="carregando">Carregando catálogo...</p>';
}

function mostrarErroCarregamento() {
  containerGrade.innerHTML =
    '<p class="carregando">Não foi possível carregar o catálogo. Verifique se o backend está rodando em localhost:8000.</p>';
}

function renderizarFilmes() {
  const termo = normalizarTexto(termoBusca.trim());

  const filmesFiltrados = ordenarFilmes(
    filmes.filter((filme) => {
      const passaCategoria = categoriaAtual === "Todos" || filme.generos.includes(categoriaAtual);
      const passaBusca = termo === "" || normalizarTexto(filme.titulo).includes(termo);
      return passaCategoria && passaBusca;
    }),
    criterioOrdenacao
  );

  tituloSecao.textContent = categoriaAtual === "Todos" ? "Catálogo completo" : categoriaAtual;

  containerGrade.innerHTML = "";

  if (filmesFiltrados.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.className = "sem-resultados";
    mensagem.textContent = "Nenhum filme encontrado.";
    containerGrade.appendChild(mensagem);
    return;
  }

  for (const filme of filmesFiltrados) {
    containerGrade.appendChild(criarCardFilme(filme));
  }
}

function selecionarCategoria(categoria) {
  categoriaAtual = categoria;
  renderizarCategorias(categoriaAtual);
  renderizarFilmes();
}

campoBusca.addEventListener("input", (evento) => {
  termoBusca = evento.target.value;
  renderizarFilmes();
});

export function obterFilmesFavoritos() {
  return filmes.filter((filme) => ehFavorito(filme.id));
}

export function irParaInicio() {
  termoBusca = "";
  campoBusca.value = "";
  criterioOrdenacao = "padrao";
  selectOrdenar.value = "padrao";
  selecionarCategoria("Todos");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

selectOrdenar.addEventListener("change", (evento) => {
  criterioOrdenacao = evento.target.value;
  renderizarFilmes();
});

export async function iniciarCatalogo() {
  carregarFavoritos();
  mostrarCarregando();

  try {
    filmes = await buscarFilmes();
  } catch (erro) {
    console.error(erro);
    mostrarErroCarregamento();
    return;
  }

  selecionarCategoria("Todos");
}
