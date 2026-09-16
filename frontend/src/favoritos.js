import { URL_API } from "./config.js";
import { obterToken, estaLogado } from "./auth.js";

const CHAVE_FAVORITOS = "moviehustler_favoritos";

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
    const resposta = await fetch(`${URL_API}/favoritos/`, {
      headers: { Authorization: `Bearer ${obterToken()}` },
    });
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
      await fetch(`${URL_API}/favoritos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
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
      const resposta = await fetch(`${URL_API}/favoritos/${idFilme}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${obterToken()}` },
      });
      if (!resposta.ok) throw new Error("Falha ao remover favorito.");
    } else {
      const resposta = await fetch(`${URL_API}/favoritos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify({ filme_id: idFilme }),
      });
      if (!resposta.ok) throw new Error("Falha ao adicionar favorito.");
    }
  } catch (erro) {
    console.warn("Não foi possível salvar o favorito na conta.", erro);
    if (eraFavorito) {
      favoritos.add(idFilme);
    } else {
      favoritos.delete(idFilme);
    }
    if (aoMudar) aoMudar();
  }
}
