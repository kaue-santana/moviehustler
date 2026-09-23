"""Substitui o catálogo fictício por filmes reais, puxados da TMDb.

Apaga devoluções, aluguéis, favoritos e filmes existentes (são só dados de
teste) e repovoa a tabela de filmes combinando várias listas da TMDb
(populares, mais bem avaliados, em cartaz, em alta) e distribuindo a escolha
final entre os gêneros disponíveis, em vez de só pegar os N primeiros de uma
lista só — já com pôster, logo (wordmark), gêneros, direção, faixa etária e
streamings reais.
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import text

import app.main  # garante que todos os models sejam registrados antes das queries
from app.database import Base, engine, SessionLocal
from app.models.devolucao import Devolucao
from app.models.aluguel import Aluguel
from app.models.favorito import Favorito
from app.models.filme import Filme

TMDB_API_KEY = os.environ["TMDB_API_KEY"]
BASE_URL = "https://api.themoviedb.org/3"
IMAGEM_BASE = "https://image.tmdb.org/t/p/w500"

QUANTIDADE_FILMES = 40
VOTOS_MINIMOS = 300  # filtra lançamentos obscuros que aparecem inflados no /popular

# Combina várias listas em vez de só "populares" — assim o catálogo tem
# clássicos aclamados (top_rated) e lançamentos de cinema (now_playing) além
# dos populares e do que está em alta no momento (trending).
LISTAS_ORIGEM = [
    "/movie/popular",
    "/movie/top_rated",
    "/movie/now_playing",
    "/trending/movie/week",
]

MAPA_CERTIFICACAO = {"L": "Livre"}


def chamar_api(caminho, **parametros):
    # Helper genérico usado por todas as funções buscar_* abaixo: monta a URL
    # com api_key + idioma padrão, remove parâmetros None (pra sobrescrever
    # o language="pt-BR" quando necessário, como em buscar_logo) e devolve o
    # JSON já decodificado. Usa só a stdlib (urllib) — sem depender de `requests`.
    parametros["api_key"] = TMDB_API_KEY
    parametros.setdefault("language", "pt-BR")
    parametros = {chave: valor for chave, valor in parametros.items() if valor is not None}
    url = f"{BASE_URL}{caminho}?{urllib.parse.urlencode(parametros)}"
    with urllib.request.urlopen(url) as resposta:
        return json.loads(resposta.read())


def buscar_generos():
    dados = chamar_api("/genre/movie/list")
    return {g["id"]: g["name"] for g in dados["genres"]}


def buscar_diretor(filme_id):
    dados = chamar_api(f"/movie/{filme_id}/credits")
    for pessoa in dados.get("crew", []):
        if pessoa.get("job") == "Director":
            return pessoa["name"]
    return "Não informado"


def buscar_faixa_etaria(filme_id):
    dados = chamar_api(f"/movie/{filme_id}/release_dates")
    for pais in dados.get("results", []):
        if pais["iso_3166_1"] == "BR":
            for lancamento in pais["release_dates"]:
                certificacao = lancamento.get("certification")
                if certificacao:
                    return MAPA_CERTIFICACAO.get(certificacao, certificacao)
    return "Livre"


def buscar_streamings(filme_id):
    dados = chamar_api(f"/movie/{filme_id}/watch/providers")
    provedores_br = dados.get("results", {}).get("BR", {}).get("flatrate", [])
    return [p["provider_name"] for p in provedores_br]


def buscar_logo(filme_id):
    # O "logo" na TMDb é o wordmark do filme (o nome já desenhado no estilo
    # oficial, tipo o que aparece na Netflix) — diferente do pôster, que é a
    # arte de capa. Preferimos um logo em português; na falta, em inglês; na
    # falta de ambos, qualquer um sem idioma (logos só com o desenho/símbolo).
    dados = chamar_api(f"/movie/{filme_id}/images", include_image_language="pt,en,null", language=None)
    logos = dados.get("logos", [])
    if not logos:
        return None

    def prioridade(logo):
        ordem_idioma = {"pt": 0, "en": 1, None: 2}
        return (ordem_idioma.get(logo.get("iso_639_1"), 3), -logo.get("vote_average", 0))

    melhor = sorted(logos, key=prioridade)[0]
    return f"{IMAGEM_BASE}{melhor['file_path']}"


def buscar_lista(caminho, paginas_max=8):
    resultados = []
    pagina = 1
    while pagina <= paginas_max:
        dados = chamar_api(caminho, page=pagina)
        resultados.extend(dados["results"])
        if pagina >= dados.get("total_pages", 1):
            break
        pagina += 1
    return resultados


def buscar_candidatos():
    # Endpoints de lista às vezes incluem lançamentos obscuros com poucos
    # votos mas popularidade inflada (trailer recente, pico passageiro) —
    # filtramos por um mínimo de votos pra garantir filmes reconhecíveis, e
    # deduplicamos entre as listas (o mesmo filme pode aparecer em mais de
    # uma, ex: popular e em alta ao mesmo tempo).
    vistos = set()
    candidatos = []
    for caminho in LISTAS_ORIGEM:
        for filme in buscar_lista(caminho):
            if filme["id"] in vistos:
                continue
            if filme.get("vote_count", 0) < VOTOS_MINIMOS:
                continue
            vistos.add(filme["id"])
            candidatos.append(filme)
    return candidatos


def selecionar_com_diversidade(candidatos, quantidade):
    # Agrupa os candidatos pelo gênero principal e escolhe em rodadas — um
    # filme de cada gênero por vez, sempre o mais popular restante daquele
    # gênero — em vez de simplesmente pegar os N mais populares no geral, o
    # que tenderia a favorecer só os gêneros que estão "bombando" agora
    # (normalmente Ação/Ficção Científica) e deixar outros de fora.
    baldes = {}
    for filme in candidatos:
        genero_principal = (filme.get("genre_ids") or [None])[0]
        baldes.setdefault(genero_principal, []).append(filme)

    for lista in baldes.values():
        lista.sort(key=lambda f: f.get("popularity", 0), reverse=True)

    selecionados = []
    while len(selecionados) < quantidade and any(baldes.values()):
        for lista in baldes.values():
            if len(selecionados) >= quantidade:
                break
            if lista:
                selecionados.append(lista.pop(0))

    return selecionados


def montar_filme(resumo, generos_mapa):
    filme_id = resumo["id"]
    detalhes = chamar_api(f"/movie/{filme_id}")

    generos = [g["name"] for g in detalhes.get("genres", [])]
    if not generos:
        generos = [generos_mapa.get(gid, "Outros") for gid in resumo.get("genre_ids", [])]
    generos = generos[:2]  # a TMDb às vezes lista até 5 gêneros por filme — 2 é o bastante pro card/modal

    data_lancamento = detalhes.get("release_date") or ""
    ano = int(data_lancamento[:4]) if data_lancamento else 0

    duracao_min = detalhes.get("runtime") or 0
    nota = detalhes.get("vote_average") or 5
    # A TMDb não tem preço de aluguel (não é uma loja) — inventamos um valor
    # entre R$6,90 e R$13,90 com base na nota do filme (0 a 10), só pra ter
    # uma variação de preço "plausível" no catálogo em vez de tudo igual.
    valor = round(6.9 + (nota / 10) * 7, 1)

    return {
        "titulo": detalhes["title"],
        "generos": generos or ["Não informado"],
        "ano": ano,
        "faixa": buscar_faixa_etaria(filme_id),
        "duracao": f"{duracao_min} min" if duracao_min else "Duração não informada",
        "diretor": buscar_diretor(filme_id),
        "sinopse": detalhes.get("overview") or "Sinopse não disponível.",
        "streamings": buscar_streamings(filme_id) or ["Não disponível em streaming no momento"],
        "valor": valor,
        "poster_url": f"{IMAGEM_BASE}{detalhes['poster_path']}" if detalhes.get("poster_path") else None,
        "logo_url": buscar_logo(filme_id),
        "tmdb_id": filme_id,
    }


def garantir_colunas_novas():
    # create_all só cria tabelas que não existem; como "filmes" já existia
    # antes desses dois campos, precisamos adicioná-los manualmente.
    #
    # ESTE É O MOLDE pra migração manual que vamos precisar quando formos
    # adicionar `pedido_id` em Aluguel e CPF/endereço em Usuario pro recibo:
    # um ALTER TABLE ... ADD COLUMN IF NOT EXISTS, rodado uma vez, do mesmo
    # jeito que foi feito aqui pra poster_url/logo_url/tmdb_id.
    with engine.begin() as conexao:
        conexao.execute(text("ALTER TABLE filmes ADD COLUMN IF NOT EXISTS poster_url VARCHAR"))
        conexao.execute(text("ALTER TABLE filmes ADD COLUMN IF NOT EXISTS logo_url VARCHAR"))
        conexao.execute(text("ALTER TABLE filmes ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE"))


def main():
    Base.metadata.create_all(bind=engine)
    garantir_colunas_novas()
    db = SessionLocal()

    # Ordem importa: Devolucao referencia Aluguel, e Aluguel/Favorito
    # referenciam Filme (FK) — apagar na ordem errada quebraria com um erro
    # de violação de chave estrangeira no Postgres.
    print("Apagando devoluções, aluguéis, favoritos e filmes fictícios...")
    db.query(Devolucao).delete()
    db.query(Aluguel).delete()
    db.query(Favorito).delete()
    db.query(Filme).delete()
    db.commit()

    print("Buscando gêneros na TMDb...")
    generos_mapa = buscar_generos()

    print(f"Buscando candidatos em {len(LISTAS_ORIGEM)} listas da TMDb...")
    candidatos = buscar_candidatos()
    print(f"{len(candidatos)} candidatos únicos encontrados (após filtro de votos mínimos).")

    print(f"Selecionando {QUANTIDADE_FILMES} filmes com diversidade de gênero...")
    selecionados = selecionar_com_diversidade(candidatos, QUANTIDADE_FILMES)

    for i, resumo in enumerate(selecionados, start=1):
        dados = montar_filme(resumo, generos_mapa)
        db.add(Filme(**dados))
        print(f"[{i}/{len(selecionados)}] {dados['titulo']} ({dados['ano']}) — {', '.join(dados['generos'])}")
        time.sleep(0.05)

    db.commit()
    db.close()
    print(f"\n{len(selecionados)} filmes reais inseridos com sucesso.")


if __name__ == "__main__":
    main()
