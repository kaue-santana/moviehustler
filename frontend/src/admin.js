import { estaLogado, obterUsuario, login, sair } from "./auth.js";
import { formatarPreco } from "./utilitarios.js";
import { buscarFilmes, criarFilme, atualizarFilme, removerFilme } from "./movies.js";
import {
  buscarClientes,
  buscarVendas,
  buscarDevolucoes,
  registrarDevolucao,
  buscarFaturamentoMensal,
  buscarFilmesMaisAlugados,
  buscarFaturamentoMedio,
} from "./adminApi.js";

const loginAdmin = document.getElementById("login-admin");
const painelAdmin = document.getElementById("painel-admin");
const formLoginAdmin = document.getElementById("form-login-admin");
const mensagemLoginAdmin = document.getElementById("admin-login-mensagem");
const nomeAdmin = document.getElementById("admin-nome");
const botaoSairAdmin = document.getElementById("admin-sair");
const abas = document.getElementById("admin-abas");
const conteudo = document.getElementById("admin-conteudo");

let abaAtual = "visao-geral";

function mostrarLogin(mensagem) {
  painelAdmin.hidden = true;
  loginAdmin.hidden = false;
  mensagemLoginAdmin.hidden = !mensagem;
  if (mensagem) mensagemLoginAdmin.textContent = mensagem;
}

function mostrarPainel() {
  loginAdmin.hidden = true;
  painelAdmin.hidden = false;
  nomeAdmin.textContent = obterUsuario()?.nome ?? "";
  renderizarAba(abaAtual);
}

formLoginAdmin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagemLoginAdmin.hidden = true;

  const email = document.getElementById("admin-email").value;
  const senha = document.getElementById("admin-senha").value;

  try {
    const usuario = await login(email, senha);
    if (!usuario.is_admin) {
      sair();
      mostrarLogin("Essa conta não tem acesso administrativo.");
      return;
    }
    formLoginAdmin.reset();
    mostrarPainel();
  } catch (erro) {
    mostrarLogin(erro.message);
  }
});

botaoSairAdmin.addEventListener("click", () => {
  sair();
  mostrarLogin();
});

abas.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".admin-aba");
  if (!botao) return;

  abaAtual = botao.dataset.aba;
  for (const item of abas.children) {
    item.classList.toggle("ativa", item === botao);
  }
  renderizarAba(abaAtual);
});

async function renderizarAba(aba) {
  conteudo.innerHTML = '<p class="admin-carregando">Carregando...</p>';

  try {
    if (aba === "visao-geral") await renderizarVisaoGeral();
    else if (aba === "clientes") await renderizarClientes();
    else if (aba === "vendas") await renderizarVendas();
    else if (aba === "produtos") await renderizarProdutos();
    else if (aba === "devolucoes") await renderizarDevolucoes();
  } catch (erro) {
    console.error(erro);
    conteudo.innerHTML = `<p class="admin-erro">Não foi possível carregar: ${erro.message}</p>`;
  }
}

function formatarMes(dataIso) {
  return new Date(dataIso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

async function renderizarVisaoGeral() {
  const [faturamentoMedio, faturamentoMensal, maisAlugados] = await Promise.all([
    buscarFaturamentoMedio(),
    buscarFaturamentoMensal(),
    buscarFilmesMaisAlugados(),
  ]);

  conteudo.innerHTML = `
    <div class="admin-cards">
      <div class="admin-card">
        <span class="admin-card-rotulo">Ticket médio por aluguel</span>
        <span class="admin-card-valor">${formatarPreco(faturamentoMedio.ticket_medio)}</span>
      </div>
      <div class="admin-card">
        <span class="admin-card-rotulo">Faturamento médio mensal</span>
        <span class="admin-card-valor">${formatarPreco(faturamentoMedio.media_mensal)}</span>
      </div>
    </div>

    <h2 class="admin-secao-titulo">Faturamento por mês</h2>
    ${
      faturamentoMensal.length === 0
        ? '<p class="admin-vazio">Nenhum aluguel registrado ainda.</p>'
        : `<table class="admin-tabela">
            <thead><tr><th>Mês</th><th>Aluguéis</th><th>Faturamento</th></tr></thead>
            <tbody>
              ${faturamentoMensal
                .map(
                  (item) => `
                <tr>
                  <td>${formatarMes(item.mes)}</td>
                  <td>${item.total_alugueis}</td>
                  <td>${formatarPreco(item.faturamento)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>`
    }

    <h2 class="admin-secao-titulo">Filmes mais alugados</h2>
    ${
      maisAlugados.length === 0
        ? '<p class="admin-vazio">Nenhum aluguel registrado ainda.</p>'
        : `<table class="admin-tabela">
            <thead><tr><th>Filme</th><th>Total de aluguéis</th></tr></thead>
            <tbody>
              ${maisAlugados
                .map((item) => `<tr><td>${item.titulo}</td><td>${item.total_alugueis}</td></tr>`)
                .join("")}
            </tbody>
          </table>`
    }
  `;
}

async function renderizarClientes() {
  const clientes = await buscarClientes();

  conteudo.innerHTML = `
    <h2 class="admin-secao-titulo">Clientes (${clientes.length})</h2>
    <table class="admin-tabela">
      <thead><tr><th>Nome</th><th>E-mail</th><th>Admin</th></tr></thead>
      <tbody>
        ${clientes
          .map((c) => `<tr><td>${c.nome}</td><td>${c.email}</td><td>${c.is_admin ? "Sim" : "—"}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

async function renderizarVendas() {
  const [vendas, devolucoes] = await Promise.all([buscarVendas(), buscarDevolucoes()]);
  const devolvidos = new Set(devolucoes.map((d) => d.aluguel.id));

  conteudo.innerHTML = `
    <h2 class="admin-secao-titulo">Vendas (${vendas.length})</h2>
    <table class="admin-tabela">
      <thead><tr><th>Filme</th><th>Cliente</th><th>Agência</th><th>Data</th><th>Valor</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${vendas
          .map((venda) => {
            const devolvido = devolvidos.has(venda.id);
            return `
              <tr>
                <td>${venda.filme.titulo}</td>
                <td>${venda.usuario.nome}</td>
                <td>${venda.agencia.nome}</td>
                <td>${new Date(venda.data_aluguel).toLocaleDateString("pt-BR")}</td>
                <td>${formatarPreco(venda.filme.valor)}</td>
                <td>${devolvido ? "Devolvido" : "Em posse do cliente"}</td>
                <td>${
                  devolvido
                    ? ""
                    : `<button type="button" class="admin-botao-mini" data-aluguel="${venda.id}">Marcar devolução</button>`
                }</td>
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;

  for (const botao of conteudo.querySelectorAll("[data-aluguel]")) {
    botao.addEventListener("click", async () => {
      botao.disabled = true;
      try {
        await registrarDevolucao(Number(botao.dataset.aluguel));
        renderizarVendas();
      } catch (erro) {
        alert(erro.message);
        botao.disabled = false;
      }
    });
  }
}

function preencherFormFilme(form, filme) {
  form.elements.titulo.value = filme.titulo;
  form.elements.generos.value = filme.generos.join(", ");
  form.elements.ano.value = filme.ano;
  form.elements.faixa.value = filme.faixa;
  form.elements.duracao.value = filme.duracao;
  form.elements.diretor.value = filme.diretor;
  form.elements.sinopse.value = filme.sinopse;
  form.elements.streamings.value = filme.streamings.join(", ");
  form.elements.valor.value = filme.valor;
}

function entrarModoEdicao(form, filme) {
  form.dataset.editando = filme.id;
  preencherFormFilme(form, filme);
  document.getElementById("form-filme-titulo").textContent = `Editando "${filme.titulo}"`;
  document.getElementById("form-filme-enviar").textContent = "Salvar edição";
  document.getElementById("form-filme-cancelar").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function sairModoEdicao(form) {
  delete form.dataset.editando;
  form.reset();
  document.getElementById("form-filme-titulo").textContent = "Adicionar filme";
  document.getElementById("form-filme-enviar").textContent = "Adicionar filme";
  document.getElementById("form-filme-cancelar").hidden = true;
}

async function renderizarProdutos() {
  const filmes = await buscarFilmes();

  conteudo.innerHTML = `
    <h2 class="admin-secao-titulo">Produtos (${filmes.length})</h2>

    <form id="form-novo-filme" class="admin-form-filme">
      <p class="admin-form-filme-titulo" id="form-filme-titulo">Adicionar filme</p>
      <input type="text" name="titulo" placeholder="Título" required />
      <input type="text" name="generos" placeholder="Gêneros (separados por vírgula)" required />
      <input type="number" name="ano" placeholder="Ano" required />
      <input type="text" name="faixa" placeholder="Faixa etária" required />
      <input type="text" name="duracao" placeholder="Duração (ex: 100 min)" required />
      <input type="text" name="diretor" placeholder="Diretor" required />
      <input type="text" name="sinopse" placeholder="Sinopse" required />
      <input type="text" name="streamings" placeholder="Streamings (separados por vírgula)" required />
      <input type="number" step="0.01" name="valor" placeholder="Valor" required />
      <div class="admin-form-filme-acoes">
        <button type="submit" class="botao-conta-enviar" id="form-filme-enviar">Adicionar filme</button>
        <button type="button" class="admin-botao-mini" id="form-filme-cancelar" hidden>Cancelar edição</button>
      </div>
      <p class="mensagem-conta" id="mensagem-novo-filme" hidden></p>
    </form>

    <table class="admin-tabela">
      <thead><tr><th>Título</th><th>Ano</th><th>Valor</th><th></th></tr></thead>
      <tbody>
        ${filmes
          .map(
            (filme) => `
          <tr>
            <td>${filme.titulo}</td>
            <td>${filme.ano}</td>
            <td>${formatarPreco(filme.valor)}</td>
            <td>
              <button type="button" class="admin-botao-mini" data-editar="${filme.id}">Editar</button>
              <button type="button" class="admin-botao-mini admin-botao-perigo" data-remover="${filme.id}">Remover</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  const form = document.getElementById("form-novo-filme");
  const mensagem = document.getElementById("mensagem-novo-filme");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.hidden = true;
    const dados = new FormData(form);
    const filmeEditado = {
      titulo: dados.get("titulo"),
      generos: dados
        .get("generos")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      ano: Number(dados.get("ano")),
      faixa: dados.get("faixa"),
      duracao: dados.get("duracao"),
      diretor: dados.get("diretor"),
      sinopse: dados.get("sinopse"),
      streamings: dados
        .get("streamings")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      valor: Number(dados.get("valor")),
    };

    try {
      if (form.dataset.editando) {
        await atualizarFilme(Number(form.dataset.editando), filmeEditado);
      } else {
        await criarFilme(filmeEditado);
      }
      renderizarProdutos();
    } catch (erro) {
      mensagem.textContent = erro.message;
      mensagem.hidden = false;
    }
  });

  document.getElementById("form-filme-cancelar").addEventListener("click", () => sairModoEdicao(form));

  for (const botao of conteudo.querySelectorAll("[data-editar]")) {
    botao.addEventListener("click", () => {
      const filme = filmes.find((f) => f.id === Number(botao.dataset.editar));
      entrarModoEdicao(form, filme);
    });
  }

  for (const botao of conteudo.querySelectorAll("[data-remover]")) {
    botao.addEventListener("click", async () => {
      if (!confirm("Remover esse filme do catálogo?")) return;
      try {
        await removerFilme(Number(botao.dataset.remover));
        renderizarProdutos();
      } catch (erro) {
        alert(erro.message);
      }
    });
  }
}

async function renderizarDevolucoes() {
  const devolucoes = await buscarDevolucoes();

  conteudo.innerHTML = `
    <h2 class="admin-secao-titulo">Devoluções (${devolucoes.length})</h2>
    ${
      devolucoes.length === 0
        ? '<p class="admin-vazio">Nenhuma devolução registrada ainda.</p>'
        : `<table class="admin-tabela">
            <thead><tr><th>Filme</th><th>Cliente</th><th>Alugado em</th><th>Devolvido em</th></tr></thead>
            <tbody>
              ${devolucoes
                .map(
                  (d) => `
                <tr>
                  <td>${d.aluguel.filme.titulo}</td>
                  <td>${d.aluguel.usuario.nome}</td>
                  <td>${new Date(d.aluguel.data_aluguel).toLocaleDateString("pt-BR")}</td>
                  <td>${new Date(d.data_devolucao).toLocaleDateString("pt-BR")}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>`
    }
  `;
}

window.addEventListener("sessao-expirada", () => {
  mostrarLogin("Sua sessão expirou. Faça login novamente.");
});

if (estaLogado() && obterUsuario()?.is_admin) {
  mostrarPainel();
} else {
  mostrarLogin();
}
