# MovieHustler

Locadora de filmes virtual, estilo Blockbuster anos 2000 com uma cara de serviço de streaming moderno. Projeto full-stack: API em Python (FastAPI + PostgreSQL) e frontend em JavaScript puro (ES Modules, sem framework/build step).

## Funcionalidades

- **Catálogo real**, importado da [TMDb](https://www.themoviedb.org/) (pôster, logo, sinopse, direção, faixa etária, streamings disponíveis no Brasil), exibido em fileiras roláveis por gênero (estilo Netflix/Prime Video) ou em grade quando há filtro/busca ativos.
- **Conta de usuário** com cadastro/login (JWT), edição dos próprios dados (nome, e-mail, senha com confirmação da senha atual, CPF e endereço) e tema claro/escuro/automático.
- **Carrinho e aluguel real**: adicionar ao carrinho é local e reversível; "Finalizar aluguel" é quem de fato registra o aluguel na API, agência por agência.
- **Recibo em PDF**, gerado no backend (ReportLab) a cada finalização de carrinho e exibido num modal — comprovante interno, sem valor fiscal (não é NFS-e).
- **Favoritos sincronizados** com a conta (persistem entre dispositivos, com merge automático do que foi favoritado como visitante).
- **Painel administrativo** embutido na mesma página (atalho `M`, protegido por permissão de admin no servidor), com gráficos e relatórios de faturamento, e gestão de clientes, vendas, produtos e devoluções — com paginação e busca.
- Agências fictícias ambientadas em bairros reais de Florianópolis/SC.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, autenticação JWT (`python-jose`), hash de senha com `bcrypt`, geração de PDF com ReportLab.
- **Frontend:** JavaScript (ES Modules), HTML e CSS puros — sem framework nem bundler.

## Como rodar

### Backend

Pré-requisito: um projeto Postgres no [Supabase](https://supabase.com) (plano free serve). Pegue a connection string do **Transaction pooler** (botão "Connect" no topo do projeto → aba de URI → modo "Transaction", porta `6543`).

```bash
cd backend
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt
```

Crie um `.env` a partir de `.env.example`:

```
DATABASE_URL=postgresql://postgres.xxxxxxxx:sua_senha@aws-0-<região>.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=gere_uma_chave_aleatoria_com_python_-c_"import_secrets;print(secrets.token_hex(32))"
TMDB_API_KEY=pegue_a_sua_gratis_em_themoviedb.org/settings/api
```

```bash
./.venv/Scripts/python migrar.py              # cria as tabelas (obrigatório na primeira vez, e sempre que o schema mudar)
./.venv/Scripts/python seed.py                # opcional: popula com filmes fictícios
./.venv/Scripts/python popular_filmes_tmdb.py # opcional: substitui o catálogo por filmes reais da TMDb
./.venv/Scripts/python -m uvicorn app.main:app --reload
```

API em `http://localhost:8000`, docs em `http://localhost:8000/docs`.

Para acessar o painel admin, crie uma conta normal pelo site e promova ela:

```bash
./.venv/Scripts/python tornar_admin.py seu-email@exemplo.com
```

### Frontend

Os módulos ES exigem servir os arquivos por HTTP (não abrir `index.html` direto):

```bash
cd frontend
python -m http.server 5500
```

Acesse `http://localhost:5500/public/index.html`.

## Estrutura

```
backend/
├── app/
│   ├── models/       # tabelas SQLAlchemy (filme, agência, aluguel, pedido, usuário, favorito, devolução)
│   ├── schemas/       # formatos de entrada/saída (Pydantic)
│   ├── routes/         # endpoints da API
│   ├── security.py      # hash de senha e JWT
│   ├── dependencies.py   # checagem de usuário logado / admin
│   └── recibo.py           # geração do PDF do recibo
├── migrar.py           # cria/atualiza o schema no Postgres (rodar à mão)
├── seed.py            # popula o banco com dados fictícios
└── popular_filmes_tmdb.py  # popula o banco com filmes reais da TMDb

frontend/
├── public/index.html   # página única (site + admin embutido)
└── src/                  # módulos JS (um por responsabilidade) + CSS
```

## Licença

Projeto pessoal de estudo, sem licença de uso definida.
