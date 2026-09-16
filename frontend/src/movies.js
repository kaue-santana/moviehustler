import { URL_API } from "./config.js";
import { fetchAutenticado } from "./auth.js";

export const CATEGORIAS = [
  "Ação",
  "Comédia",
  "Terror",
  "Drama",
  "Ficção Científica",
  "Infantil",
];

export async function buscarFilmes() {
  const resposta = await fetch(`${URL_API}/filmes/`);

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar filmes: ${resposta.status}`);
  }

  return resposta.json();
}

export async function buscarAgencias() {
  const resposta = await fetch(`${URL_API}/agencias/`);

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar agências: ${resposta.status}`);
  }

  return resposta.json();
}

export async function criarAluguel(filmeId, agenciaId) {
  const resposta = await fetchAutenticado(`${URL_API}/alugueis/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filme_id: filmeId, agencia_id: agenciaId }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao registrar aluguel: ${resposta.status}`);
  }

  return resposta.json();
}

export async function buscarMeusAlugueis() {
  const resposta = await fetchAutenticado(`${URL_API}/alugueis/`);

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar pedidos: ${resposta.status}`);
  }

  return resposta.json();
}

export async function criarFilme(dados) {
  const resposta = await fetchAutenticado(`${URL_API}/filmes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Não foi possível criar o filme.");
  }

  return resposta.json();
}

export async function atualizarFilme(filmeId, dados) {
  const resposta = await fetchAutenticado(`${URL_API}/filmes/${filmeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Não foi possível atualizar o filme.");
  }

  return resposta.json();
}

export async function removerFilme(filmeId) {
  const resposta = await fetchAutenticado(`${URL_API}/filmes/${filmeId}`, {
    method: "DELETE",
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Não foi possível remover o filme.");
  }

  return resposta.json();
}
