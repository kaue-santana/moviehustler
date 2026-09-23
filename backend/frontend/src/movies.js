// Funções de acesso à API — cada uma faz um fetch e já converte a resposta
// não-ok num Error com mensagem legível, pra quem chama só precisar de
// try/catch sem repetir a checagem de resposta.ok toda vez.
import { URL_API } from "./config.js";
import { fetchAutenticado } from "./auth.js";

// Pública (fetch simples, sem token) — catálogo é visível sem login.
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

// Chamada uma vez, no início do "Finalizar carrinho" (ver carrinho.js) —
// antes do loop que cria um Aluguel por item, cria o Pedido "vazio" que vai
// agrupar todos eles. pedidoId é opcional em criarAluguel() pra essa mesma
// função continuar servindo pra aluguéis avulsos fora do carrinho, se algum
// dia existir esse fluxo.
export async function criarPedido() {
  const resposta = await fetchAutenticado(`${URL_API}/pedidos/`, {
    method: "POST",
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao criar pedido: ${resposta.status}`);
  }

  return resposta.json();
}

export async function criarAluguel(filmeId, agenciaId, pedidoId = null) {
  const resposta = await fetchAutenticado(`${URL_API}/alugueis/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filme_id: filmeId, agencia_id: agenciaId, pedido_id: pedidoId }),
  });

  if (!resposta.ok) {
    throw new Error(`Erro ao registrar aluguel: ${resposta.status}`);
  }

  return resposta.json();
}

// Devolve o PDF do recibo como Blob, não como JSON — resposta.blob() lê o
// corpo bruto da requisição (bytes do PDF) em vez de tentar parsear como
// texto/JSON. Quem chama decide o que fazer com o Blob (ver recibo.js).
export async function buscarReciboPedido(pedidoId) {
  const resposta = await fetchAutenticado(`${URL_API}/pedidos/${pedidoId}/recibo`);

  if (!resposta.ok) {
    throw new Error(`Erro ao buscar recibo: ${resposta.status}`);
  }

  return resposta.blob();
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
