# DashVendas

[![CI](https://github.com/SEU_USUARIO/dashboard-vendas/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU_USUARIO/dashboard-vendas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Dashboard de vendas, estoque e leads feito com **HTML, CSS e JavaScript puros** — sem frameworks, sem build step. Persistência via `localStorage`, gráficos com Chart.js, autenticação client-side com roles e UI inspirada em painéis premium.

> Projeto pessoal de portfólio focado em UI polida, código limpo, acessibilidade, testes e boas práticas de arquitetura.

## 🔗 Demo

**Live:** _https://SEU_USUARIO.github.io/dashboard-vendas/login.html_

**Credenciais de demonstração:**
- `admin` / `admin123` — acesso completo
- `mod` / `mod123` — somente leitura

![DashVendas screenshot](docs/screenshot.png)

## ✨ Features

- 🔐 **Autenticação com roles** — admin (CRUD completo) e moderador (somente leitura), com restrições aplicadas no DOM e nas funções de mutação
- 📊 **Cards de resumo** — Lucro, Receita, nº de Vendas, Ticket Médio
- 📈 **Gráfico de performance** — Receita & lucro acumulados (escala linear/log)
- 🛒 **CRUD de vendas** — registrar, editar, excluir, vincular cliente, devolução automática ao estoque
- 📦 **Estoque pesquisável** — filtro em tempo real, margem calculada
- 👥 **CRM mínimo** — cadastro de clientes/leads classificados como Forte / Médio / Fraco / Cliente, vinculáveis às vendas
- 🏷 **Marca personalizável** — nome da empresa editável e persistido
- 💾 **Persistência local** — `localStorage` com migração de schema
- 📤 **Export CSV** — UTF-8 BOM, separador `;`, compatível com Excel BR
- 🧭 **Hash router** — URLs persistentes por view (`#dashboard`, `#vendas`, `#clientes`…)
- ⌨️ **Atalhos** — `Esc` fecha modais, `Enter` confirma
- ♿ **Acessibilidade** — labels associados, `aria-*`, foco visível, `role="dialog"`, `prefers-reduced-motion`
- 📱 **Responsivo** — layout adaptado para mobile

## 🛠 Stack

- **HTML5** semântico
- **CSS3** com custom properties, grid, flex
- **JavaScript ES Modules** nativos (sem bundler)
- [**Chart.js**](https://www.chartjs.org/) — gráficos
- [**Phosphor Icons**](https://phosphoricons.com/) — ícones
- [**Vitest**](https://vitest.dev/) — testes unitários
- **GitHub Actions** — CI + deploy automático no GitHub Pages

## 🚀 Como rodar

Como o projeto usa ES Modules, ele precisa ser servido via HTTP (não pode abrir o `index.html` direto pelo `file://`).

```bash
# opção 1 — Python
python -m http.server 8000

# opção 2 — Node
npx serve

# acesse
http://localhost:8000/login.html
```

## 🧪 Testes

```bash
npm install
npm test
```

Cobertura: funções puras de `src/utils.js` (formatação, parsing, cálculos de resumo, geração de CSV, escape de HTML).

## 📁 Estrutura

```
.
├── index.html
├── login.html
├── style.css
├── src/
│   ├── main.js       # bootstrap, listeners, router
│   ├── auth.js       # autenticação + roles
│   ├── state.js      # estado + persistência (com migração)
│   ├── utils.js      # funções puras (testáveis)
│   ├── ui.js         # render de tabelas, cards, modais
│   └── chart.js      # Chart.js wrapper
├── tests/
│   └── utils.test.js
├── .github/workflows/ci.yml
├── package.json
├── LICENSE
└── README.md
```

## 🏛 Decisões de arquitetura

**Por que vanilla JS, sem framework?**
Projeto deliberadamente sem React/Vue para exercitar fundamentos: ES Modules nativos, manipulação direta do DOM, event delegation, estado próprio. Demonstra que entendo o que um framework abstrai.

**Por que sem build step?**
Reduz fricção (clone → serve → roda) e mostra o quanto a plataforma web já entrega nativamente. Trade-off: sem tree-shaking, sem TypeScript transpilado, sem CSS pré-processado — aceito conscientemente.

**Por que ES Modules em vez de um arquivo único?**
Separação de responsabilidades testável: `utils.js` é puro (testado), `state.js` lida com persistência, `ui.js` com DOM, `main.js` orquestra. Fica fácil substituir qualquer camada.

**Por que `localStorage`?**
Adequado para o escopo de portfólio (single-user, single-device). Em produção real, seria substituído por backend + DB sem refatoração das camadas de UI/state graças à separação acima.

**Por que auth client-side?**
**É demo.** Senhas em texto no JS são inseguras por definição. Em produção real, autenticação tem que ser feita no servidor (JWT, OAuth, sessões). Aqui serve para demonstrar o padrão de roles, guards e restrições no DOM.

## 🗺 Roadmap

- [ ] Tema claro/escuro
- [ ] Filtro por período no gráfico
- [ ] Importar CSV
- [ ] Ordenação por coluna nas tabelas
- [ ] Paginação / virtual scrolling para datasets grandes
- [ ] Migração para backend real (Node + PostgreSQL ou Supabase)

## 📄 Licença

MIT — veja [LICENSE](LICENSE).
