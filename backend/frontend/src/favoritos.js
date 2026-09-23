// Favoritos funcionam tanto deslogado (guardado só no localStorage) quanto
// logado (sincronizado com a conta via API) — a lógica de qual usar está
// espalhada pelas funções abaixo checando estaLogado() a cada operação.
import { URL_API } from "./config.js";
import { estaLogado, fetchAutenticado } from "./auth.js";

const CHAVE_FAVORITOS = "moviehustler_favoritos";

// Cache em memória (evita reconsultar localStorage/API a cada ehFavorito()
// chamado ao renderizar cada card do catálogo).
let favoritos = new Set();

function carregarFavoritosLocais() {
  try {
    const salvo = localStorage.getItem(CHAVE_FAVORITOS);
    favoritos = salvo ? new Set(JSON.parse(salvo)) : new Set();
  } catch (erro) {
    console.warn("Não foi possível carregar os favoritos salvos.", erro);
    favoritos = new Set();
  }
}

function salvarFavoritosLocais() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos]));
  } catch (erro) {
    console.warn("Não foi possível salvar os favoritos.", erro);
  }
}

export async function carregarFavoritos() {
  if (!estaLogado()) {
    carregarFavoritosLocais();
    return;
  }

  try {
    const resposta = await fetchAutenticado(`${URL_API}/favoritos/`);
    if (!resposta.ok) throw new Error("Falha ao carregar favoritos da conta.");
    const lista = await resposta.json();
    favoritos = new Set(lista.map((item) => item.filme_id));
  } catch (erro) {
    console.warn("Não foi possível carregar os favoritos da conta.", erro);
    carregarFavoritosLocais();
  }
}

// Envia os favoritos guardados localmente (de antes do login) pra conta e recarrega do servidor.
export async function sincronizarFavoritosAposLogin() {
  const favoritosLocais = [...favoritos];

  for (const filmeId of favoritosLocais) {
    try {
      await fetchAutenticado(`${URL_API}/favoritos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filme_id: filmeId }),
      });
    } catch (erro) {
      console.warn("Não foi possível mesclar um favorito local com a conta.", erro);
    }
  }

  await carregarFavoritos();
}

export function ehFavorito(idFilme) {
  return favoritos.has(idFilme);
}

export async function alternarFavorito(idFilme, aoMudar) {
  const eraFavorito = favoritos.has(idFilme);

  // Atualização otimista: muda o estado local e já chama aoMudar() (que
  // redesenha o coração de favorito) ANTES de confirmar com o servidor —
  // a UI responde na hora em vez de esperar o round-trip da rede. Se a
  // chamada falhar lá embaixo, desfazemos essa mudança no catch.
  if (eraFavorito) {
    favoritos.delete(idFilme);
  } else {
    favoritos.add(idFilme);
  }
  if (aoMudar) aoMudar();

  if (!estaLogado()) {
    salvarFavoritosLocais();
    return;
  }

  try {
    if (eraFavorito) {
      const resposta = await fetchAutenticado(`${URL_API}/favoritos/${idFilme}`, {
        method: "DELETE",
      });
      if (!resposta.ok) throw new Error("Falha ao remover favorito.");
    } else {
      const resposta = await fetchAutenticado(`${URL_API}/favoritos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filme_id: idFilme }),
      });
      if (!resposta.ok) throw new Error("Falha ao adicionar favorito.");
    }
  } catch (erro) {
    // Desfaz a mudança otimista de cima, já que o servidor não confirmou.
    console.warn("Não foi possível salvar o favorito na conta.", erro);
    if (eraFavorito) {
      favoritos.add(idFilme);
    } else {
      favoritos.delete(idFilme);
    }
    if (aoMudar) aoMudar();
  }
}
