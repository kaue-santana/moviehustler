import { URL_API } from "./config.js";

const CHAVE_TOKEN = "moviehustler_token";
const CHAVE_USUARIO = "moviehustler_usuario";

export function obterToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch (erro) {
    return null;
  }
}

export function obterUsuario() {
  try {
    const salvo = localStorage.getItem(CHAVE_USUARIO);
    return salvo ? JSON.parse(salvo) : null;
  } catch (erro) {
    return null;
  }
}

export function estaLogado() {
  return Boolean(obterToken());
}

function salvarSessao(token, usuario) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  } catch (erro) {
    console.warn("Não foi possível salvar a sessão.", erro);
  }
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
  } catch (erro) {
    console.warn("Não foi possível limpar a sessão.", erro);
  }
}

// Chamada autenticada centralizada: anexa o token e detecta sessão expirada
// num só lugar, em vez de cada módulo montar o header Authorization sozinho.
export async function fetchAutenticado(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      ...(opcoes.headers || {}),
      Authorization: `Bearer ${obterToken()}`,
    },
  });

  if (resposta.status === 401) {
    sair();
    window.dispatchEvent(new Event("sessao-expirada"));
  }

  return resposta;
}

export async function registrar(nome, email, senha) {
  const resposta = await fetch(`${URL_API}/auth/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Não foi possível criar a conta.");
  }

  return resposta.json();
}

export async function login(email, senha) {
  const corpo = new URLSearchParams();
  corpo.set("username", email);
  corpo.set("password", senha);

  const resposta = await fetch(`${URL_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo,
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "E-mail ou senha incorretos.");
  }

  const { access_token: token } = await resposta.json();

  const respostaUsuario = await fetch(`${URL_API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!respostaUsuario.ok) {
    throw new Error("Login funcionou, mas não consegui carregar seus dados.");
  }

  const usuario = await respostaUsuario.json();
  salvarSessao(token, usuario);
  return usuario;
}
