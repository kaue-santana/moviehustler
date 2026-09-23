// Ponto de entrada do frontend (carregado como <script type="module"> no
// index.html): só orquestra os outros módulos — chama cada iniciar*() e liga
// os atalhos de teclado globais. Cada tela/feature vive no seu próprio arquivo.
import { iniciarCatalogo, irParaInicio } from "./catalogo.js";
import { iniciarCarrinho, fecharCarrinho } from "./carrinho.js";
import { fecharModal, iniciarModal } from "./modal.js";
import { fecharConta } from "./conta.js";
import { iniciarPerfil, fecharMenu, fecharPainel } from "./perfil.js";
import { iniciarTema } from "./tema.js";
import { iniciarEntrada, fecharGate } from "./entrada.js";
import { abrirPainelAdmin, fecharPainelAdmin } from "./adminEmbutido.js";
import { obterUsuario } from "./auth.js";

// Atalho "escondido" pra abrir o admin — tecla única "m" (sem modificador).
// Passamos por três candidatos antes deste: F9 (teclas de função em notebook
// costumam ter uma segunda função de hardware via Fn — nesse caso, modo
// avião), Ctrl+Shift+A (atalho nativo do Chrome pra "Pesquisar abas" — o
// navegador intercepta antes da página, nem preventDefault ajuda) e
// Ctrl+Alt+Shift+A (funcionava, mas era difícil de digitar/trocar). Tecla
// única sem modificador é fácil de trocar (uma linha), mas dispararia
// enquanto a pessoa digita em qualquer campo — por isso o listener abaixo só
// reage quando o foco não está num campo de texto (mesmo padrão usado por
// Gmail/YouTube/Trello pros atalhos deles). "Escondido" aqui é só
// conveniência de UX: continua exigindo estar logado como admin de verdade —
// a proteção de verdade é o backend (ver README).
const TECLA_ADMIN = "m";

function estaDigitando() {
  const ativo = document.activeElement;
  if (!ativo) return false;
  const tag = ativo.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ativo.isContentEditable;
}

const botaoLogo = document.getElementById("logo-botao");

function fecharTudo() {
  fecharGate();
  fecharModal();
  fecharCarrinho();
  fecharConta();
  fecharMenu();
  fecharPainel();
  fecharPainelAdmin();
}

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharTudo();
  } else if (
    !evento.ctrlKey &&
    !evento.altKey &&
    !evento.metaKey &&
    evento.key.toLowerCase() === TECLA_ADMIN &&
    !estaDigitando()
  ) {
    if (obterUsuario()?.is_admin) {
      evento.preventDefault();
      abrirPainelAdmin();
    }
  }
});

botaoLogo.addEventListener("click", () => {
  fecharTudo();
  irParaInicio();
});

// Ordem importa um pouco aqui: iniciarTema() primeiro pra evitar flash de
// tema errado; iniciarEntrada() por último porque decide se mostra o gate
// de boas-vindas, e isso deve considerar o estado (ex: sessão) já carregado
// pelos outros módulos.
iniciarTema();
iniciarCarrinho();
iniciarCatalogo();
iniciarModal();
iniciarPerfil();
iniciarEntrada();
