import { iniciarCatalogo, irParaInicio } from "./catalogo.js";
import { iniciarCarrinho, fecharCarrinho } from "./carrinho.js";
import { fecharModal, iniciarModal } from "./modal.js";
import { fecharConta } from "./conta.js";
import { iniciarPerfil, fecharMenu, fecharPainel } from "./perfil.js";
import { iniciarTema } from "./tema.js";

const botaoLogo = document.getElementById("logo-botao");

function fecharTudo() {
  fecharModal();
  fecharCarrinho();
  fecharConta();
  fecharMenu();
  fecharPainel();
}

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    fecharTudo();
  }
});

botaoLogo.addEventListener("click", () => {
  fecharTudo();
  irParaInicio();
});

iniciarTema();
iniciarCarrinho();
iniciarCatalogo();
iniciarModal();
iniciarPerfil();
