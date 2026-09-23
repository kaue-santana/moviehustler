// Tema claro/escuro/sistema. "sistema" = não define data-theme, deixando o
// CSS seguir a preferência do SO via @media (prefers-color-scheme).
const CHAVE_TEMA = "moviehustler_tema";

export function obterTema() {
  try {
    return localStorage.getItem(CHAVE_TEMA) || "sistema";
  } catch (erro) {
    // localStorage pode falhar (modo privado, cookies bloqueados) — nesses
    // casos, cai pro padrão "sistema" em vez de quebrar a página.
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

// Chamada uma vez, cedo, ao carregar qualquer página — aplica o tema salvo
// antes da primeira renderização visível, evitando um "flash" de tema errado.
export function iniciarTema() {
  aplicarTema(obterTema());
}
