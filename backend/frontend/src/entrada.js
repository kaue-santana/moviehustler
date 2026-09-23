// Tela de boas-vindas (o "gate") que aparece antes do catálogo, oferecendo
// login/cadastro ou "continuar sem conta". Só aparece uma vez por navegador
// (ver jaEscolheuContinuar) — depois de escolher, some pras próximas visitas.
import { estaLogado } from "./auth.js";
import { abrirConta } from "./conta.js";

const CHAVE_VISITANTE = "moviehustler_visitante";

const gateFundo = document.getElementById("gate-fundo");
const gateEntrar = document.getElementById("gate-entrar");
const gateCriarConta = document.getElementById("gate-criar-conta");
const gateContinuar = document.getElementById("gate-continuar");

function jaEscolheuContinuar() {
  try {
    return localStorage.getItem(CHAVE_VISITANTE) === "1";
  } catch (erro) {
    return false;
  }
}

export function fecharGate() {
  gateFundo.classList.remove("aberto");
  try {
    localStorage.setItem(CHAVE_VISITANTE, "1");
  } catch (erro) {
    console.warn("Não foi possível salvar a escolha de continuar sem conta.", erro);
  }
}

gateEntrar.addEventListener("click", () => {
  fecharGate();
  abrirConta("login");
});

gateCriarConta.addEventListener("click", () => {
  fecharGate();
  abrirConta("cadastro");
});

gateContinuar.addEventListener("click", fecharGate);

gateFundo.addEventListener("click", (evento) => {
  if (evento.target === gateFundo) {
    fecharGate();
  }
});

// Chamada ao carregar a página: só mostra o gate pra quem nunca decidiu
// antes E não está logado — uma vez logado, não faz sentido pedir escolha de novo.
export function iniciarEntrada() {
  if (!estaLogado() && !jaEscolheuContinuar()) {
    gateFundo.classList.add("aberto");
  }
}
