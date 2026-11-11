# Kurio — NFT Marketplace

Base do desafio prático front-end de marketplace de NFTs. Esta fase configura o ambiente, os contratos tipados, a camada de mocks e os componentes de design system. As telas de produto seguem como placeholders nesta etapa.

## Requisitos

- Node.js compatível com Vite 8.
- npm 10.9.9 (versão registrada em `package.json`).

## Começar

```bash
npm install
npm run dev
```

O modo de desenvolvimento carrega `.env.development`, habilita MSW v2 e aponta a API para `/api`. O Service Worker está versionado em `public/mockServiceWorker.js`. Para desligar os mocks, defina `VITE_ENABLE_MSW=false` no ambiente de execução e conecte `VITE_API_URL` a uma API compatível.

Variáveis principais:

| Variável             | Uso                                                | Padrão de desenvolvimento |
| -------------------- | -------------------------------------------------- | ------------------------- |
| `VITE_API_URL`       | Base URL REST do cliente Axios                     | `/api`                    |
| `VITE_ENABLE_MSW`    | Inicia MSW no browser                              | `true`                    |
| `VITE_SOCKET_URL`    | URL do cliente Socket.IO; vazia usa a origem atual | origem atual              |
| `VITE_MOCK_SCENARIO` | Cenário de latência/erro dos handlers              | `normal`                  |

Cenários aceitos: `normal`, `latency` e `server-error`.

## Comandos

```bash
npm run dev            # Vite com MSW
npm run type-check     # TypeScript strict (inclui Playwright)
npm run lint           # ESLint, sem any explícito e sem console.log
npm run format:check   # Prettier
npm run format         # Formatar arquivos
npm run build          # Typecheck + build de produção
npm run test:e2e       # Playwright
```

## Estrutura

```text
src/
  api/{client,endpoints,types}/   Cliente Axios, endpoints e schemas Zod
  mocks/{handlers,fixtures,store,scenarios}/  API falsa REST e WebSocket
  routes/                         TanStack Router code-based, type-safe
  components/ui/                  Primitives acessíveis inspirados em shadcn/ui
  components/domain/              NFTImage e componentes de domínio
  hooks/                          Hooks TanStack Query
  lib/                            Validação, formatação e utilitários
public/nfts/                      Destino dos assets que o usuário adicionará
```

## Dados e imagens

Os componentes não carregam dados de catálogo hardcoded em JSX: recebem props tipadas derivadas da API. Durante o desenvolvimento, os handlers MSW usam as nove fixtures de NFT em `src/mocks/fixtures/`. O contrato `NFT` exige `image: string` (por exemplo, `/nfts/emerald-ape-042.webp`) e preço decimal em string; o preço ETH nunca é convertido para `number`/`float`.

Os arquivos reais **não estão incluídos**. Adicione-os em `public/nfts/` com os nomes apontados nas fixtures. `NFTImage` tenta carregar o path e, se estiver vazio ou falhar, mantém o aspect ratio e mostra um placeholder em gradiente com o nome recebido pela prop.

## Rotas preparadas

`/`, `/nft/$nftId`, `/cart`, `/checkout`, `/login`, `/register`, `/profile` e `/wallets`. Nesta fase cada rota renderiza somente um shell vazio; as páginas completas e estados de produto pertencem à próxima fase de implementação.

## Stack e referência do binding

Vite, React, TypeScript strict, Tailwind CSS v3, shadcn/ui customizado, TanStack Router, TanStack Query v5, Axios, Socket.IO client, MSW v2, Zod, ESLint, Prettier e Playwright. O binding Socket.IO/MSW converte os eventos do protocolo Socket.IO nos handlers de WebSocket do MSW: [documentação do pacote](https://www.npmjs.com/package/@mswjs/socket.io-binding).
