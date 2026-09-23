// Carregador preguiçoso do painel admin: ninguém que não seja admin baixa
// admin.js, admin.css ou o Chart.js — nada disso existe até abrirPainelAdmin()
// ser chamado pela primeira vez (clique em "Admin" no menu do perfil).

const URL_CHART_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js";

let overlay = null;
let carregado = false;
let carregando = null;

function montarOverlay() {
  overlay = document.createElement("div");
  overlay.className = "admin-painel";
  overlay.id = "painel-admin";
  overlay.hidden = true;
  overlay.innerHTML = `
    <header class="admin-topo">
      <h1 class="admin-marca">MOVIE<span>HUSTLER</span> <small>admin</small></h1>
      <div class="admin-conta">
        <span id="admin-nome"></span>
        <button type="button" id="admin-sair" class="admin-botao-mini">Sair</button>
      </div>
    </header>

    <nav class="admin-abas" id="admin-abas">
      <button type="button" class="admin-aba ativa" data-aba="visao-geral">Visão geral</button>
      <button type="button" class="admin-aba" data-aba="clientes">Clientes</button>
      <button type="button" class="admin-aba" data-aba="vendas">Vendas</button>
      <button type="button" class="admin-aba" data-aba="produtos">Produtos</button>
      <button type="button" class="admin-aba" data-aba="devolucoes">Devoluções</button>
    </nav>

    <main class="admin-conteudo" id="admin-conteudo">
      <p class="admin-carregando">Carregando...</p>
    </main>
  `;
  document.body.appendChild(overlay);
}

function injetarCss() {
  const existente = document.getElementById("admin-css");
  if (existente) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.id = "admin-css";
    link.rel = "stylesheet";
    link.href = "../src/admin.css";
    // sem esperar o "load", o painel podia aparecer por um instante sem
    // estilo nenhum (nav toda espremida) antes do CSS terminar de aplicar —
    // principalmente quando o Chart.js já estava em cache do navegador e a
    // corrida entre os dois ficava curta demais.
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("Não foi possível carregar o admin.css"));
    document.head.appendChild(link);
  });
}

function injetarChartJs() {
  if (window.Chart) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = URL_CHART_JS;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Chart.js"));
    document.head.appendChild(script);
  });
}

export async function abrirPainelAdmin() {
  if (!carregado) {
    // Guarda contra corrida: se a pessoa clicar em "Admin" duas vezes rápido
    // (ou apertar o atalho repetidamente) antes do primeiro carregamento terminar,
    // a segunda chamada só espera a mesma Promise em vez de carregar tudo
    // de novo — `carregando` funciona como um "já estou processando isso".
    if (!carregando) {
      carregando = (async () => {
        await Promise.all([injetarCss(), injetarChartJs()]);
        montarOverlay();
        // import() dinâmico: admin.js só é baixado/executado aqui, na
        // primeira vez que o painel admin é aberto de verdade.
        const { iniciarAdmin } = await import("./admin.js");
        iniciarAdmin();
        carregado = true;
      })();
    }
    await carregando;
  }
  overlay.hidden = false;
}

export function fecharPainelAdmin() {
  if (overlay) overlay.hidden = true;
}
