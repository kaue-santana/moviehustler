import { URL_API } from "./config.js";
import { obterToken } from "./auth.js";

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
  const token = obterToken();

  const resposta = await fetch(`${URL_API}/alugueis/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filme_id: filmeId, agencia_id: agenciaId }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao registrar aluguel: ${resposta.status}`);
  }

  return resposta.json();
}

export async function buscarMeusAlugueis() {
  const token = obterToken();

  const resposta = await fetch(`${URL_API}/alugueis/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar pedidos: ${resposta.status}`);
  }

  return resposta.json();
}
