"""Popula o banco com os filmes que já existem em frontend/src/movies.js."""

from app.database import Base, engine, SessionLocal
from app.models.filme import Filme
from app.models.agencia import Agencia

AGENCIAS = [
    {"nome": "MovieHustler Centro", "bairro": "Centro"},
    {"nome": "MovieHustler Jardins", "bairro": "Jardins"},
    {"nome": "MovieHustler Vila Nova", "bairro": "Vila Nova"},
    {"nome": "MovieHustler Zona Sul", "bairro": "Zona Sul"},
]

FILMES = [
    {
        "titulo": "Fúria no Asfalto",
        "generos": ["Ação", "Drama"],
        "ano": 1999,
        "faixa": "16",
        "duracao": "108 min",
        "diretor": "Marcos Vidal",
        "sinopse": "Um ex-piloto é arrastado de volta às pistas clandestinas para salvar o irmão de uma dívida perigosa.",
        "streamings": ["Netflix", "Prime Video"],
        "valor": 9.9,
    },
    {
        "titulo": "Código Vermelho",
        "generos": ["Ação"],
        "ano": 2001,
        "faixa": "14",
        "duracao": "115 min",
        "diretor": "Renata Cruz",
        "sinopse": "Uma agente infiltrada precisa expor uma conspiração antes que um ataque em série comece.",
        "streamings": ["HBO Max"],
        "valor": 11.9,
    },
    {
        "titulo": "Zona de Impacto",
        "generos": ["Ação", "Ficção Científica"],
        "ano": 2003,
        "faixa": "16",
        "duracao": "121 min",
        "diretor": "Thiago Nunes",
        "sinopse": "Um esquadrão de resgate enfrenta o relógio para evacuar uma cidade antes do colapso total.",
        "streamings": ["Netflix", "Disney+"],
        "valor": 12.9,
    },
    {
        "titulo": "Risadas em Série",
        "generos": ["Comédia", "Drama"],
        "ano": 1998,
        "faixa": "12",
        "duracao": "96 min",
        "diretor": "Paula Lemos",
        "sinopse": "Cinco amigos desajeitados tentam salvar a locadora do bairro de um fechamento certo.",
        "streamings": ["Prime Video", "Globoplay"],
        "valor": 7.9,
    },
    {
        "titulo": "Trapalhões S.A.",
        "generos": ["Comédia"],
        "ano": 2000,
        "faixa": "Livre",
        "duracao": "89 min",
        "diretor": "Carlos Eduardo",
        "sinopse": "Uma dupla de funcionários trapalhões vira sócia acidental da empresa onde trabalha.",
        "streamings": ["Globoplay"],
        "valor": 6.9,
    },
    {
        "titulo": "Casamento Trapalhão",
        "generos": ["Ação", "Comédia", "Drama"],
        "ano": 2004,
        "faixa": "12",
        "duracao": "102 min",
        "diretor": "Paula Lemos",
        "sinopse": "Um casamento planejado nos mínimos detalhes desanda logo na véspera da cerimônia.",
        "streamings": ["Netflix"],
        "valor": 8.9,
    },
    {
        "titulo": "A Casa do Fim",
        "generos": ["Terror"],
        "ano": 2002,
        "faixa": "18",
        "duracao": "99 min",
        "diretor": "Igor Salles",
        "sinopse": "Uma família se muda para uma casa antiga e descobre que não está sozinha à noite.",
        "streamings": ["HBO Max", "Prime Video"],
        "valor": 9.9,
    },
    {
        "titulo": "Sombra na Névoa",
        "generos": ["Terror", "Drama"],
        "ano": 1997,
        "faixa": "16",
        "duracao": "94 min",
        "diretor": "Helena Bastos",
        "sinopse": "Uma neblina toma conta de uma cidade pequena e revela algo que espreita entre as casas.",
        "streamings": ["Netflix"],
        "valor": 8.5,
    },
    {
        "titulo": "O Chamado da Noite",
        "generos": ["Terror"],
        "ano": 2005,
        "faixa": "18",
        "duracao": "107 min",
        "diretor": "Igor Salles",
        "sinopse": "Ligações misteriosas à meia-noite conectam vítimas que nunca se conheceram.",
        "streamings": ["Disney+"],
        "valor": 10.9,
    },
    {
        "titulo": "Lágrimas de Outono",
        "generos": ["Drama"],
        "ano": 1996,
        "faixa": "14",
        "duracao": "118 min",
        "diretor": "Beatriz Moraes",
        "sinopse": "Duas irmãs afastadas por anos precisam se reencontrar diante da doença do pai.",
        "streamings": ["Globoplay", "Prime Video"],
        "valor": 7.5,
    },
    {
        "titulo": "Caminhos Cruzados",
        "generos": ["Drama", "Ação"],
        "ano": 2003,
        "faixa": "12",
        "duracao": "124 min",
        "diretor": "Fernando Alves",
        "sinopse": "As vidas de três estranhos se cruzam após um acidente que muda seus destinos.",
        "streamings": ["Netflix"],
        "valor": 8.9,
    },
    {
        "titulo": "Estrelas Distantes",
        "generos": ["Ficção Científica"],
        "ano": 2000,
        "faixa": "12",
        "duracao": "132 min",
        "diretor": "Sofia Rangel",
        "sinopse": "Uma tripulação perdida no espaço precisa escolher entre voltar para casa ou explorar o desconhecido.",
        "streamings": ["HBO Max", "Disney+"],
        "valor": 13.9,
    },
    {
        "titulo": "Colônia Zero",
        "generos": ["Ficção Científica", "Terror"],
        "ano": 2004,
        "faixa": "14",
        "duracao": "128 min",
        "diretor": "Rafael Toledo",
        "sinopse": "A primeira colônia humana em Marte enfrenta uma ameaça que veio junto na viagem.",
        "streamings": ["Prime Video"],
        "valor": 12.5,
    },
    {
        "titulo": "Robôs do Amanhã",
        "generos": ["Ficção Científica", "Comédia"],
        "ano": 1999,
        "faixa": "Livre",
        "duracao": "97 min",
        "diretor": "Sofia Rangel",
        "sinopse": "Um engenheiro cria um robô com sentimentos e precisa protegê-lo de ser desligado.",
        "streamings": ["Netflix", "Globoplay"],
        "valor": 9.5,
    },
    {
        "titulo": "Aventura na Floresta",
        "generos": ["Infantil"],
        "ano": 2001,
        "faixa": "Livre",
        "duracao": "82 min",
        "diretor": "Camila Rezende",
        "sinopse": "Um grupo de animais da floresta se une para salvar seu lar de um incêndio.",
        "streamings": ["Disney+"],
        "valor": 6.5,
    },
    {
        "titulo": "O Reino Encantado",
        "generos": ["Infantil", "Comédia"],
        "ano": 1998,
        "faixa": "Livre",
        "duracao": "88 min",
        "diretor": "Camila Rezende",
        "sinopse": "Uma princesa corajosa parte em busca do feitiço que devolverá as cores ao seu reino.",
        "streamings": ["Netflix", "Disney+"],
        "valor": 6.9,
    },
]

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(Filme).count() == 0:
    db.add_all(Filme(**dados) for dados in FILMES)
    db.commit()
    print(f"{len(FILMES)} filmes inseridos.")
else:
    print("O banco já tem filmes — nada foi inserido.")

if db.query(Agencia).count() == 0:
    db.add_all(Agencia(**dados) for dados in AGENCIAS)
    db.commit()
    print(f"{len(AGENCIAS)} agências inseridas.")
else:
    print("O banco já tem agências — nada foi inserido.")

db.close()
