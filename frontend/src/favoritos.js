const CHAVE_FAVORITOS = "moviehustler_favoritos";

let favoritos = new Set();

export function carregarFavoritos() {
  try {
    const salvo = localStorage.getItem(CHAVE_FAVORITOS);
    if (salvo) {
      favoritos = new Set(JSON.parse(salvo));
    }
  } catch (erro) {
    console.warn("Não foi possível carregar os favoritos salvos.", erro);
    favoritos = new Set();
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos]));
  } catch (erro) {
    console.warn("Não foi possível salvar os favoritos.", erro);
  }
}

export function ehFavorito(idFilme) {
  return favoritos.has(idFilme);
}

export function alternarFavorito(idFilme, aoMudar) {
  if (favoritos.has(idFilme)) {
    favoritos.delete(idFilme);
  } else {
    favoritos.add(idFilme);
  }
  salvarFavoritos();
  if (aoMudar) {
    aoMudar();
  }
}
