// Menu do avatar (canto superior) e o painel lateral que ele abre — Perfil,
// Pedidos, Favoritos e Configurações são só 4 "vistas" do mesmo painel,
// trocadas via renderizarX() + abrirPainel(titulo).
import { estaLogado, obterUsuario, sair, atualizarConta } from "./auth.js";
import { abrirConta, iniciarConta } from "./conta.js";
import { obterFilmesFavoritos, criarCardFilme, atualizarCardsFavoritos } from "./catalogo.js";
import { carregarFavoritos, sincronizarFavoritosAposLogin } from "./favoritos.js";
import { buscarMeusAlugueis } from "./movies.js";
import { formatarPreco } from "./utilitarios.js";
import { obterTema, definirTema } from "./tema.js";
import { fecharPainelAdmin } from "./adminEmbutido.js";
import { abrirRecibo } from "./recibo.js";

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

// O que vem de buscarMeusAlugueis() é uma lista de Aluguel (um por filme) —
// agrupamos aqui por pedido_id antes de desenhar, pra mostrar uma finalização
// de carrinho com vários filmes como um cartão só (com um botão de recibo),
// em vez de uma linha solta por filme. Aluguéis sem pedido_id (avulsos, ou
// criados antes desse campo existir) viram cada um seu próprio grupo, sem
// botão de recibo — não existe Pedido de verdade pra gerar um PDF a partir dele.
function agruparPorPedido(alugueis) {
  const grupos = new Map();
  for (const aluguel of alugueis) {
    const chave = aluguel.pedido_id ?? `avulso-${aluguel.id}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(aluguel);
  }
  return [...grupos.values()];
}

async function renderizarPedidos() {
  painelConteudo.innerHTML = '<p class="painel-carregando">Carregando pedidos...</p>';

  let alugueis;
  try {
    alugueis = await buscarMeusAlugueis();
  } catch (erro) {
    console.error(erro);
    painelConteudo.innerHTML = '<p class="painel-carregando">Não foi possível carregar seus pedidos.</p>';
    return;
  }

  if (alugueis.length === 0) {
    painelConteudo.innerHTML = '<p class="painel-carregando">Você ainda não alugou nenhum filme.</p>';
    return;
  }

  painelConteudo.innerHTML = "";

  for (const itens of agruparPorPedido(alugueis)) {
    const pedidoId = itens[0].pedido_id;
    const data = new Date(itens[0].data_aluguel).toLocaleDateString("pt-BR");
    // valor_pago é o preço congelado no momento do aluguel — só cai pro
    // valor atual do filme em aluguéis criados antes dessa coluna existir.
    const total = itens.reduce((soma, item) => soma + (item.valor_pago ?? item.filme.valor), 0);
    const titulos = itens.map((item) => item.filme.titulo).join(", ");
    const meta =
      itens.length > 1
        ? `${itens.length} filmes · ${data}`
        : `${itens[0].agencia.nome} — ${itens[0].agencia.bairro} · ${data}`;

    const bloco = document.createElement("div");
    bloco.className = "pedido-item";
    bloco.innerHTML = `
      <div>
        <p class="pedido-titulo">${titulos}</p>
        <p class="pedido-meta">${meta}</p>
      </div>
      <div class="pedido-item-acoes">
        <span class="pedido-preco">${formatarPreco(total)}</span>
        ${pedidoId ? '<button type="button" class="botao-ver-recibo">Ver recibo</button>' : ""}
      </div>
    `;

    if (pedidoId) {
      bloco.querySelector(".botao-ver-recibo").addEventListener("click", () => abrirRecibo(pedidoId));
    }

    painelConteudo.appendChild(bloco);
  }
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
  const usuario = obterUsuario();
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

    <p class="config-secao-titulo">Dados da conta</p>
    <form id="form-editar-conta">
      <div class="campo-conta">
        <label for="config-nome">Nome</label>
        <input type="text" id="config-nome" value="${usuario?.nome ?? ""}" required />
      </div>
      <div class="campo-conta">
        <label for="config-email">E-mail</label>
        <input type="email" id="config-email" value="${usuario?.email ?? ""}" required />
      </div>
      <div class="campo-conta">
        <label for="config-senha">Nova senha</label>
        <input type="password" id="config-senha" placeholder="Deixe em branco pra manter a atual" minlength="6" />
      </div>
      <div class="campo-conta" id="campo-senha-atual" hidden>
        <label for="config-senha-atual">Senha atual</label>
        <input type="password" id="config-senha-atual" placeholder="Confirme sua senha atual pra trocar" />
      </div>

      <p class="config-secao-titulo">Dados para o recibo</p>
      <p class="config-secao-descricao">Aparecem no PDF do recibo de aluguel. Opcionais — deixe em branco se não quiser informar.</p>
      <div class="campo-conta">
        <label for="config-cpf">CPF</label>
        <input type="text" id="config-cpf" placeholder="000.000.000-00" value="${usuario?.cpf ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-logradouro">Rua/Avenida</label>
        <input type="text" id="config-logradouro" value="${usuario?.endereco_logradouro ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-numero">Número</label>
        <input type="text" id="config-numero" value="${usuario?.endereco_numero ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-complemento">Complemento</label>
        <input type="text" id="config-complemento" placeholder="Apto, bloco, etc. (opcional)" value="${usuario?.endereco_complemento ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-bairro">Bairro</label>
        <input type="text" id="config-bairro" value="${usuario?.endereco_bairro ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-cidade">Cidade</label>
        <input type="text" id="config-cidade" value="${usuario?.endereco_cidade ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-estado">Estado (UF)</label>
        <input type="text" id="config-estado" placeholder="SC" maxlength="2" value="${usuario?.endereco_estado ?? ""}" />
      </div>
      <div class="campo-conta">
        <label for="config-cep">CEP</label>
        <input type="text" id="config-cep" placeholder="00000-000" value="${usuario?.endereco_cep ?? ""}" />
      </div>

      <button type="submit" class="botao-conta-enviar">Salvar alterações</button>
      <p class="mensagem-conta" id="config-conta-mensagem" hidden></p>
    </form>
  `;

  document.getElementById("config-tema").addEventListener("change", (evento) => {
    definirTema(evento.target.value);
  });

  const formEditarConta = document.getElementById("form-editar-conta");
  const mensagemConta = document.getElementById("config-conta-mensagem");
  const campoSenha = document.getElementById("config-senha");
  const campoSenhaAtual = document.getElementById("campo-senha-atual");

  // Só pede a senha atual quando a pessoa de fato digita uma senha nova —
  // não faz sentido pedir confirmação de senha só pra trocar o nome/e-mail.
  campoSenha.addEventListener("input", () => {
    campoSenhaAtual.hidden = campoSenha.value.length === 0;
  });

  formEditarConta.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagemConta.hidden = true;

    const senha = campoSenha.value;
    const senhaAtual = document.getElementById("config-senha-atual").value;
    const dados = {
      nome: document.getElementById("config-nome").value,
      email: document.getElementById("config-email").value,
      // Sempre mandados (mesmo vazios) — diferente de senha/senha_atual, que só
      // vão no corpo quando a pessoa realmente quer trocar. Aqui, um campo
      // deixado em branco de propósito precisa sobrescrever um valor salvo
      // antes (ex: apagar um CPF cadastrado errado), então "" é um valor
      // válido a enviar, não "nada mudou" — ver a checagem `is not None` em
      // PUT /auth/me (backend/app/routes/auth.py) que só ignora `None` de
      // verdade, nunca string vazia.
      cpf: document.getElementById("config-cpf").value,
      endereco_logradouro: document.getElementById("config-logradouro").value,
      endereco_numero: document.getElementById("config-numero").value,
      endereco_complemento: document.getElementById("config-complemento").value,
      endereco_bairro: document.getElementById("config-bairro").value,
      endereco_cidade: document.getElementById("config-cidade").value,
      endereco_estado: document.getElementById("config-estado").value,
      endereco_cep: document.getElementById("config-cep").value,
    };

    if (senha) {
      if (!senhaAtual) {
        mensagemConta.textContent = "Digite sua senha atual pra confirmar a troca.";
        mensagemConta.className = "mensagem-conta";
        mensagemConta.hidden = false;
        return;
      }
      dados.senha = senha;
      dados.senha_atual = senhaAtual;
    }

    try {
      await atualizarConta(dados);
      atualizarAreaConta();
      campoSenha.value = "";
      document.getElementById("config-senha-atual").value = "";
      campoSenhaAtual.hidden = true;
      mensagemConta.textContent = "Dados atualizados com sucesso!";
      mensagemConta.className = "mensagem-conta mensagem-conta-sucesso";
      mensagemConta.hidden = false;
    } catch (erro) {
      mensagemConta.textContent = erro.message;
      mensagemConta.className = "mensagem-conta";
      mensagemConta.hidden = false;
    }
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

// Passada pra conta.js via iniciarConta() no fim do arquivo — roda depois
// de qualquer login/cadastro bem-sucedido (ver aoAutenticar em conta.js).
async function aoAutenticar() {
  await sincronizarFavoritosAposLogin();
  atualizarAreaConta();
  atualizarCardsFavoritos();
}

// Reage ao evento global disparado por fetchAutenticado() em auth.js quando
// qualquer chamada à API recebe 401 — fecha tudo que dependia da sessão e
// convida a pessoa a logar de novo.
window.addEventListener("sessao-expirada", () => {
  fecharMenu();
  fecharPainel();
  fecharPainelAdmin();
  atualizarAreaConta();
  atualizarCardsFavoritos();
  abrirConta("login", "Sua sessão expirou. Faça login novamente.");
});

export function iniciarPerfil() {
  atualizarAreaConta();
  iniciarConta(aoAutenticar);
}
