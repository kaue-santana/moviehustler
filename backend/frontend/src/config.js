// Endereço do backend FastAPI. Frontend e backend agora são servidos pela
// mesma origem (o FastAPI serve os dois — ver o mount em app/main.py), então
// uma string vazia basta: `${URL_API}/filmes/` vira "/filmes/", relativo à
// própria página, funcionando igual local e em produção sem distinção.
export const URL_API = "";
