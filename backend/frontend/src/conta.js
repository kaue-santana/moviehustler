import { registrar, login, esqueciSenha } from "./auth.js";

const contaFundo = document.getElementById("conta-fundo");
const contaFechar = document.getElementById("conta-fechar");
const contaAbas = document.getElementById("conta-abas");
const abaLogin = document.getElementById("aba-login");
const abaCadastro = document.getElementById("aba-cadastro");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const formEsqueciSenha = document.getElementById("form-esqueci-senha");
const loginMensagem = document.getElementById("login-mensagem");
const cadastroMensagem = document.getElementById("cadastro-mensagem");
const esqueciMensagem = document.getElementById("esqueci-mensagem");
const botaoEsqueciSenha = document.getElementById("botao-esqueci-senha");
const botaoVoltarLogin = document.getElementById("botao-voltar-login");
const campoSenhaCadastro = document.getElementById("cadastro-senha");
const medidorSenha = document.getElementById("medidor-senha");
const medidorPreenchimento = document.getElementById("medidor-senha-preenchimento");
const medidorTexto = document.getElementById("medidor-senha-texto");

// Callback plugado de fora (ver iniciarConta) pra evitar import circular:
// conta.js não precisa saber quem reage ao login, só avisa que aconteceu.
let aoAutenticar = () => {};

const NIVEIS_FORCA = [
  { rotulo: "Muito fraca", classe: "nivel-1" },
  { rotulo: "Fraca", classe: "nivel-2" },
  { rotulo: "Razoável", classe: "nivel-3" },
  { rotulo: "Forte", classe: "nivel-4" },
  { rotulo: "Muito forte", classe: "nivel-5" },
];

// Medidor de força só visual/local — não bloqueia o cadastro, é feedback
// pro usuário. A validação de verdade (senha mínima etc) é só o que o
// backend exigir; não há nenhuma regra de senha forçada aqui.
function avaliarForcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 10) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  const indice = Math.min(pontos, NIVEIS_FORCA.length - 1);
  return { ...NIVEIS_FORCA[indice], largura: `${(indice + 1) * 20}%` };
}

function atualizarMedidorSenha() {
  const senha = campoSenhaCadastro.value;
  medidorSenha.hidden = senha.length === 0;
  if (senha.length === 0) return;

  const { rotulo, classe, largura } = avaliarForcaSenha(senha);

  medidorPreenchimento.className = `medidor-senha-preenchimento ${classe}`;
  medidorPreenchimento.style.width = largura;
  medidorTexto.className = `medidor-senha-texto ${classe}`;
  medidorTexto.textContent = rotulo;
}

campoSenhaCadastro.addEventListener("input", atualizarMedidorSenha);

export function abrirConta(aba = "login", mensagem) {
  // Reseta pra fora da view "esqueci minha senha" sempre que o modal reabre
  // — sem isso, fechar o modal ali e reabrir (ex: clicando em "Entrar" de
  // novo) deixaria a pessoa presa na tela errada.
  formEsqueciSenha.hidden = true;
  contaAbas.hidden = false;
  mostrarAba(aba);
  contaFundo.classList.add("aberto");

  if (mensagem) {
    loginMensagem.textContent = mensagem;
    loginMensagem.hidden = false;
  } else {
    loginMensagem.hidden = true;
  }
}

export function fecharConta() {
  contaFundo.classList.remove("aberto");
}

function mostrarAba(aba) {
  const ehLogin = aba === "login";
  abaLogin.classList.toggle("ativa", ehLogin);
  abaCadastro.classList.toggle("ativa", !ehLogin);
  formLogin.hidden = !ehLogin;
  formCadastro.hidden = ehLogin;
}

contaFechar.addEventListener("click", fecharConta);

contaFundo.addEventListener("click", (evento) => {
  if (evento.target === contaFundo) {
    fecharConta();
  }
});

abaLogin.addEventListener("click", () => mostrarAba("login"));
abaCadastro.addEventListener("click", () => mostrarAba("cadastro"));

// "Esqueci minha senha" não é uma terceira aba de verdade — é um desvio de
// dentro do login, então esconde as abas (Entrar/Criar conta) enquanto
// estiver nessa tela, em vez de deixá-las visíveis sem fazer sentido ali.
function mostrarEsqueciSenha() {
  contaAbas.hidden = true;
  formLogin.hidden = true;
  formCadastro.hidden = true;
  formEsqueciSenha.hidden = false;
  esqueciMensagem.hidden = true;
}

function voltarParaLogin() {
  formEsqueciSenha.hidden = true;
  contaAbas.hidden = false;
  mostrarAba("login");
}

botaoEsqueciSenha.addEventListener("click", mostrarEsqueciSenha);
botaoVoltarLogin.addEventListener("click", voltarParaLogin);

formEsqueciSenha.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const email = document.getElementById("esqueci-email").value;
  const botaoEnviar = formEsqueciSenha.querySelector("button[type=submit]");

  botaoEnviar.disabled = true;
  await esqueciSenha(email);
  botaoEnviar.disabled = false;

  // Mensagem sempre igual, exista ou não o e-mail — o mesmo cuidado de
  // privacidade da rota (ver app/routes/auth.py) precisa valer aqui também,
  // senão a tela vaza a informação que a API tomou cuidado de esconder.
  esqueciMensagem.textContent =
    "Se esse e-mail estiver cadastrado, enviamos um link de redefinição. Confira sua caixa de entrada.";
  esqueciMensagem.className = "mensagem-conta mensagem-conta-sucesso";
  esqueciMensagem.hidden = false;
  formEsqueciSenha.reset();
});

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  loginMensagem.hidden = true;

  try {
    await login(email, senha);
    fecharConta();
    formLogin.reset();
    aoAutenticar();
  } catch (erro) {
    loginMensagem.textContent = erro.message;
    loginMensagem.hidden = false;
  }
});

formCadastro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nome = document.getElementById("cadastro-nome").value;
  const email = document.getElementById("cadastro-email").value;
  const senha = document.getElementById("cadastro-senha").value;

  cadastroMensagem.hidden = true;

  try {
    // O backend não loga automaticamente ao registrar — são dois endpoints
    // separados, então o frontend chama login() logo em seguida pra já
    // deixar a pessoa autenticada sem precisar digitar tudo de novo.
    await registrar(nome, email, senha);
    await login(email, senha);
    fecharConta();
    formCadastro.reset();
    medidorSenha.hidden = true;
    aoAutenticar();
  } catch (erro) {
    cadastroMensagem.textContent = erro.message;
    cadastroMensagem.hidden = false;
  }
});

// Quem monta a tela (app.js) chama isso passando o que deve acontecer
// depois de um login/cadastro bem-sucedido (recarregar catálogo, favoritos etc).
export function iniciarConta(callbackAoAutenticar) {
  aoAutenticar = callbackAoAutenticar;
}
