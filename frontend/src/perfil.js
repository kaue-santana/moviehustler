import { estaLogado, obterUsuario, sair } from "./auth.js";
import { abrirConta, iniciarConta } from "./conta.js";
import { obterFilmesFavoritos, criarCardFilme, atualizarCardsFavoritos } from "./catalogo.js";
import { carregarFavoritos, sincronizarFavoritosAposLogin } from "./favoritos.js";
import { buscarMeusAlugueis } from "./movies.js";
import { formatarPreco } from "./utilitarios.js";
import { obterTema, definirTema } from "./tema.js";

const botoesDeslogado = document.getElementById("botoes-deslogado");
const perfilWrap = document.getElementById("perfil-wrap");
const botaoEntrar = document.getElementById("botao-entrar");
const botaoCriarConta = document.getElementById("botao-criar-conta");
const botaoPerfil = document.getElementById("botao-perfil");
const avatarPerfil = document.getElementById("avatar-perfil");
const nomePerfil = document.getElementById("nome-perfil");
const menuPerfil = document.getElementById("menu-perfil");

const painelFundo = document.getElementById("painel-fundo");
const painelFechar = document.getElementById("painel-fechar");
const painelTitulo = document.getElementById("painel-titulo");
const painelConteudo = document.getElementById("painel-conteudo");

function atualizarAreaConta() {
  const logado = estaLogado();
  botoesDeslogado.hidden = logado;
  perfilWrap.hidden = !logado;

  if (logado) {
    const usuario = obterUsuario();
    const nome = usuario?.nome ?? "Você";
    nomePerfil.textContent = nome.split(" ")[0];
    avatarPerfil.textContent = nome.charAt(0).toUpperCase();
  }
}

function abrirMenu() {
  menuPerfil.hidden = false;
  botaoPerfil.setAttribute("aria-expanded", "true");
}

export function fecharMenu() {
  menuPerfil.hidden = true;
  botaoPerfil.setAttribute("aria-expanded", "false");
}

export function abrirPainel(titulo) {
  painelTitulo.textContent = titulo;
  painelFundo.classList.add("aberto");
}

export function fecharPainel() {
  painelFundo.classList.remove("aberto");
}

function renderizarPerfil() {
  const usuario = obterUsuario();
  painelConteudo.innerHTML = `
    <div class="painel-perfil-info">
      <span class="avatar-perfil avatar-perfil-grande">${(usuario?.nome ?? "?").charAt(0).toUpperCase()}</span>
      <div>
        <p class="painel-perfil-nome">${usuario?.nome ?? ""}</p>
        <p class="painel-perfil-email">${usuario?.email ?? ""}</p>
      </div>
    </div>
  `;
}

async function renderizarPedidos() {
  painelConteudo.innerHTML = '<p class="painel-carregando">Carregando pedidos...</p>';

  let pedidos;
  try {
    pedidos = await buscarMeusAlugueis();
  } catch (erro) {
    console.error(erro);
    painelConteudo.innerHTML = '<p class="painel-carregando">Não foi possível carregar seus pedidos.</p>';
    return;
  }

  if (pedidos.length === 0) {
    painelConteudo.innerHTML = '<p class="painel-carregando">Você ainda não alugou nenhum filme.</p>';
    return;
  }

  painelConteudo.innerHTML = pedidos
    .map((pedido) => {
      const data = new Date(pedido.data_aluguel).toLocaleDateString("pt-BR");
      return `
        <div class="pedido-item">
          <div>
            <p class="pedido-titulo">${pedido.filme.titulo}</p>
            <p class="pedido-meta">${pedido.agencia.nome} — ${pedido.agencia.bairro} · ${data}</p>
          </div>
          <span class="pedido-preco">${formatarPreco(pedido.filme.valor)}</span>
        </div>
      `;
    })
    .join("");
}

function renderizarFavoritos() {
  const favoritos = obterFilmesFavoritos();

  if (favoritos.length === 0) {
    painelConteudo.innerHTML = '<p class="painel-carregando">Você ainda não favoritou nenhum filme.</p>';
    return;
  }

  painelConteudo.innerHTML = "";
  const grade = document.createElement("div");
  grade.className = "grade-filmes painel-grade-filmes";

  for (const filme of favoritos) {
    grade.appendChild(criarCardFilme(filme, renderizarFavoritos));
  }

  painelConteudo.appendChild(grade);
}

function renderizarConfiguracoes() {
  const temaAtual = obterTema();
  const opcoes = [
    { valor: "claro", rotulo: "Claro" },
    { valor: "escuro", rotulo: "Escuro" },
    { valor: "sistema", rotulo: "Padrão do sistema" },
  ];

  painelConteudo.innerHTML = `
    <p class="config-secao-titulo">Aparência</p>
    <div class="config-tema" id="config-tema">
      ${opcoes
        .map(
          (opcao) => `
        <label class="config-tema-opcao">
          <input type="radio" name="tema" value="${opcao.valor}" ${opcao.valor === temaAtual ? "checked" : ""} />
          ${opcao.rotulo}
        </label>
      `
        )
        .join("")}
    </div>
    <p class="config-em-breve">Mais configurações da conta chegam em breve.</p>
  `;

  document.getElementById("config-tema").addEventListener("change", (evento) => {
    definirTema(evento.target.value);
  });
}

menuPerfil.addEventListener("click", (evento) => {
  const item = evento.target.closest(".item-menu-perfil");
  if (!item) return;

  const acao = item.dataset.acao;
  fecharMenu();

  if (acao === "perfil") {
    renderizarPerfil();
    abrirPainel("Perfil");
  } else if (acao === "pedidos") {
    abrirPainel("Pedidos");
    renderizarPedidos();
  } else if (acao === "favoritos") {
    renderizarFavoritos();
    abrirPainel("Favoritos");
  } else if (acao === "configuracoes") {
    renderizarConfiguracoes();
    abrirPainel("Configurações");
  } else if (acao === "sair") {
    sair();
    atualizarAreaConta();
    carregarFavoritos().then(atualizarCardsFavoritos);
  }
});

botaoPerfil.addEventListener("click", () => {
  if (menuPerfil.hidden) {
    abrirMenu();
  } else {
    fecharMenu();
  }
});

document.addEventListener("click", (evento) => {
  if (!menuPerfil.hidden && !evento.target.closest(".perfil-wrap")) {
    fecharMenu();
  }
});

botaoEntrar.addEventListener("click", () => abrirConta("login"));
botaoCriarConta.addEventListener("click", () => abrirConta("cadastro"));

painelFechar.addEventListener("click", fecharPainel);

painelFundo.addEventListener("click", (evento) => {
  if (evento.target === painelFundo) {
    fecharPainel();
  }
});

async function aoAutenticar() {
  await sincronizarFavoritosAposLogin();
  atualizarAreaConta();
  atualizarCardsFavoritos();
}

window.addEventListener("sessao-expirada", () => {
  fecharMenu();
  fecharPainel();
  atualizarAreaConta();
  atualizarCardsFavoritos();
  abrirConta("login", "Sua sessão expirou. Faça login novamente.");
});

export function iniciarPerfil() {
  atualizarAreaConta();
  iniciarConta(aoAutenticar);
}
