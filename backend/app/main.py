from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import filmes, agencias, alugueis, auth, favoritos, admin, pedidos

# O schema (tabelas + colunas) não é mais criado/alterado aqui — rodar DDL
# como efeito colateral de importar o módulo é arriscado em produção
# serverless (lock disputado entre invocações concorrentes) e desnecessário
# depois da primeira vez. Rode `python migrar.py` à mão sempre que o schema
# mudar (novo model, nova coluna) — local ou contra o banco de produção.

app = FastAPI(title="MovieHustler")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"] libera qualquer origem — ok pra projeto de estudo/
    # portfólio, mas seria um risco de segurança real em produção (qualquer
    # site poderia chamar essa API usando o token de quem estiver logado).
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(filmes.router)
app.include_router(agencias.router)
app.include_router(alugueis.router)
app.include_router(auth.router)
app.include_router(favoritos.router)
app.include_router(admin.router)
app.include_router(pedidos.router)


@app.get("/status")
def status():
    return {"status": "ok"}


# Serve o frontend (frontend/index.html + frontend/src/...) na mesma origem
# da API — daqui pra baixo é só arquivo estático, então tem que ser o último
# registro: uma rota declarada depois de um mount não tem prioridade sobre
# ele, mas uma declarada antes (como as dos routers acima, e /status) sempre
# vence — é assim que /filmes/, /auth/..., etc. continuam sendo a API de
# verdade, e só o que sobra (/, /src/app.js, ...) cai pro arquivo estático.
# De propósito NÃO se chama "public/": a Vercel trata esse nome de forma
# especial (promove pro CDN sozinha, sem nenhum app.mount() — e pede
# explicitamente pra não montar essa pasta na mão), o que colidiria com este
# mount. Com outro nome, o StaticFiles abaixo é quem cuida de tudo, local e
# em produção — sem CDN automática, mas sem esse conflito. Ver
# https://vercel.com/docs/frameworks/backend/fastapi#the-public-directory
DIRETORIO_FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=DIRETORIO_FRONTEND, html=True), name="frontend")
