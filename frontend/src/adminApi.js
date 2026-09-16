import { URL_API } from "./config.js";
import { obterToken } from "./auth.js";

async function requisicaoAdmin(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_API}${caminho}`, {
    ...opcoes,
    headers: {
      ...(opcoes.headers || {}),
      Authorization: `Bearer ${obterToken()}`,
    },
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || `Erro ${resposta.status}`);
  }

  return resposta.json();
}

export const buscarClientes = () => requisicaoAdmin("/admin/clientes/");
export const buscarVendas = () => requisicaoAdmin("/admin/vendas/");
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
