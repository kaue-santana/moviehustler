const CHAVE_TEMA = "moviehustler_tema";

export function obterTema() {
  try {
    return localStorage.getItem(CHAVE_TEMA) || "sistema";
  } catch (erro) {
    return "sistema";
  }
}

function aplicarTema(tema) {
  if (tema === "claro") {
    document.documentElement.setAttribute("data-theme", "light");
  } else if (tema === "escuro") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function definirTema(tema) {
  aplicarTema(tema);
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch (erro) {
    console.warn("Não foi possível salvar a preferência de tema.", erro);
  }
}

export function iniciarTema() {
  aplicarTema(obterTema());
}
