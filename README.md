# MOVIEHUSTLER

Locadora de filmes virtual, estilo Blockbuster anos 2000. Projeto de estudo full-stack — este README é atualizado conforme cada parte nova é estudada/construída, organizado por categoria.

**Status geral:** stack completa funcionando — backend com CRUD, autenticação JWT e PostgreSQL; frontend com login/cadastro conectados, aluguel protegido por conta e favoritos sincronizados com a API (persistem entre dispositivos, com merge automático do que foi favoritado como visitante); painel administrativo separado (`admin.html`), com login próprio, relatórios de faturamento em SQL e gestão de clientes/vendas/produtos/devoluções

**Índice:** [Frontend](#--frontend-javascript-html-css) · [Backend](#--backend-python) ([bug do ForeignKey](#bug-real-que-encontramos-e-corrigimos-foreignkey-sem-integridade-aplicada) · [hash/sal/JWT](#aprofundando-hash-de-senha-sal-e-jwt) · [acesso admin escondido](#aprofundando-por-que-acesso-escondido-não-pode-significar-url-secreta) · [bug do JOIN/select_from](#bug-real-dbqueryfuncavg-não-sabe-de-onde-partir-o-join) · [faturamento médio ambíguo](#aprofundando-por-que-faturamento-médio-sozinho-é-uma-pergunta-incompleta)) · [Banco de dados](#--banco-de-dados) · [Visão geral do produto](#visão-geral-do-produto-o-que-o-moviehustler-é)

---

## 🟨 Frontend (JavaScript, HTML, CSS)

**Status:** funcional, modularizado em ES Modules

### Como rodar

O projeto usa módulos ES (`import`/`export`) no JavaScript, então **não dá pra abrir o `index.html` direto com duplo clique** — o navegador bloqueia carregamento de módulos vindos de `file://` por segurança (CORS). É preciso servir os arquivos por HTTP.

Forma mais simples (usando Python, que já vem instalado):

```bash
cd frontend
python -m http.server 5500
```

Depois abra no navegador:

```
http://localhost:5500/public/index.html
```

Repare que a URL entra por `public/index.html`, mas o servidor precisa ser iniciado a partir da pasta `frontend/` (não de dentro de `public/`) — é isso que permite o navegador buscar corretamente os arquivos de `src/` através dos caminhos relativos (`../src/...`) usados no HTML.

Pra parar o servidor, `Ctrl+C` no terminal onde ele está rodando.

**Alternativa:** se você usa VS Code, a extensão **Live Server** faz a mesma coisa com um clique ("Go Live"), sem precisar do comando acima.

### Estrutura

```
frontend/
├── public/
│   ├── index.html       # estrutura da página (cliente)
│   └── admin.html         # estrutura do painel administrativo — não linkada do site do cliente
└── src/
    ├── app.js            # ponto de entrada do site do cliente — importa e liga tudo
    ├── admin.js            # ponto de entrada do painel admin — login, abas, tabelas, relatórios
    ├── config.js             # URL_API — configuração compartilhada
    ├── auth.js                # login/registro/token — fala com /auth da API (usado pelos dois pontos de entrada)
    ├── adminApi.js              # chamadas às rotas /admin/* — sempre com o token no header
    ├── conta.js                   # modal de login/cadastro do cliente (abas, formulários)
    ├── perfil.js                    # botão de conta, menu do perfil, painéis (Perfil/Pedidos/Configurações)
    ├── tema.js                        # modo claro/escuro/sistema — grava a escolha no localStorage
    ├── catalogo.js                      # grade de filmes, filtros, busca, ordenação
    ├── modal.js                           # popup de detalhes do filme + fluxo de aluguel
    ├── carrinho.js                          # estado e painel do carrinho
    ├── favoritos.js                           # estado dos favoritos (♥) — API quando logado, localStorage quando visitante
    ├── movies.js                                # dados do catálogo (filmes, agências, aluguel) + CRUD de filme (admin)
    ├── utilitarios.js                             # funções auxiliares (formatação, busca)
    ├── style.css                                    # visual do site do cliente (paleta azul/amarelo)
    └── admin.css                                      # visual do painel admin (reaproveita os tokens de style.css)
```

### O que já existe

- Catálogo com filtro por categoria, busca por título e ordenação (preço, ano, nome)
- Popup de detalhes ao clicar num filme (poster, sinopse, elenco, streamings)
- **Login e cadastro** com visual próprio (abas, campos com placeholder, marca MOVIEHUSTLER no topo do modal) — dois pontos de entrada separados: botão "Entrar" e botão "Criar conta", cada um abrindo o modal já na aba certa
- **Medidor de força de senha** no cadastro: barra + rótulo (Muito fraca → Muito forte) que atualiza a cada tecla digitada, avaliando tamanho, maiúsculas/minúsculas, números e símbolos
- **Menu do perfil**: depois de logado, o botão vira um avatar + primeiro nome, que abre um menu com 5 opções — **Perfil** (nome/email da conta), **Pedidos** (histórico real de aluguéis, vindo de `GET /alugueis/`), **Favoritos** (painel próprio com os filmes favoritados), **Configurações** (tema claro/escuro/sistema) e **Sair**
- Aluguel real, protegido por login: escolher agência e clicar "Alugar agora" chama `POST /alugueis/` com o token no header `Authorization`. Se a pessoa não estiver logada, o clique abre o modal de login em vez de tentar a chamada (o botão já avisa antes, mostrando "Entrar para alugar")
- Favoritos (♥ no card): "Favoritos" no menu do perfil abre um **painel separado** (igual "Pedidos") com só os filmes favoritados — o catálogo por trás não é alterado, evitando o bug de uma versão anterior onde favoritar sobrescrevia o filtro/categoria que a pessoa estava vendo
- **Favoritos ligados à conta**: logado, favoritar chama `POST /favoritos/` / `DELETE /favoritos/{filme_id}` (nova tabela `favoritos`, única por par usuário+filme) em vez de só gravar no `localStorage` — os favoritos passam a acompanhar a conta entre navegadores/dispositivos diferentes. Deslogado, continua funcionando via `localStorage` (visitante); ao fazer login ou criar conta, os favoritos guardados como visitante são **mesclados** com os da conta (`sincronizarFavoritosAposLogin` em `favoritos.js`) em vez de descartados
- **Logo clicável**: clicar em "MOVIEHUSTLER" no cabeçalho fecha qualquer modal/painel aberto e volta pro estado inicial do catálogo (categoria "Todos", busca e ordenação limpas, rolagem pro topo)
- **Modo claro/escuro com 3 opções** (Claro / Escuro / Padrão do sistema), escolhido em Configurações → Aparência, salvo no `localStorage`. O modo escuro foi redesenhado pra ser **preto de verdade, sem amarelo** — a cor da marca "amarelo-blockbuster" vira azul só no tema escuro (ver "Aprofundando" abaixo), então todo botão/selo que era amarelo no claro (Criar conta, Alugar agora, faixa etária, etc.) fica azul no escuro
- Botão do carrinho **fixo no canto inferior direito da tela** (sempre visível, mesmo rolando a página) — separado da área de conta, que fica no topo
- **Hierarquia tipográfica com 3 níveis** (ver "Aprofundando" abaixo pro porquê): **"Machine Medium"** (ITC Machine — a fonte real da marca Blockbuster) só no logo, uso único; **"Bebas Neue"** (Google Fonts) reservada só pra títulos de verdade — seções, nome do filme no popup, título dos painéis, título dos cards de filme; **"Manrope"** (Google Fonts) em tudo o resto — texto corrido E também botões/abas/itens de menu, variando peso (negrito nos controles, regular no texto) em vez de trocar de fonte pra cada elemento
- Persistência local via `localStorage` (carrinho, sessão de login, preferência de tema, e favoritos só enquanto deslogado)
- **Painel administrativo** (`admin.html`, separado do site do cliente — ver ["Aprofundando: por que 'acesso escondido' não pode significar 'URL secreta'"](#aprofundando-por-que-acesso-escondido-não-pode-significar-url-secreta) na seção de Backend): login próprio (mesma API de autenticação, mas rejeita quem não é admin), com 5 abas —
  - **Visão geral**: os 3 relatórios pedidos — faturamento por mês, filmes mais alugados e faturamento médio (que na prática virou **dois** números, ver "Aprofundando" na seção de Backend) — consumindo `/admin/relatorios/*`
  - **Clientes**: lista de usuários cadastrados (`GET /admin/clientes/`)
  - **Vendas**: todo o histórico de aluguéis de todo mundo (não só o do usuário logado, diferente de "Pedidos" no site do cliente), com o nome do cliente, e um botão **Marcar devolução** por linha ainda não devolvida
  - **Produtos**: lista de filmes com formulário de cadastro (`POST /filmes/`) e botão de remover (`DELETE /filmes/{id}`) — reaproveita as mesmas rotas do catálogo público, agora protegidas por admin (ver "O que ainda falta" — editar filme existente não foi implementado ainda)
  - **Devoluções**: histórico de tudo que já foi devolvido, com data do aluguel e da devolução lado a lado

> **Nota sobre fontes auto-hospedadas e licença**: `frontend/src/fonts/` guarda dois arquivos servidos via `@font-face` (diferente do Bebas Neue/Manrope, que vêm de um link do Google Fonts). **`ITC Machine LT Medium.ttf`** é a fonte oficial usada no logo — é uma fonte **comercial** da ITC/Monotype; o arquivo foi fornecido pelo próprio usuário do projeto, que já possuía uma licença legítima, e **não está versionado no Git** (`.gitignore`) por não ser nosso pra redistribuir. **`Blockbuster.ttf`** (baixado do DaFont, autor Fenotype, "100% Free" segundo o próprio site) fica como *fallback* caso a fonte comercial não esteja disponível — essa sim seguiu no repositório, mas sem garantia de licença pra uso comercial, só pra estudo local.
- Catálogo e agências vindos de verdade da API (`fetch` em `movies.js`), com tratamento de erro caso o backend esteja fora do ar

> **Aprofundando: por que "hierarquia tipográfica" não é "trocar a fonte de tudo"**. Na primeira versão, apliquei Bebas Neue em praticamente todo texto clicável (botões, abas, itens de menu, categorias) além dos títulos — o resultado visual foi "tudo com a mesma fonte", mesmo tecnicamente usando 3 famílias diferentes no projeto. Pesquisei o princípio de hierarquia tipográfica (fontes: [Toptal — Typographic Hierarchy](https://www.toptal.com/designers/typography/typographic-hierarchy) e um levantamento geral sobre tipografia web) e a regra central é: **use poucas famílias de fonte (2–3 no máximo) e construa a hierarquia com tamanho, peso e espaçamento, não trocando a fonte a cada elemento**. Um heading precisa ser "significativamente mais proeminente" que um botão — não simplesmente *diferente*. A correção: Bebas Neue voltou a ser exclusiva de título de verdade (uso raro, alto contraste), e botões/abas/menu voltaram pro Manrope, mas em `font-weight: 700` (negrito) em vez do `400` regular do texto corrido — a mesma família, mas com peso diferente sinalizando "isto é interativo", distinto de "isto é um parágrafo".

### O que ainda falta

- Renovar/expirar sessão de forma amigável: hoje, se o token expirar (1 dia), a próxima tentativa de alugar simplesmente falha — falta detectar isso e reabrir o login automaticamente
- Imagens reais de filme (capas são placeholders coloridos com o título)
- Carrinho ainda é só local (`localStorage`) — só o aluguel em si (`POST /alugueis/`) é persistido no backend; "finalizar compra" não faz nada no servidor ainda
- Editar dados da conta (nome/e-mail/senha) — o item "Configurações" ainda só tem o seletor de tema
- No painel admin: **editar** um filme existente (só criar e remover foram implementados — um `PUT /filmes/{id}` já existe no backend, falta só o formulário); paginação/busca nas tabelas de Clientes e Vendas (hoje carregam tudo de uma vez, ok pros ~18 filmes/poucos usuários de um projeto de estudo, mas não escalaria); os relatórios são só tabelas, sem gráfico de verdade (nenhuma lib de chart foi usada de propósito, pra manter zero dependência externa nessa etapa)

### Conceitos de JavaScript estudados

Resumo completo e detalhado, com exemplos do código real do projeto: **[guia de estudo publicado](https://claude.ai/artifact/9nxDzxeLQ2B7r7VsYUpcHj)**.

Lista rápida: DOM (seleção/criação de elementos, template literals), eventos e closures, métodos funcionais de array (`filter`, `find`, `sort`), captura de formulário e normalização de texto, `localStorage`, Promises e `async/await`, módulos ES (`import`/`export`).

**Sobre login (novo):**

- **`auth.js` vs. `conta.js` — mesma separação que já vimos no backend.** `auth.js` só fala com a API e o `localStorage` (funções puras de dados: `login`, `registrar`, `sair`, `obterToken`); `conta.js` é quem mexe no DOM (abrir modal, trocar aba, mostrar erro). É o mesmo princípio de `security.py`/`dependencies.py` no Python: lógica de dados separada de lógica de interface, cada uma testável e substituível sem mexer na outra.
- **`URLSearchParams`**: o `/auth/login` do backend espera dados no formato de formulário (`username=...&password=...`), não JSON — por isso `login()` em `auth.js` usa `new URLSearchParams()` pra montar esse corpo, em vez de `JSON.stringify()`. É o formato padrão que `<form>`s HTML mandam nativamente, e o motivo de existir é compatibilidade com o fluxo OAuth2 que o FastAPI (e o Swagger) esperam.
- **Sessão simulada com `localStorage`**: como não existe "sessão de servidor" (o JWT é stateless — ver seção de Backend), guardar o usuário logado é responsabilidade só do navegador. `estaLogado()` é simplesmente `Boolean(obterToken())` — nenhuma chamada à API, só verifica se existe alguma coisa salva localmente. Isso é rápido, mas também é o motivo do próximo item da lista de pendências: se o token expirar no servidor, o frontend não vai saber até tentar usar ele e receber `401`.
- **Callback em vez de import circular (de novo)**: `perfil.js` importa `abrirConta` de `conta.js` (pra abrir o modal quando clica em "Entrar"). Só que `conta.js` também precisa *avisar* `perfil.js` quando o login for concluído (pra atualizar o botão de "Entrar" pra o avatar). Se `conta.js` importasse `perfil.js` de volta, seria um import circular — o mesmo problema que já resolvemos entre `favoritos.js`/`catalogo.js` lá no início do projeto. A solução é igual: `iniciarConta(callback)` recebe uma função de `perfil.js` e guarda numa variável (`aoAutenticar`), chamando ela só depois de um login/cadastro bem-sucedido — `conta.js` nunca precisa saber que `perfil.js` existe.
- **Restaurando o padrão de 3 blocos de tema (CSS) + `data-theme` (JS)**: quando o modo escuro era só automático, um `@media (prefers-color-scheme: dark)` sozinho bastava. Com escolha manual, voltamos ao padrão de 3 blocos: `:root` (claro, padrão), `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` (escuro automático, mas só se a pessoa não tiver escolhido "claro" manualmente) e `:root[data-theme="dark"] {...}` (escuro forçado, vence mesmo com SO claro). `tema.js` só faz uma coisa: escrever ou remover o atributo `data-theme` no `<html>` — todo o resto é o CSS reagindo sozinho a esse atributo.
- **Trocar a cor sem tocar em nenhum componente**: pra "abolir o amarelo" do modo escuro, a mudança inteira ficou restrita às ~10 linhas de tokens em `:root:not([data-theme="light"])`/`:root[data-theme="dark"]`. `--amarelo-blockbuster` (o token) passou a valer um azul (`#6fa8ff`) só nesses dois blocos — nenhuma regra de `.botao-alugar`, `.faixa-etaria`, `.pill-streaming` etc. precisou mudar, porque todas elas já liam a cor através da variável, nunca de um valor cravado. É a mesma ideia de indireção que os tokens de design já garantiam desde o início do projeto, só que agora colhendo o benefício de verdade: trocar uma marca inteira de cor em um lugar só.
- **Dropdown fechando ao clicar fora**: o menu do perfil usa um padrão comum em interfaces — um listener de `click` no `document` inteiro que fecha o menu se o clique não aconteceu dentro dele (`!evento.target.closest(".perfil-wrap")`). É diferente do padrão usado nos modais (`.modal-fundo`), que fecham só clicando no fundo escurecido — um dropdown pequeno não tem "fundo" próprio, então a checagem precisa ser feita no documento inteiro.

- **Medidor de força de senha com regex simples**: `avaliarForcaSenha()` soma 1 ponto pra cada critério que a senha atende (`senha.length >= 6`, `length >= 10`, tem maiúscula *e* minúscula, tem número, tem símbolo) usando testes de regex (`/[A-Z]/.test(senha)`, etc.) — sem nenhuma biblioteca externa. A pontuação (0 a 5) vira um índice num array de 5 "níveis" (rótulo + classe CSS). A cor de cada nível fica numa variável CSS local por classe (`.nivel-1 { --cor-nivel: ... }`), reaproveitada tanto pelo preenchimento da barra (`background`) quanto pelo texto (`color`) — evita repetir a mesma cor em dois lugares do CSS.

- **Reaproveitar um componente sem acoplar comportamento (correção de bug)**: a primeira versão de "Favoritos" reaproveitava o filtro do catálogo principal (marcar `somenteFavoritos = true` e re-renderizar a mesma grade) — o problema é que isso **mudava o estado que a pessoa já estava vendo** (categoria, busca), então voltar do "modo favoritos" perdia o lugar onde ela estava. A correção foi separar de vez: `criarCardFilme(filme, aoMudarFavorito)` passou a receber a função de re-renderização como parâmetro, em vez de sempre chamar a `renderizarFilmes()` do catálogo principal. Agora o painel de Favoritos (em `perfil.js`) passa sua **própria** função de re-render (`renderizarFavoritos`), e o catálogo por trás nunca é tocado — o mesmo componente (`criarCardFilme`) serve dois contextos diferentes sem que um saiba da existência do outro.

- **Atualização otimista (*optimistic UI*), com desfazer em caso de falha**: quando `alternarFavorito()` é chamado logado, o coração do card muda de cor **antes** da resposta da API chegar — o `Set` local de favoritos é alterado e a tela re-renderiza de imediato, e só depois disso o `fetch` pro `POST`/`DELETE /favoritos/` é disparado em segundo plano. Pesquisando o padrão (ele tem nome — *optimistic UI update*), a regra central que aparece em toda fonte séria sobre o assunto é: **atualização otimista sem um caminho de reversão (*rollback*) não é uma otimização, é um bug** — a interface tem que voltar pro estado real sempre que a chamada falhar, não pode ficar "mentindo" pro usuário. É exatamente o que o `catch` de `alternarFavorito()` faz: se o `fetch` falhar (rede caiu, token expirou), o código desfaz manualmente a mudança que já tinha feito no `Set` (adiciona de volta se tinha removido, remove se tinha adicionado) e re-renderiza de novo — sem isso, um favorito que falhou ao salvar ficaria mostrando "favoritado" na tela pra sempre, mesmo sem existir de verdade na conta. É o mesmo motivo de não usarmos esse padrão pra ações mais arriscadas (como finalizar um aluguel) — otimismo só compensa quando o custo de errar é baixo e reversível na hora.

  *Fontes consultadas: [freeCodeCamp — How to Use the Optimistic UI Pattern](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) e [DEV Community — Oops, Our Optimistic Update Has an Error?](https://dev.to/javapixastudio/oops-our-optimistic-update-has-an-error-heres-how-to-fix-it-pbo) — os exemplos são em React (`useOptimistic`), mas o princípio (estado local muda antes da confirmação do servidor, com rollback garantido no erro) é o mesmo aplicado aqui à mão, sem framework.*

- **Um segundo "app" inteiro reaproveitando os módulos do primeiro**: `admin.js` é um ponto de entrada novo (carregado por `admin.html`, não por `index.html`), mas não duplicou nada de `auth.js` — ele importa `login`, `sair`, `estaLogado` e `obterUsuario` exatamente como `conta.js`/`perfil.js` importam. Só foi possível porque `auth.js` desde o início só fala com a API e o `localStorage`, sem nenhuma referência a elementos do DOM do site do cliente (nenhum `document.getElementById` lá dentro) — é o mesmo motivo, aplicado num nível maior, de `security.py` ser reaproveitável no backend: uma peça que só manipula dados, sem saber quem é "dono" da tela, serve qualquer tela que precisar dela.
- **Checagem de admin no frontend é conveniência, não segurança**: depois do login em `admin.js`, `if (!usuario.is_admin)` decide só se o painel *aparece* — quem realmente impede um cliente comum de ver dados de outros clientes é o backend (`get_admin_atual`, que devolve `403` pra qualquer token de usuário sem `is_admin`). Se essa checagem existisse só no frontend, bastaria alguém abrir o DevTools e chamar `fetch("/admin/clientes/", ...)` direto pra contornar. A regra geral (que já vale pra tudo nesse projeto, não só o admin): **toda validação client-side existe pra dar feedback rápido pro usuário legítimo, nunca pra ser a única barreira** — a fonte da verdade sobre permissão é sempre o servidor.

#### Bug real: o atributo `hidden` sendo ignorado por causa do `display: flex`

Depois de adicionar o menu do perfil e o modal de login, um teste automatizado (Playwright, headless) pegou um bug visual sério: o formulário de cadastro aparecia **junto** com o de login, os dois sobrepostos, mesmo o de cadastro tendo o atributo `hidden` no HTML. O mesmo problema afetava o contador do carrinho, que mostrava "0" na tela mesmo com `hidden` ativo.

A causa: o navegador aplica `[hidden] { display: none }` como uma regra padrão (do próprio navegador, não nossa). Mas quando uma classe nossa como `.form-conta { display: flex; ... }` também define `display`, a regra do **autor da página** (nosso CSS) tem prioridade sobre a regra padrão do navegador — não importa a especificidade do seletor, a origem da regra já decide, e CSS de autor sempre vence CSS do navegador. Resultado: `.form-conta` "reescreve" o `display` toda vez, e o atributo `hidden` deixa de esconder qualquer coisa nesse elemento.

A correção foi uma regra só, no topo do arquivo:

```css
[hidden] {
  display: none !important;
}
```

O `!important` aqui não é um "jeito preguiçoso de resolver" — é a ferramenta certa pra esse caso específico: garantir que esconder um elemento (`hidden`) sempre vença qualquer outra regra de `display`, não importa quantas classes a mais o elemento ganhe no futuro. Sem essa garantia, todo componente novo que usar `hidden` + `display: flex`/`grid` teria esse mesmo bug escondido, um por um.

---

## 🟦 Backend (Python)

**Status:** CRUD completo de filmes, agências e aluguéis — rodando sobre PostgreSQL, conectado ao frontend, com área administrativa protegida por `is_admin`

### Como rodar

Pré-requisito: **PostgreSQL instalado e rodando localmente** (porta padrão `5432`), com um banco chamado `moviehustler` criado (`CREATE DATABASE moviehustler;`).

```bash
cd backend
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt   # primeira vez só
```

Crie um arquivo `.env` (não versionado — veja `.env.example`) com a string de conexão:

```
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/moviehustler
JWT_SECRET_KEY=gere_uma_chave_aleatoria_com_python_-c_"import_secrets;print(secrets.token_hex(32))"
```

```bash
./.venv/Scripts/python seed.py                     # cria as tabelas e popula com os 16 filmes/4 agências (só precisa rodar 1x)
./.venv/Scripts/uvicorn app.main:app --reload
```

Servidor sobe em `http://localhost:8000`. Documentação automática (Swagger) em `http://localhost:8000/docs`.

Pra acessar o painel administrativo (`frontend/public/admin.html`), primeiro crie uma conta normal pelo site do cliente (ou via `POST /auth/registrar`), depois promova ela a admin:

```bash
./.venv/Scripts/python tornar_admin.py seu-email@exemplo.com
```

### Estrutura

```
backend/
├── .env                     # DATABASE_URL local (não versionado)
├── .env.example              # modelo do .env pra quem for clonar o projeto
├── app/
│   ├── database.py         # engine + sessão do PostgreSQL (lê DATABASE_URL do .env)
│   ├── main.py               # cria as tabelas, liga CORS, inclui as rotas
│   ├── security.py            # hash de senha (bcrypt) + criar/decodificar token JWT — sem tocar no banco
│   ├── dependencies.py         # get_usuario_atual (exige login) e get_admin_atual (exige login + is_admin)
│   ├── models/
│   │   ├── filme.py           # tabela `filmes` (SQLAlchemy)
│   │   ├── agencia.py          # tabela `agencias`
│   │   ├── aluguel.py           # tabela `alugueis` (liga filme + agência + usuario por ForeignKey)
│   │   ├── favorito.py           # tabela `favoritos` (liga usuario + filme, único por par)
│   │   ├── devolucao.py           # tabela `devolucoes` (liga a um aluguel, único por aluguel)
│   │   └── usuario.py            # tabela `usuarios` (nome, email, senha_hash, is_admin)
│   ├── schemas/
│   │   ├── filme.py           # formato de entrada/saída de /filmes
│   │   ├── agencia.py          # formato de entrada/saída de /agencias
│   │   ├── aluguel.py           # formato de entrada/saída de /alugueis (AluguelOut e VendaOut, com o cliente)
│   │   ├── favorito.py          # formato de entrada/saída de /favoritos
│   │   ├── devolucao.py          # formato de entrada/saída de /admin/devolucoes
│   │   ├── relatorio.py           # formato de saída dos 3 relatórios de /admin/relatorios
│   │   └── usuario.py            # UsuarioCreate, UsuarioOut, Token
│   └── routes/
│       ├── filmes.py          # endpoints de /filmes (escrita agora exige admin)
│       ├── agencias.py         # endpoints de /agencias
│       ├── alugueis.py          # endpoints de /alugueis
│       ├── favoritos.py         # endpoints de /favoritos
│       ├── admin.py              # clientes, vendas, devoluções e relatórios — tudo exige admin
│       └── auth.py               # /auth/registrar, /auth/login, /auth/me
├── seed.py                 # popula o banco com filmes/agências que já existiam no frontend
├── tornar_admin.py          # script de linha de comando pra promover uma conta existente a admin
└── requirements.txt
```

### O que já existe

**Filmes**
- `GET /filmes/` — lista o catálogo completo (pública, sem login — é o que abastece o site do cliente)
- `GET /filmes/{id}` — busca um filme específico (404 se não existir)
- `POST /filmes/` — **requer admin** — cadastra um filme novo
- `PUT /filmes/{id}` — **requer admin** — substitui os dados de um filme existente (404 se não existir)
- `DELETE /filmes/{id}` — **requer admin** — remove um filme (404 se não existir; **409** se o filme tiver algum aluguel no histórico — ver "Aprofundando" abaixo)
- Modelo `Filme` com `generos` e `streamings` guardados como `JSON` (o SQLAlchemy serializa a lista Python pra string e desserializa de volta sozinho)
- *(Gap real que corrigimos ao construir a área admin: até então, `POST`/`PUT`/`DELETE` de `/filmes/` não exigiam login nenhum — qualquer pessoa com acesso ao Swagger podia alterar o catálogo. Isso passou despercebido enquanto não havia conceito de "dono do catálogo"; ganhou uma correção real, não só a área admin nova, no mesmo momento em que essa distinção passou a existir.)*

**Agências e aluguéis**
- `GET /agencias/` — lista as 4 agências fixas (mesmas que já existiam em `movies.js`, agora vindas do banco)
- `GET /alugueis/` — **requer login** — histórico de aluguéis só do usuário dono do token (cada um já vem com o filme e a agência completos, não só os ids)
- `POST /alugueis/` — **requer login** — registra um aluguel pro usuário logado (recebe `filme_id` + `agencia_id`; 404 se algum dos dois não existir)
- `DELETE /alugueis/{id}` — **requer login** — cancela um aluguel, só se ele pertencer ao usuário logado (404 — não 403 — se pertencer a outra pessoa, pra não revelar que o aluguel existe)

**Favoritos**
- `GET /favoritos/` — **requer login** — lista os favoritos do usuário logado, cada um já com o filme completo
- `POST /favoritos/` — **requer login** — adiciona um favorito (`filme_id`); se já existir, devolve o mesmo registro em vez de duplicar (idempotente — importante porque o frontend chama isso de novo ao mesclar favoritos de visitante com a conta)
- `DELETE /favoritos/{filme_id}` — **requer login** — remove um favorito (404 se não existir pra esse usuário)
- Modelo `Favorito` com `UniqueConstraint(usuario_id, filme_id)` — o banco garante que não existam dois registros do mesmo filme favoritado duas vezes pro mesmo usuário

**Administração** — todas as rotas abaixo exigem `get_admin_atual` (login **e** `Usuario.is_admin == True`; ver ["Aprofundando" abaixo](#aprofundando-por-que-acesso-escondido-não-pode-significar-url-secreta) pra por que essa checagem no servidor é a parte que importa, não a URL "escondida")
- `GET /admin/clientes/` — lista todos os usuários cadastrados
- `GET /admin/vendas/` — histórico de aluguéis de **todos** os usuários (não só o do token, diferente de `GET /alugueis/`), cada um já com o cliente que alugou (`VendaOut`, que estende `AluguelOut` com o campo `usuario`)
- `GET /admin/devolucoes/` — histórico de devoluções já registradas
- `POST /admin/devolucoes/` — registra a devolução de um aluguel (`aluguel_id`); 404 se o aluguel não existir, **409** se esse aluguel já tiver sido devolvido antes (o mesmo padrão de "conflito de estado" já usado em `DELETE /filmes/{id}`)
- `GET /admin/relatorios/faturamento-mensal` — soma o valor dos filmes alugados, agrupado por mês (`date_trunc('month', ...)`)
- `GET /admin/relatorios/filmes-mais-alugados` — conta quantas vezes cada filme foi alugado, do mais pro menos alugado
- `GET /admin/relatorios/faturamento-medio` — devolve **duas** médias diferentes (`ticket_medio` e `media_mensal`) de propósito — ver "Aprofundando" abaixo pra por que "faturamento médio" sozinho é uma pergunta ambígua
- Modelo `Devolucao`: tabela separada de `Aluguel` (não um campo `devolvido` nele), com `aluguel_id` **único** — cada aluguel só pode ser devolvido uma vez, e a data da devolução fica registrada à parte da data do aluguel, formando um histórico verdadeiro de quando cada filme voltou
- Não existe rota de API pra criar um admin — de propósito. O primeiro admin é promovido via `tornar_admin.py` (linha de comando, acesso direto ao banco), pra virar admin exigir mais do que só estar logado como qualquer usuário comum

**Autenticação**
- `POST /auth/registrar` — cria uma conta (nome, email, senha); 409 se o e-mail já estiver em uso; a senha nunca volta na resposta, só o hash fica salvo no banco
- `POST /auth/login` — recebe email/senha (como formulário, não JSON — é o padrão OAuth2 que o Swagger entende nativamente) e devolve um token JWT; 401 se e-mail ou senha estiverem errados
- `GET /auth/me` — rota protegida de teste: devolve os dados do usuário dono do token enviado no header `Authorization: Bearer <token>`; 401 se não vier token ou se ele for inválido/expirado

**Infraestrutura**
- CORS liberado pra permitir o frontend (`localhost:5500`) chamar a API (`localhost:8000`)
- Frontend consumindo `GET /filmes/`, `GET /agencias/` e `POST /alugueis/` de verdade (ver seção de Frontend)
- Banco migrado de SQLite pra **PostgreSQL** local, rodando como serviço do Windows — a string de conexão vive num `.env` não versionado (`DATABASE_URL`), nunca hardcoded no código

### O que ainda falta

- `PUT /filmes/{id}` já existe e já exige admin, mas não tem formulário de edição no painel (só criar/remover) — ver seção de Frontend
- Múltiplos níveis de admin (hoje é binário: `is_admin` é `True` ou `False`, sem meio-termo tipo "só vê relatório, não edita catálogo")
- *(melhoria opcional, não urgente)* Trocar `bcrypt` por `Argon2id` no hash de senha — é a recomendação atual do OWASP; ver "Aprofundando" abaixo pro porquê

### Conceitos de Python/backend estudados

- **Injeção de dependência (`Depends`)**: o FastAPI chama `get_db()` — uma função geradora (`yield`) — antes de cada rota que precisa do banco, entrega a sessão pronta, e garante o fechamento dela mesmo se a rota der erro (bloco `finally`). Evita repetir abertura/fechamento manual de conexão em cada rota.
- **Models vs. Schemas**: `models/filme.py` (SQLAlchemy) representa a tabela no banco; `schemas/filme.py` (Pydantic) representa o formato JSON que entra/sai pela API — são camadas separadas de propósito, pra não expor direto a estrutura interna do banco.
- **Tipo `JSON` do SQLAlchemy**: como SQL não tem tipo nativo de lista, o SQLAlchemy serializa listas Python (`generos`, `streamings`) pra string JSON antes de gravar, e desserializa na leitura — automático, mas significa que não dá pra filtrar por um item da lista direto numa query SQL (exigiria uma tabela separada de relação muitos-para-muitos). No Postgres (diferente do SQLite) isso é ainda melhor: o banco tem um tipo `JSON`/`JSONB` nativo de verdade, então essas colunas não viram texto puro por baixo — o próprio Postgres entende a estrutura, o que abre a porta pra filtrar por conteúdo do JSON via SQL no futuro, se precisar.
- **Variáveis de ambiente e `.env`**: a senha do banco não fica escrita em nenhum arquivo `.py` — `database.py` lê `DATABASE_URL` de uma variável de ambiente (via `python-dotenv`, que carrega o arquivo `.env` pro ambiente do processo). O `.env` fica no `.gitignore`; só o `.env.example` (sem a senha real) é versionado. Isso evita o erro clássico de vazar credenciais sem querer num commit — muito comum em projetos reais.
- **`response_model`**: garante que a resposta da rota sempre siga o formato do schema declarado, e alimenta a documentação automática do Swagger.
- **`Base.metadata.create_all`**: cria as tabelas que ainda não existem no banco ao iniciar o servidor — não é uma ferramenta de migração (não altera colunas de tabelas já existentes). Sentimos isso na prática ao adicionar `usuario_id` em `alugueis`: `create_all` não alterou a tabela sozinho (ela já existia), então rodamos um `ALTER TABLE alugueis ADD COLUMN usuario_id ...` manual no `psql`. Isso só foi seguro porque a tabela estava vazia — numa tabela com dados reais, uma coluna `NOT NULL` sem valor padrão falharia pras linhas já existentes. Ferramentas como **Alembic** (o "companheiro de migrações" oficial do SQLAlchemy) automatizam exatamente esse tipo de mudança de forma versionada e reversível — vale a pena adotar quando o schema começar a mudar com mais frequência.
- **Path parameters (`{filme_id}`)**: valores capturados direto da URL (`/filmes/3` → `filme_id = 3`); o FastAPI já converte pro tipo declarado (`int`) e valida sozinho — se alguém mandar `/filmes/abc`, a API rejeita antes mesmo de chegar no código da rota.
- **`PUT` vs `PATCH`**: `PUT` (usado aqui) espera o recurso *inteiro* substituído — por isso `atualizar_filme` reusa o mesmo schema `FilmeCreate` do `POST` e sobrescreve todos os campos. Um `PATCH` (não implementado ainda) permitiria atualizar só um campo por vez.
- **`HTTPException`**: forma padrão do FastAPI de devolver um erro HTTP controlado (`404 Not Found` quando o `id` não existe) em vez de deixar o código quebrar com um erro genérico de servidor (`500`).
- **`ForeignKey`**: em `models/aluguel.py`, `filme_id = Column(Integer, ForeignKey("filmes.id"))` diz ao banco "esse número tem que corresponder a um `id` que exista na tabela `filmes`" — é o banco garantindo a integridade da relação, não só o Python.
- **`relationship()`**: além da coluna `filme_id` (o número puro), o model `Aluguel` ganha um atributo `filme` que, quando acessado, já carrega o objeto `Filme` inteiro correspondente (o SQLAlchemy monta um `JOIN` por trás dos panos). É o que permite `AluguelOut` devolver o filme completo na resposta, não só o id.
- **Validação cruzada entre tabelas**: `criar_aluguel` busca o `Filme` e a `Agencia` pelos ids recebidos *antes* de criar o aluguel — sem isso, seria possível criar um aluguel apontando pra um filme ou agência que não existe (o banco até aceitaria o número, só quebraria depois, na hora de ler).
- **Hash de senha (`bcrypt`)**: a senha do usuário *nunca* é salva como veio — `hash_senha()` transforma ela num hash irreversível antes de gravar em `usuarios.senha_hash`. No login, `verificar_senha()` não "descriptografa" o hash pra comparar (isso é impossível de propósito) — ele faz o mesmo processo de hash na senha digitada e compara os dois hashes. Mesmo se o banco inteiro vazasse, ninguém recupera a senha original a partir do hash.
- **Token JWT (JSON Web Token)**: depois do login, a API não guarda "sessão" nenhuma em memória — ela devolve um token assinado contendo o `id` do usuário (`{"sub": "1"}`) e uma data de expiração. O frontend guarda esse token e manda ele em toda requisição futura (`Authorization: Bearer <token>`). `get_usuario_atual` decodifica o token, confere a assinatura (com `JWT_SECRET_KEY`) e busca o usuário no banco — se alguém alterar o conteúdo do token, a assinatura não bate mais e a API rejeita.
- **`OAuth2PasswordBearer` e `OAuth2PasswordRequestForm`**: são as ferramentas do FastAPI pra implementar o fluxo padrão de autenticação por senha do OAuth2 — por isso `/auth/login` recebe os dados como formulário (`username`/`password`), não como JSON solto: é esse formato específico que faz o botão "Authorize" do Swagger funcionar automaticamente, sem configuração extra.
- **Separar `security.py` de `dependencies.py`**: `security.py` só tem funções puras (hash, verificação, criar/decodificar token) que não sabem nada sobre banco de dados ou FastAPI — dá pra testar isoladamente. `dependencies.py` é a peça que *usa* essas funções junto com o banco pra formar `get_usuario_atual`, a dependência que qualquer rota futura vai poder declarar pra exigir login.
- **Escopar dados por usuário (404 em vez de 403)**: depois de ligar `alugueis.usuario_id`, `listar_alugueis` filtra a query por `Aluguel.usuario_id == usuario_atual.id` — cada pessoa só vê o próprio histórico, nunca o de outra. Em `cancelar_aluguel`, o filtro combina `id` **e** `usuario_id` na mesma consulta: se o aluguel existe mas é de outra pessoa, a API devolve `404 Not Found` (não `403 Forbidden`) de propósito — `403` confirmaria pro atacante que aquele `id` existe e pertence a alguém, `404` não revela nada.
- **`UniqueConstraint` composta em `__table_args__`**: o model `Favorito` declara `UniqueConstraint("usuario_id", "filme_id")` — diferente de um `unique=True` numa coluna só (que vale pra ela sozinha), isso restringe a **combinação** das duas colunas: qualquer usuário pode favoritar qualquer filme, e qualquer filme pode ser favoritado por várias pessoas, mas o *par* (`usuario_id`, `filme_id`) não pode se repetir. É o banco garantindo, estruturalmente, a mesma regra que `usuarios.email` já garantia sozinho (`unique=True`) — só que aqui a unicidade depende de duas colunas juntas, não de uma.
- **Desenhando `POST /favoritos/` pra ser idempotente de propósito (a exceção que confirma a regra)**: a seção "Aprofundando" logo abaixo explica por que `POST` normalmente *não* é idempotente no projeto (`POST /filmes/` e `POST /alugueis/` criam um registro novo a cada chamada). `adicionar_favorito` quebra esse padrão de propósito: antes de inserir, ele consulta se aquele par `usuario_id`+`filme_id` já existe e, se existir, devolve o registro existente em vez de tentar criar outro (que geraria um erro de `UniqueConstraint` do banco). A razão é o próprio fluxo do frontend: `sincronizarFavoritosAposLogin()` reenvia *todos* os favoritos salvos como visitante pro `POST /favoritos/` depois do login, sem saber quais já existem na conta — chamar a mesma rota duas vezes com o mesmo filme precisa ser seguro, não gerar duplicata nem erro.
- **A cadeia de dependências que o próprio README já previa**: lá em cima, na primeira versão desta seção (antes de existir login), tinha uma nota dizendo que dependências poderiam depender de outras dependências, e que isso "seria a base da autenticação" — na época só um exemplo hipotético. `get_admin_atual` é essa cadeia acontecendo de verdade, um nível mais fundo: `get_admin_atual` depende de `get_usuario_atual` (`usuario_atual: Usuario = Depends(get_usuario_atual)`), que por sua vez depende de `get_db`. Uma rota administrativa declara só `Depends(get_admin_atual)` e ganha, de graça, as duas camadas de baixo — sessão de banco aberta/fechada corretamente **e** usuário autenticado — sem repetir nenhuma delas.
- **`UniqueConstraint` numa FK sozinha = relação um-pra-um**: `models/devolucao.py` declara `aluguel_id = Column(Integer, ForeignKey("alugueis.id"), unique=True)` — diferente da `UniqueConstraint` composta de `Favorito` (duas colunas juntas), aqui é uma coluna só marcada `unique=True`, e isso muda o *tipo* de relação. Sem o `unique=True`, `aluguel_id` seria uma FK comum (um aluguel poderia, em teoria, ter várias linhas de devolução apontando pra ele). Com ele, o banco impede fisicamente mais de uma devolução pro mesmo aluguel — é o jeito padrão de modelar "um-pra-um" em SQL relacional (que não tem um tipo de relação dedicado pra isso, só "um-pra-muitos" via FK simples e "muitos-pra-muitos" via tabela de associação).

#### Aprofundando: como as peças se encaixam

**`Depends` é injeção de dependência de verdade, não só um jeito de abrir conexão.** O nome "dependência" vem do próprio conceito: uma rota *declara* que depende de algo (`db: Session = Depends(get_db)`), e é o FastAPI — não a rota — quem decide como fornecer isso. Por trás dos panos, a cada requisição o FastAPI resolve a árvore de dependências na ordem certa: chama `get_db()`, pega o valor que vem antes do `yield`, injeta como parâmetro `db` na função da rota, espera a rota terminar, e só então retoma `get_db()` de onde parou (o `finally`, fechando a sessão) — inclusive se a rota tiver lançado uma exceção no meio. Isso é exatamente o mecanismo de "setup/teardown" que teríamos que escrever manualmente com `try/finally` em toda rota, sem o `Depends`.

A parte que ainda não usamos, mas que vai ser a base da autenticação: dependências podem depender de outras dependências, formando uma cadeia. Um exemplo comum (que documentei aqui porque é literalmente o próximo passo do projeto): uma rota declara `usuario: Usuario = Depends(get_usuario_atual)`, e `get_usuario_atual` por sua vez usa `Depends(get_db)` pra consultar o usuário logado a partir de um token. A rota nunca lida com token, sessão ou banco diretamente — só recebe o `usuario` já pronto. Isso é o que torna o `Depends` central pro login, não um detalhe isolado do banco.

**`relationship()` traduz uma chave estrangeira do SQL pra um atributo Python navegável.** A coluna `filme_id = Column(Integer, ForeignKey("filmes.id"))` é só isso: um número inteiro, com uma regra de integridade no banco (não pode apontar pra um `id` que não existe). Sozinha, ela não te dá o filme — você teria que fazer uma segunda consulta manual (`db.query(Filme).filter(Filme.id == aluguel.filme_id).first()`) toda vez que precisasse dos dados completos. O `relationship("Filme")` em `models/aluguel.py` resolve isso criando o atributo `aluguel.filme`, que, quando acessado, dispara o `JOIN` necessário automaticamente e devolve o objeto `Filme` inteiro. É esse atributo que faz `AluguelOut` (com seus campos `filme: FilmeOut` e `agencia: AgenciaOut`) funcionar sem nenhum código extra na rota.

Vale registrar uma pegadinha pra quando o catálogo crescer: por padrão, esse carregamento é "preguiçoso" (*lazy loading*) — o SQLAlchemy só busca o filme relacionado no momento em que `aluguel.filme` é acessado, não quando `aluguel` é carregado. Isso é ótimo quando você não precisa do filme, mas em `GET /alugueis/` (que devolve uma lista inteira com filme *e* agência de cada aluguel) isso significa uma consulta adicional ao banco pra cada aluguel da lista — o chamado problema **N+1 queries**. Com os 16 filmes do projeto isso é imperceptível; é um ponto pra revisar (com `joinedload`, por exemplo) se o histórico de aluguéis crescer muito no futuro.

**Pydantic não só valida — ele converte.** Quando `FilmeCreate` recebe o corpo de um `POST`, o Pydantic tenta fazer cada campo caber no tipo declarado antes de rejeitar: uma string `"2020"` num campo `ano: int` é convertida pra `2020` automaticamente, por exemplo. Se a conversão for impossível (um texto qualquer onde se espera um número), o Pydantic não para no primeiro erro — ele valida *todos* os campos e devolve uma única exceção (`ValidationError`) com a lista completa de problemas, que o FastAPI transforma automaticamente numa resposta `422 Unprocessable Entity` explicando exatamente quais campos falharam. Isso poupa a gente de escrever validação manual campo a campo (`if not isinstance(...)`, `if valor < 0`...) tanto na entrada (`FilmeCreate`) quanto na saída (`FilmeOut`/`AluguelOut`), já que o mesmo mecanismo garante que a *resposta* também bate com o schema declarado.

**Migrar de SQLite pra Postgres não exigiu tocar em nenhum model, schema ou rota.** Essa é a demonstração prática de pra que serve o SQLAlchemy como ORM (*Object-Relational Mapper*): todo o código que escrevemos (`db.query(Filme).all()`, `ForeignKey("filmes.id")`, `relationship()`) fala com um banco *abstrato*, não com SQLite ou Postgres especificamente. A única coisa que mudou de fato foi a `DATABASE_URL` (de `sqlite:///./filmes.db` pra `postgresql://...`) e o driver instalado (`psycopg2-binary`, que sabe conversar com Postgres — o SQLite nem precisa de driver externo, já vem embutido no Python). Uma consequência direta: o `PRAGMA foreign_keys=ON` que tínhamos adicionado em `database.py` pra corrigir o bug do filme órfão foi **removido** na migração — o Postgres aplica a integridade referencial por padrão, sem precisar de nenhuma configuração extra. Isso também confirma, na prática, algo que só tínhamos comentado: SQLite tem esse comportamento "relaxado" por padrão especificamente por compatibilidade histórica; a maioria dos bancos "de verdade" não tem essa pegadinha.

**A escolha de verbo HTTP não é estética — cada um tem um contrato.** Dois conceitos guiam isso: métodos **seguros** (não mudam nada no servidor — só `GET` entre os nossos) e métodos **idempotentes** (chamar 1 vez ou 10 vezes seguidas tem o mesmo efeito final). `GET` é seguro e idempotente. `DELETE /filmes/{id}` é idempotente por design — deletar um filme que já foi deletado continua resultando em "esse filme não existe" (ainda que a segunda chamada dê 404 em vez de sucesso, o *estado final* do sistema é o mesmo). `PUT /filmes/{id}` também é idempotente: mandar o mesmo corpo duas vezes deixa o filme exatamente igual da segunda vez pra frente — é por isso que ele exige o recurso *inteiro*, não só o campo que mudou (isso é o que um `PATCH` faria diferente). Já `POST /filmes/` e `POST /alugueis/` **não são idempotentes de propósito**: cada chamada cria um registro novo, então repetir a mesma requisição duas vezes cria dois filmes/aluguéis diferentes. Entender essa diferença é o que evita, por exemplo, um botão "Alugar" mal feito no frontend disparando dois cliques e criando dois aluguéis iguais sem querer — algo a se ter em mente quando formos refinar essa parte da UI. `POST /favoritos/` é a exceção deliberada dessa regra no projeto: nada no protocolo HTTP *exige* que um `POST` seja idempotente (só `PUT`, `DELETE` e os seguros precisam ser), então nada impede que a rota seja desenhada pra se comportar como se fosse — foi exatamente essa liberdade que usamos pra fazer o merge de favoritos pós-login funcionar sem se preocupar em checar duplicata do lado do frontend.

*Fontes consultadas: [documentação oficial do FastAPI sobre dependências](https://fastapi.tiangolo.com/tutorial/dependencies/), [documentação do SQLAlchemy sobre relationships](https://docs.sqlalchemy.org/en/20/orm/basic_relationships.html), [documentação do SQLAlchemy sobre constraints (`UniqueConstraint`)](https://docs.sqlalchemy.org/en/20/core/constraints.html), [documentação do Pydantic sobre validação de models](https://docs.pydantic.dev/latest/concepts/models/), e [restfulapi.net sobre semântica dos métodos HTTP](https://restfulapi.net/http-methods/).*

#### Bug real que encontramos e corrigimos: `ForeignKey` sem integridade aplicada

Reproduzimos isso na prática: criamos um filme, alugamos ele, deletamos o filme — e a API deixou, sem avisar nada. Na sequência, `GET /alugueis/` quebrou com `500 Internal Server Error`, porque o aluguel ficou "órfão" (`filme_id` apontando pra um filme que não existe mais) e o schema `AluguelOut` exige um `FilmeOut` completo, não `None`.

A causa raiz: **o SQLite vem com a checagem de `ForeignKey` desligada por padrão** (motivo histórico, de compatibilidade retroativa). Declarar `ForeignKey("filmes.id")` no model não liga essa checagem sozinho — é preciso mandar `PRAGMA foreign_keys = ON` em cada conexão, o que a `database.py` original nunca fazia.

A correção ficou em duas camadas, de propósito:

1. **No banco** (`database.py`): um listener `@event.listens_for(engine, "connect")` que liga `PRAGMA foreign_keys=ON` em toda conexão nova — a garantia de fundo, que vale pra qualquer código que mexer no banco, não só as rotas que escrevemos.
2. **Na aplicação** (`routes/filmes.py`): `deletar_filme` agora verifica se existe algum `Aluguel` referenciando aquele filme *antes* de tentar deletar, e responde com `409 Conflict` (o código HTTP certo pra "a ação conflita com o estado atual do recurso") em vez de deixar o erro estourar como `500` genérico.

**Por que isso importa especialmente ao importar filmes de uma API externa (ex: IMDB/TMDb):** um script de importação que reimporta o catálogo com frequência é exatamente o cenário onde filmes tendem a ser deletados/recriados sem querer. Duas práticas evitam o problema:

- **Nunca usar o id da fonte externa como chave primária.** `Filme.id` deve continuar sendo o inteiro autoincrementado do nosso próprio banco — é nele que `Aluguel.filme_id` se apoia. O id externo (`imdb_id`, por exemplo) entra como uma coluna extra (`unique=True`), só pra rastrear a origem, nunca como substituto do `id` interno. Assim, mudanças no sistema externo nunca comprometem as relações internas.
- **Importar como *upsert*, não como "apaga tudo e recria".** Um script de importação deveria checar `imdb_id` pra decidir "esse filme já existe? atualiza os campos" em vez de deletar e reinserir — preservando o mesmo `id` interno e, com ele, todo o histórico de aluguéis já associado. A trava de `409 Conflict` que adicionamos é a segunda camada de segurança, caso esse cuidado falhe.

#### Aprofundando: hash de senha, sal e JWT

**Hash não é criptografia — é uma via de mão única.** Criptografar um texto significa transformá-lo de um jeito que dá pra *reverter* com a chave certa (por isso dá pra "descriptografar"). Hashear é diferente: `hash_senha()` transforma `"senha123"` num valor de tamanho fixo (`$2b$12$LhWan...`) que **não tem operação inversa conhecida**. Não existe "deshashear". Por isso o login não funciona comparando a senha descriptografada com a digitada — `verificar_senha()` roda o mesmo processo de hash na senha que a pessoa acabou de digitar, e compara **hash com hash**. Se baterem, a senha original era a mesma (matematicamente, com uma probabilidade de colisão desprezível).

Rodamos isso na prática, hasheando a mesma senha (`"senha123"`) duas vezes:

```
Hash 1: $2b$12$LhWanscDx3ngkVYd73nVqevUnXl/VRZacL3tq48hcCMVmtunbsqw.
Hash 2: $2b$12$xEpbYIUPVazVejWcw76kmOjoOrfRyIKP0a6hccTrGE.LHnUyG0N2W
```

Duas senhas idênticas, dois hashes completamente diferentes — e mesmo assim, os dois validam corretamente a senha original. Isso é o **sal**: `bcrypt.gensalt()` gera um valor aleatório extra a cada chamada, que é misturado com a senha antes de hashear (e fica guardado dentro do próprio hash resultante — não é uma coluna separada no banco).

**Por que o sal importa de verdade:** sem ele, duas contas com a mesma senha (`"123456"`, por exemplo) teriam o mesmo hash salvo. Isso viabiliza um ataque chamado **rainbow table**: alguém pré-calcula os hashes de milhões de senhas comuns *uma única vez* e guarda numa tabela gigante; se um banco vazar, é só procurar cada hash vazado nessa tabela pra achar a senha instantaneamente, sem "quebrar" nada. Com sal, hashes da mesma senha nunca se repetem entre contas, e essa tabela pré-calculada deixa de servir — o ataque teria que ser refeito do zero pra cada hash individualmente. O bcrypt soma mais uma defesa: ele é **deliberadamente lento** (o `$12$` no hash é o "custo", isto é, quantas rodadas internas ele roda) — cada tentativa de adivinhar uma senha por força bruta custa tempo real de CPU, o que torna esse ataque caro demais em escala.

**JWT é assinado, não é secreto.** Decodificamos um token de verdade gerado pelo projeto, sem usar nenhuma senha — só separando as 3 partes (`cabeçalho.dados.assinatura`) e decodificando as duas primeiras, que são só JSON em Base64:

```
CABEÇALHO: {'alg': 'HS256', 'typ': 'JWT'}
DADOS:     {'sub': '1', 'exp': 1789612259}
ASSINATURA: UZn_pBPu5syRZX-J8APwCwYnswGthnsbTJ5FHSJnPMY
```

Qualquer pessoa que interceptar um JWT consegue ler o cabeçalho e os dados — por isso um JWT nunca deve carregar informação sensível (senha, dados privados) no seu conteúdo. O que impede forjar um token é só a terceira parte: a assinatura é calculada a partir do cabeçalho + dados + `JWT_SECRET_KEY` (que só o servidor conhece). Se alguém editar `"sub": "1"` pra `"sub": "2"` tentando se passar por outro usuário, a assinatura antiga não bate mais com o conteúdo alterado, e `decodificar_token()` rejeita.

**Por que isso substitui "sessão" tradicional:** o servidor não guarda em memória nenhuma lista de "quem está logado agora" — toda informação necessária pra validar já está dentro do próprio token, verificável matematicamente com a `SECRET_KEY`. Isso é chamado de autenticação **stateless** (sem estado): qualquer instância do backend consegue validar qualquer token válido, sem precisar consultar uma tabela de sessões ativas.

**Honestidade sobre uma limitação real do que escolhemos:** pesquisando o guia oficial de armazenamento de senhas do OWASP (a referência mais citada em segurança de aplicações web) pra este README, descobri que o **bcrypt não é mais a primeira recomendação** — o OWASP recomenda hoje, em ordem de preferência, **Argon2id**, depois **scrypt**, e só então bcrypt "em sistemas legados onde os outros dois não estão disponíveis". O motivo é técnico: Argon2id é *memory-hard* (exige uma quantidade grande de memória RAM pra cada tentativa de hash, não só tempo de CPU), o que dificulta muito mais ataques feitos com GPUs especializadas, que conseguem paralelizar bcrypt com relativa facilidade. Isso não significa que bcrypt esteja quebrado ou inseguro pra esse projeto — ele continua muito acima de não hashear nada, ou de usar algo como MD5/SHA-256 puro (que são rápidos *de propósito*, o oposto do que se quer pra senha). Mas é o tipo de detalhe que só aparece pesquisando a fonte atualizada, e vale registrar como uma melhoria futura possível (trocar `bcrypt` por uma lib como `argon2-cffi`) se o projeto um dia for além do estudo local.

**Duas decisões que já tomamos certas, confirmadas pela RFC 8725** (o documento oficial de boas práticas de JWT do IETF): a vulnerabilidade mais comum em implementações de JWT é o servidor aceitar o algoritmo que *o próprio token diz que usa* (o campo `alg` no cabeçalho) — um atacante pode mandar um token com `"alg": "none"` ou trocar de assinatura assimétrica pra simétrica, e implementações descuidadas validam isso sem perceber. `decodificar_token()` evita isso porque `jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])` recebe a lista de algoritmos aceitos *explicitamente* — o `HS256` é fixado pelo nosso código, nunca lido de dentro do token em si. A outra recomendação da RFC é usar uma chave secreta longa o bastante pra resistir a força bruta offline — nossa `JWT_SECRET_KEY` tem 64 caracteres hexadecimais (256 bits), gerada com `secrets.token_hex(32)`, bem acima do mínimo recomendado.

*Fontes consultadas nesta seção: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) e [RFC 8725 — JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725).*

#### Aprofundando: por que "acesso escondido" não pode significar "URL secreta"

O pedido original era um painel admin com "acesso escondido de clientes comuns". A forma mais simples — e mais tentadora — seria só não colocar nenhum link pro `admin.html` no menu do cliente, e contar com o fato de ninguém adivinhar essa URL. Pesquisando se isso seria suficiente antes de decidir a arquitetura, a resposta da literatura de segurança é direta e unânime: **isso tem nome — *security through obscurity* — e é tratado como antipadrão**, não como uma camada válida de proteção. O motivo é prático, não filosófico: uma URL "escondida" aparece no código-fonte do `admin.js` (que qualquer pessoa pode abrir no DevTools), no histórico do navegador, em logs de proxy/CDN, ou é simplesmente encontrada por uma ferramenta de varredura que tenta caminhos comuns (`/admin`, `/painel`, etc.). Nada disso exige "hackear" nada — é leitura de informação pública.

Por isso o projeto trata as duas coisas como camadas **completamente separadas**, com responsabilidades diferentes:

- **Não ter o link no menu do cliente** é só uma escolha de produto/UX — evita que um cliente comum clique sem querer numa tela que não é pra ele. Isso não protege nada, é conveniência.
- **`get_admin_atual` rejeitando com `403` quem não tem `is_admin=True`** é a proteção de verdade — ela roda no servidor, em toda chamada, e não depende de ninguém "não saber" a URL. Um cliente comum que descobre `admin.html` e abre no navegador só vê a tela de login; se tentasse chamar `GET /admin/clientes/` direto pelo DevTools com o próprio token, receberia `403` do mesmo jeito.

A regra que a pesquisa confirma, e que já orientava esse projeto antes mesmo do admin existir (é o mesmo motivo de `get_usuario_atual` proteger `/alugueis/` no backend, não só esconder o botão "Alugar" no frontend quando deslogado): **toda decisão de autorização precisa ser verificada no servidor, em toda requisição — o cliente (a URL, o botão escondido, o JavaScript) pode no máximo evitar que um usuário legítimo erre o caminho, nunca é a barreira contra alguém mal-intencionado.**

*Fontes consultadas: [OWASP Juice Shop — Security through Obscurity](https://pwning.owasp-juice.shop/companion-guide/latest/part2/security-through-obscurity.html), [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) e [Troy Hunt — OWASP Top 10 for .NET developers part 8: Failure to Restrict URL Access](https://www.troyhunt.com/owasp-top-10-for-net-developers-part-8/) (a categoria mais antiga do OWASP Top 10 dedicada exatamente a esse erro, hoje unificada em "Broken Access Control").*

#### Bug real: `db.query(func.avg(...))` não sabe de onde partir o `JOIN`

Construindo `GET /admin/relatorios/faturamento-medio`, a primeira versão quebrou com `500` assim que teve dado de verdade pra calcular:

```
sqlalchemy.exc.InvalidRequestError: Don't know how to join to <Mapper at ...; Filme>.
Please use the .select_from() method to establish an explicit left side...
```

O código original era `db.query(func.avg(Filme.valor)).join(Aluguel, Aluguel.filme_id == Filme.id)`. Parece razoável — tem uma coluna (`Filme.valor`) e uma condição de junção explícita — mas o SQLAlchemy 2.0 precisa saber qual é a tabela "de partida" (o `FROM`) antes de decidir como encaixar o `JOIN`, e `func.avg(Filme.valor)` é só uma *expressão* sobre uma coluna, não uma entidade que estabeleça isso sozinha. Quando a query já tem uma entidade completa entre as colunas selecionadas (como em `db.query(Filme.id, Filme.titulo, func.count(...))`, usado no relatório de filmes mais alugados), o SQLAlchemy consegue inferir o `FROM` a partir dela; quando só existe uma função de agregação, não tem o que inferir.

A correção foi adicionar `.select_from(Aluguel)` antes do `.join(Filme, ...)`, deixando explícito qual tabela é o ponto de partida:

```python
db.query(func.avg(Filme.valor)).select_from(Aluguel).join(Filme, Aluguel.filme_id == Filme.id)
```

Vale registrar que esse comportamento — exigir uma referência explícita em vez de adivinhar — é deliberado desde o SQLAlchemy 1.4: versões anteriores tentavam inferir o `JOIN` com mais liberdade, o que ocasionalmente produzia `CROSS JOIN`s silenciosos e errados quando a inferência dava no meio do caminho errado. Preferir um erro explícito (`InvalidRequestError`) a uma consulta ambígua rodando silenciosamente é a mesma filosofia por trás do `422` do Pydantic ou do `409` que já usamos em várias rotas: falhar alto e cedo é melhor que produzir um número errado sem avisar ninguém — e um relatório de faturamento é exatamente o tipo de lugar onde um número errado sem aviso pode passar despercebido por muito tempo.

*Fontes consultadas: [documentação do SQLAlchemy sobre `join()` explícito](https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html#explicit-join) e [dev.to — SQLAlchemy: prevent implicit cross join](https://dev.to/moser/sqlalchemy-prevent-implicit-cross-join-5g5a), que documenta a mudança de comportamento entre versões.*

#### Aprofundando: por que "faturamento médio" sozinho é uma pergunta incompleta

Pedimos "faturamento médio" como uma das 3 consultas do painel — mas ao implementar, ficou claro que existe mais de uma média possível pro mesmo dado, e elas respondem perguntas diferentes:

- **`ticket_medio`**: a média do valor de **cada aluguel individual**, sem olhar em qual mês ele caiu — `AVG(filmes.valor)` direto sobre todas as linhas de `alugueis` (via `JOIN`). Responde "quanto vale, em média, um aluguel".
- **`media_mensal`**: primeiro soma o faturamento **por mês** (uma sub-consulta agrupada por `date_trunc('month', ...)`), e só depois tira a média *dessas somas mensais* — uma "média de médias" (ou, mais preciso aqui, uma "média de somas agrupadas"). Responde "quanto o negócio fatura, em média, por mês".

As duas podem divergir bastante, e o motivo é o mesmo por trás do fenômeno conhecido como **Simpson's paradox**: uma média simples sobre linhas individuais dá peso igual a cada *aluguel*; uma média sobre totais mensais dá peso igual a cada *mês*, não importa quantos aluguéis ele teve. Um mês com 1 aluguel de R$ 9,90 pesa, na `media_mensal`, exatamente igual a um mês com 50 aluguéis somando R$ 500 — algo que a `ticket_medio` nunca faria, porque ali cada aluguel conta um por um. Pesquisando o tema pra entender se isso era só uma curiosidade ou um erro real de se cometer, a literatura de estatística confirma que é um erro comum de verdade: **tirar a média de médias sem ponderar pelo tamanho de cada grupo produz um número que não corresponde a nenhuma pergunta de negócio sensata**, a não ser que "peso igual por mês" seja *exatamente* a pergunta que se quer responder. É por isso que o endpoint devolve os dois números nomeados explicitamente, em vez de escolher um sozinho e chamar de "faturamento médio" sem qualificação — a ambiguidade fica visível pra quem for ler o relatório, não escondida atrás de uma escolha arbitrária de implementação.

*Fontes consultadas: [Simpson's Paradox — Queen Mary University of London](https://www.eecs.qmul.ac.uk/~norman/papers/probability_puzzles/simpson.html) e [Wikipedia — Simpson's paradox](https://en.wikipedia.org/wiki/Simpson%27s_paradox), sobre por que médias agregadas em grupos de tamanhos diferentes não são intercambiáveis com a média sobre os dados originais.*

---

## 🟩 Banco de dados

**Status:** PostgreSQL 18 rodando localmente, 6 tabelas relacionadas por `ForeignKey`

### Como acessar

- **Via terminal**: `psql -U postgres -h localhost -d moviehustler` (senha pedida na hora)
- **Via interface gráfica**: pgAdmin 4 (instalado junto com o Postgres — `Menu Iniciar → PostgreSQL 18 → pgAdmin 4`)

### Modelagem

```
filmes                  alugueis                    agencias
├── id (PK)      ◄───┐  ├── id (PK)              ┌───►  ├── id (PK)
├── titulo           └──┤ filme_id (FK)          │      ├── nome
├── generos (JSON)      │ agencia_id (FK)  ───────┘      └── bairro
├── ano                 │ usuario_id (FK)  ──┐
├── faixa                └ data_aluguel      │
├── diretor                                  │      usuarios
├── sinopse                                  └───►  ├── id (PK)
├── streamings (JSON)                                ├── nome
└── valor                                             ├── email
                                                        ├── senha_hash
                                                        └── is_admin

favoritos
├── id (PK)
├── usuario_id (FK)  ──► usuarios.id
├── filme_id (FK)    ──► filmes.id
└── UNIQUE(usuario_id, filme_id)

devolucoes
├── id (PK)
├── aluguel_id (FK)  ──► alugueis.id
├── data_devolucao
└── UNIQUE(aluguel_id)
```

`alugueis` é a tabela "do meio" de uma relação com **três** pontas — cada linha liga um `filme_id`, um `agencia_id` e um `usuario_id`, com a data em que o aluguel foi feito. Isso é o que permite cada usuário ver só o próprio histórico (`GET /alugueis/` filtra por `usuario_id` automaticamente, a partir do token). `favoritos` é mais simples — só **duas** pontas (`usuario_id` + `filme_id`) — mas carrega uma restrição que `alugueis` não tem: uma `UNIQUE(usuario_id, filme_id)` que impede a mesma pessoa favoritar o mesmo filme duas vezes a nível de banco, não só de código (ver "Conceitos de Python/backend", abaixo). `devolucoes` liga a um **único** aluguel (`UNIQUE(aluguel_id)`, não uma combinação de colunas) — é uma tabela separada de `alugueis` de propósito, pra guardar a data da devolução como um evento próprio, formando histórico, em vez de sobrescrever um campo na própria linha do aluguel. Deletar um filme, agência ou usuário que tenha aluguéis (ou favoritos) associados é bloqueado pelo banco (ver seção de Backend, "Aprofundando").

### Por que Postgres em vez de SQLite

O projeto começou no SQLite (um arquivo local, zero configuração) porque era a forma mais rápida de começar a estudar backend sem instalar nada. A troca pro Postgres veio de uma necessidade real, não teórica: encontramos um bug onde o SQLite deixava deletar um filme que ainda tinha aluguéis apontando pra ele (checagem de `ForeignKey` desligada por padrão — ver detalhes na seção de Backend). Postgres aplica essa integridade nativamente, sem configuração extra, além de ser o banco que qualquer ambiente de produção de verdade usaria — SQLite é ótimo pra protótipo local, mas não foi pensado pra múltiplos usuários escrevendo ao mesmo tempo.

### Conceitos de banco de dados estudados

- **Chave primária (PK) vs. chave estrangeira (FK)**: a PK (`id`) identifica uma linha de forma única dentro da própria tabela; a FK é uma coluna que *aponta* pra uma PK de outra tabela, criando a relação entre elas.
- **Integridade referencial**: a garantia, aplicada pelo próprio banco, de que uma FK nunca aponta pra um registro que não existe. É diferente de validação — é uma regra estrutural do banco, não do código da aplicação.
- **`psql`**: o cliente de linha de comando do Postgres — todo `CREATE DATABASE`, consulta manual ou depuração que fizemos passou por ele.
- **Variáveis de ambiente pra credenciais**: a senha do banco nunca fica no código-fonte — vive só no `.env` local (ver seção de Backend).

---

## Visão geral do produto (o que o MOVIEHUSTLER é)

Uma "locadora virtual" fictícia: catálogo de filmes por categoria, com login/conta, aluguel real ligado ao usuário (escolha de agência física pra retirada, registrado no backend), carrinho e, do outro lado, um painel pro dono do negócio acompanhar clientes, vendas, devoluções e faturamento — a ideia de fundo é misturar a nostalgia de locadora física com uma experiência de streaming moderna, incluindo a parte "de trás do balcão" que uma locadora de verdade também tinha.

**O que falta pra fechar o produto:**

- Reunir favoritos e histórico de aluguel numa tela de "minha conta" de verdade (hoje os dois já existem — favoritos e aluguéis são ligados à conta e persistem no backend — mas só aparecem como painéis avulsos no menu do perfil, não numa página própria)
- A escolha manual de tema claro/escuro é pensada pra ficar nas configurações da conta
- Imagens reais de filme, vindas de uma API externa (ex: IMDB/TMDb) — ver a seção de Backend, "Aprofundando", pros cuidados de integridade que isso exige
- O painel admin cobre o pedido original (clientes, vendas, produtos, devoluções, os 3 relatórios e um login escondido), mas ainda é só tabelas — nenhum gráfico de verdade, edição de filme existente, ou paginação (ver "O que ainda falta" nas seções de Frontend/Backend)
