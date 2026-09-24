# MovieHustler

Locadora de filmes virtual, estilo Blockbuster anos 2000 com uma cara de serviço de streaming moderno. Projeto full-stack: API em Python (FastAPI + PostgreSQL) e frontend em JavaScript puro (ES Modules, sem framework/build step) — os dois servidos pelo mesmo processo FastAPI, mesma origem.

## Funcionalidades

- **Catálogo real**, importado da [TMDb](https://www.themoviedb.org/) (pôster, logo, sinopse, direção, faixa etária, streamings disponíveis no Brasil), exibido em fileiras roláveis por gênero (estilo Netflix/Prime Video) ou em grade quando há filtro/busca ativos.
- **Conta de usuário** com cadastro/login (JWT), edição dos próprios dados (nome, e-mail, senha com confirmação da senha atual, CPF e endereço), redefinição de senha por e-mail ("esqueci minha senha") e tema claro/escuro/automático.
- **Carrinho e aluguel real**: adicionar ao carrinho é local e reversível; "Finalizar aluguel" é quem de fato registra o aluguel na API, agência por agência.
- **Recibo em PDF**, gerado no backend (ReportLab) a cada finalização de carrinho e exibido num modal — comprovante interno, sem valor fiscal (não é NFS-e). Preço congelado no momento da compra (não muda se o valor do filme mudar depois) e reaberto a qualquer momento em "Meus Pedidos".
- **Favoritos sincronizados** com a conta (persistem entre dispositivos, com merge automático do que foi favoritado como visitante).
- **Painel administrativo** embutido na mesma página (atalho `M`, protegido por permissão de admin no servidor), com gráficos e relatórios de faturamento, e gestão de clientes, vendas, produtos e devoluções — com paginação e busca.
- Agências fictícias ambientadas em bairros reais de Florianópolis/SC.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, autenticação JWT (`pyjwt`), hash de senha com `bcrypt`, geração de PDF com ReportLab, envio de e-mail via SMTP do Gmail (biblioteca padrão `smtplib`, sem dependência extra).
- **Frontend:** JavaScript (ES Modules), HTML e CSS puros — sem framework nem bundler.

## Como rodar

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
GMAIL_EMAIL=conta_gmail_que_envia_o_email_de_redefinicao@gmail.com
GMAIL_APP_SENHA=senha_de_app_de_16_caracteres_gerada_em_myaccount.google.com/apppasswords
```

```bash
./.venv/Scripts/python migrar.py              # cria as tabelas (obrigatório na primeira vez, e sempre que o schema mudar)
./.venv/Scripts/python seed.py                # opcional: popula com filmes fictícios
./.venv/Scripts/python popular_filmes_tmdb.py # opcional: substitui o catálogo por filmes reais da TMDb
./.venv/Scripts/python -m uvicorn app.main:app --reload
```

Um único servidor em `http://localhost:8000` — a própria API serve o site (`app.mount()` em `app/main.py`, ver "Estrutura" abaixo). Docs automáticas do Swagger em `http://localhost:8000/docs`, health-check em `http://localhost:8000/status`.

Para acessar o painel admin, crie uma conta normal pelo site e promova ela:

```bash
./.venv/Scripts/python tornar_admin.py seu-email@exemplo.com
```

## Estrutura

```
backend/
├── app/
│   ├── models/       # tabelas SQLAlchemy (filme, agência, aluguel, pedido, usuário, favorito, devolução)
│   ├── schemas/       # formatos de entrada/saída (Pydantic)
│   ├── routes/         # endpoints da API
│   ├── security.py      # hash de senha, JWT e token de redefinição de senha
│   ├── dependencies.py   # checagem de usuário logado / admin
│   ├── recibo.py           # geração do PDF do recibo
│   ├── email.py              # envio de e-mail (redefinição de senha) via SMTP do Gmail
│   └── main.py                 # monta a API e, por último, o frontend estático (frontend/)
├── frontend/              # frontend — servido pela própria API, mesma origem
│   ├── index.html         # página única (site + admin embutido)
│   ├── redefinir-senha.html # destino do link de "esqueci minha senha" (fora da SPA)
│   └── src/                 # módulos JS (um por responsabilidade) + CSS
├── migrar.py           # cria/atualiza o schema no Postgres (rodar à mão)
├── seed.py            # popula o banco com dados fictícios
└── popular_filmes_tmdb.py  # popula o banco com filmes reais da TMDb
```

## Licença

Projeto pessoal de estudo, sem licença de uso definida.
