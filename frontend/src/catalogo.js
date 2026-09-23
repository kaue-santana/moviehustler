import { buscarFilmes } from "./movies.js";
import { formatarPreco, normalizarTexto } from "./utilitarios.js";
import { carregarFavoritos, ehFavorito, alternarFavorito } from "./favoritos.js";
import { abrirModal } from "./modal.js";

const containerCategorias = document.getElementById("categorias");
const containerGrade = document.getElementById("grade-filmes");
const tituloSecao = document.getElementById("titulo-secao");
const campoBusca = document.getElementById("campo-busca");
const selectOrdenar = document.getElementById("ordenar");

// Estado da tela de catálogo inteiro em módulo (sem framework de estado) —
// toda mudança nesses valores é seguida de uma chamada a renderizarFilmes().
let categoriaAtual = "Todos";
let termoBusca = "";
let criterioOrdenacao = "padrao";
let filmes = [];
let categoriasDisponiveis = [];

// A lista de categorias não é mais fixa no código — vem dos gêneros que os
// filmes de verdade da TMDb realmente têm, ordenada do gênero com mais
// filmes pro com menos (é o que também define a ordem das fileiras na tela
// inicial, estilo streaming).
function calcularCategoriasDisponiveis() {
  const contagem = new Map();
  for (const filme of filmes) {
    for (const genero of filme.generos) {
      contagem.set(genero, (contagem.get(genero) ?? 0) + 1);
    }
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([genero]) => genero);
}

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
  for (const categoria of categoriasDisponiveis) {
    containerCategorias.appendChild(criarBotaoCategoria(categoria, categoriaAtiva === categoria));
  }
}

// Exportada (não só usada internamente) porque perfil.js reaproveita esta
// mesma função pra desenhar os cards de favoritos — um único template de
// card pro app inteiro, em vez de duplicar o HTML em dois lugares.
export function criarCardFilme(filme, aoMudarFavorito = renderizarFilmes) {
  const card = document.createElement("article");
  card.className = "card-filme";

  const favoritado = ehFavorito(filme.id);
  const temPoster = Boolean(filme.poster_url);
  const estiloCapa = temPoster ? ` style="background-image: url('${filme.poster_url}')"` : "";

  card.innerHTML = `
    <div class="capa-placeholder ${temPoster ? "capa-com-poster" : ""}"${estiloCapa}>
      <button
        type="button"
        class="botao-favorito"
        aria-label="${favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
      >${favoritado ? "❤️" : "🤍"}</button>
      ${temPoster ? "" : `<span>${filme.titulo}</span>`}
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

// Fileiras por gênero (estilo streaming) só fazem sentido na navegação
// "solta" — sem busca, sem ordenação escolhida, sem categoria específica.
// Qualquer filtro ativo já é uma intenção explícita de ver uma lista única
// de resultados, então cai pra grade tradicional.
function estaNaNavegacaoInicial() {
  return categoriaAtual === "Todos" && termoBusca.trim() === "" && criterioOrdenacao === "padrao";
}

function renderizarFileirasPorGenero() {
  containerGrade.className = "grade-fileiras";
  containerGrade.innerHTML = "";

  for (const genero of categoriasDisponiveis) {
    const filmesDoGenero = filmes.filter((filme) => filme.generos.includes(genero));
    if (filmesDoGenero.length === 0) continue;

    const secao = document.createElement("section");
    secao.className = "fileira-genero";

    const titulo = document.createElement("h3");
    titulo.className = "fileira-titulo";
    titulo.textContent = genero;
    secao.appendChild(titulo);

    const trilho = document.createElement("div");
    trilho.className = "fileira-trilho";
    for (const filme of filmesDoGenero) {
      trilho.appendChild(criarCardFilme(filme));
    }
    secao.appendChild(trilho);

    containerGrade.appendChild(secao);
  }
}

function renderizarFilmes() {
  tituloSecao.hidden = estaNaNavegacaoInicial();

  if (estaNaNavegacaoInicial()) {
    renderizarFileirasPorGenero();
    return;
  }

  const termo = normalizarTexto(termoBusca.trim());

  const filmesFiltrados = ordenarFilmes(
    filmes.filter((filme) => {
      const passaCategoria = categoriaAtual === "Todos" || filme.generos.includes(categoriaAtual);
      const passaBusca = termo === "" || normalizarTexto(filme.titulo).includes(termo);
      return passaCategoria && passaBusca;
    }),
    criterioOrdenacao
  );

  tituloSecao.textContent = categoriaAtual === "Todos" ? "Resultados da busca" : categoriaAtual;

  containerGrade.className = "grade-filmes";
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

export function atualizarCardsFavoritos() {
  renderizarFilmes();
}

// Usada pelo logo/link "início" — reseta todos os filtros de volta ao
// estado inicial da navegação (fileiras por gênero) e rola pro topo.
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

  categoriasDisponiveis = calcularCategoriasDisponiveis();
  selecionarCategoria("Todos");
}
