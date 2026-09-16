import { registrar, login } from "./auth.js";

const contaFundo = document.getElementById("conta-fundo");
const contaFechar = document.getElementById("conta-fechar");
const abaLogin = document.getElementById("aba-login");
const abaCadastro = document.getElementById("aba-cadastro");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const loginMensagem = document.getElementById("login-mensagem");
const cadastroMensagem = document.getElementById("cadastro-mensagem");
const campoSenhaCadastro = document.getElementById("cadastro-senha");
const medidorSenha = document.getElementById("medidor-senha");
const medidorPreenchimento = document.getElementById("medidor-senha-preenchimento");
const medidorTexto = document.getElementById("medidor-senha-texto");

let aoAutenticar = () => {};

const NIVEIS_FORCA = [
  { rotulo: "Muito fraca", classe: "nivel-1" },
  { rotulo: "Fraca", classe: "nivel-2" },
  { rotulo: "Razoável", classe: "nivel-3" },
  { rotulo: "Forte", classe: "nivel-4" },
  { rotulo: "Muito forte", classe: "nivel-5" },
];

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

export function abrirConta(aba = "login") {
  mostrarAba(aba);
  contaFundo.classList.add("aberto");
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

export function iniciarConta(callbackAoAutenticar) {
  aoAutenticar = callbackAoAutenticar;
}
