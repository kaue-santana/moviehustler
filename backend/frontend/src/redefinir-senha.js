// Ponto de entrada da página redefinir-senha.html — não faz parte do app.js
// principal porque essa página é acessada direto pelo link do email (ver
// app/email.py), fora do fluxo normal da SPA, sem ninguém logado ainda.
import { redefinirSenha } from "./auth.js";

const token = new URLSearchParams(window.location.search).get("token");

const form = document.getElementById("form-redefinir");
const instrucao = document.getElementById("redefinir-instrucao");
const mensagem = document.getElementById("redefinir-mensagem");
const botao = document.getElementById("redefinir-botao");
const linkVoltar = document.getElementById("redefinir-voltar");

function mostrarErroFinal(texto) {
  form.hidden = true;
  instrucao.textContent = texto;
  linkVoltar.hidden = false;
}

// Sem token na URL, nem vale mostrar o formulário — alguém abriu essa
// página sem vir do link do email (ou o link estava incompleto).
if (!token) {
  mostrarErroFinal("Link inválido: faltou o código de redefinição na URL.");
} else {
  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const senha = document.getElementById("redefinir-senha").value;
    const confirmar = document.getElementById("redefinir-confirmar").value;

    mensagem.hidden = true;

    if (senha !== confirmar) {
      mensagem.textContent = "As senhas não coincidem.";
      mensagem.hidden = false;
      return;
    }

    botao.disabled = true;
    try {
      await redefinirSenha(token, senha);
      mostrarErroFinal("Senha redefinida com sucesso!");
    } catch (erro) {
      // Aqui sim mostramos o erro de verdade (token inválido/expirado) — essa
      // página não tem o mesmo cuidado de privacidade da tela de "esqueci
      // minha senha": quem chegou aqui já clicou num link específico, não
      // está testando emails aleatórios pra ver quais existem.
      mensagem.textContent = erro.message;
      mensagem.hidden = false;
      botao.disabled = false;
    }
  });
}
