from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
def raiz():
    return {"status": "ok"}
