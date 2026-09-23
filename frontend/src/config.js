// Endereço do backend FastAPI. Sem build step/variável de ambiente no
// frontend, então a escolha é feita em runtime: se a página está sendo
// servida em localhost (dev local), usa a API local; qualquer outro host
// (o domínio de produção na Vercel) usa a API já publicada.
const EH_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);

export const URL_API = EH_LOCAL
  ? "http://localhost:8000"
  : "https://moviehustlerback.vercel.app";
