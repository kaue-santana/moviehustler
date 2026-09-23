// Camada fina sobre fetchAutenticado especificamente pras rotas /admin/* —
// centraliza o tratamento de erro (rejeita com uma mensagem legível em vez
// de cada tela do admin repetir o mesmo try/catch de parse de JSON).
import { URL_API } from "./config.js";
import { fetchAutenticado } from "./auth.js";

async function requisicaoAdmin(caminho, opcoes = {}) {
  const resposta = await fetchAutenticado(`${URL_API}${caminho}`, opcoes);

  if (!resposta.ok) {
    // .catch(() => ({})) cobre o caso de o corpo do erro não ser JSON
    // válido (ex: erro 500 cru do servidor) — sem isso, o .json() lançaria
    // uma segunda exceção e mascararia o erro original.
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || `Erro ${resposta.status}`);
  }

  return resposta.json();
}

export const buscarClientes = (pagina = 1, porPagina = 10, busca = "") =>
  requisicaoAdmin(`/admin/clientes/?pagina=${pagina}&por_pagina=${porPagina}&busca=${encodeURIComponent(busca)}`);
export const buscarVendas = (pagina = 1, porPagina = 10, busca = "") =>
  requisicaoAdmin(`/admin/vendas/?pagina=${pagina}&por_pagina=${porPagina}&busca=${encodeURIComponent(busca)}`);
export const buscarDevolucoes = () => requisicaoAdmin("/admin/devolucoes/");

export const registrarDevolucao = (aluguelId) =>
  requisicaoAdmin("/admin/devolucoes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aluguel_id: aluguelId }),
  });

export const buscarFaturamentoMensal = () => requisicaoAdmin("/admin/relatorios/faturamento-mensal");
export const buscarFilmesMaisAlugados = () => requisicaoAdmin("/admin/relatorios/filmes-mais-alugados");
export const buscarFaturamentoMedio = () => requisicaoAdmin("/admin/relatorios/faturamento-medio");
