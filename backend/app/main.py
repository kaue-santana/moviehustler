from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import filmes, agencias, alugueis, auth, favoritos, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MovieHustler")

app.add_middleware(
    CORSMiddleware,
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


@app.get("/")
def raiz():
    return {"status": "ok"}
