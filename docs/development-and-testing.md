# Desenvolvimento local e validação

Este guia descreve como preparar o ambiente, explorar os mocks e executar as verificações automatizadas do Kurio. O projeto é um frontend React/TypeScript servido por Vite; seus endpoints de demonstração e eventos realtime são implementados no browser pelo MSW, não por um serviço backend neste repositório. Para contratos de API e uma visão da aplicação, consulte [contratos REST](./api.md), [visão geral](./application-overview.md), [autenticação e carteiras](./backend-auth-and-wallets.md) e [comércio e pagamentos](./backend-commerce-and-payments.md).

## Ambiente e rotina local

O [package.json](../package.json) declara Node `24.x` em `engines` e fixa o gerenciador em npm `10.9.9`. Use essas versões para reduzir diferenças em relação à CI. Na primeira instalação, prefira `npm ci`, que instala a árvore descrita pelo lockfile sem atualizá-lo; `npm install` também é um comando válido para uma instalação local, mas pode atualizar o lockfile ao mudar dependências. Não remova nem edite o lockfile sem intenção.

```bash
npm ci
npx playwright install chromium   # uma vez, para executar E2E localmente
npm run dev
```

O servidor Vite inicia em modo de desenvolvimento. Para validações antes de abrir ou atualizar uma PR, os comandos existentes são:

```bash
npm run format:check
npm run type-check
npm run lint
npm run test:e2e
npm run build
```

`npm run test:e2e:ui` abre a interface do Playwright para depurar cenários. O comando E2E usa o servidor configurado em [playwright.config.ts](../playwright.config.ts): `http://127.0.0.1:5173`, iniciado automaticamente por `npm run dev -- --host 127.0.0.1`. Executa apenas Chromium Desktop; localmente pode reutilizar um servidor já ativo e não aplica retries. Em CI, não reutiliza servidor, proíbe `test.only` e tenta novamente falhas até duas vezes. A configuração preserva trace em caso de falha.

O build padrão é `npm run build` (`tsc -b && vite build`). Há também `npm run build:demo` e `npm run preview:demo`; para servir localmente o resultado, execute o build pretendido e depois `npm run preview` (ou `npm run preview:demo` para a variação explicitamente demo). A configuração Vite não define proxy de API nem servidor de backend: o app é empacotado como arquivos estáticos.

## Hoje (MSW/demo)

O arquivo [.env.example](../.env.example) documenta variáveis Vite para URL-base da API, ativação do MSW, URL do socket e cenário inicial. Os arquivos de ambiente de produção presentes no repositório também ativam o modo demo; não são credenciais. Variáveis `VITE_*` são incorporadas no bundle do navegador e não devem conter segredos. Se precisar de uma configuração local própria, crie um arquivo local apropriado ao Vite, por exemplo `.env.local`, e não o versione.

Em [src/main.tsx](../src/main.tsx), o Service Worker só é iniciado se `VITE_ENABLE_MOCKS` for exatamente `true`; então `src/mocks/browser.ts` instala os handlers agregados em [src/mocks/handlers/index.ts](../src/mocks/handlers/index.ts). A lista cobre autenticação, NFTs, favoritos, carrinho, cotações, pedidos, perfil, carteiras e socket. Requests não atendidas pelo worker passam adiante (`onUnhandledRequest: 'bypass'`). O valor `false` desliga a interceptação; não faz surgir um backend real. Sem API compatível e serviço realtime, as chamadas de rede deixam de receber os dados simulados. Como as variáveis são de build, confirme o ambiente usado ao gerar o bundle: `vite build` usa modo `production` por padrão e lê a configuração de produção.

O estado inicial vem de fixtures, persiste em `localStorage` sob a chave `msw:state:v1` e é validado por schema Zod. A aplicação expõe três ferramentas de desenvolvimento na janela do browser: `window.__mswScenario('nome')` troca o cenário; `window.__mswPatch(draft => { ... })` altera o estado compartilhado; `window.__mswReset()` restaura fixtures iniciais, limpa a sessão simulada e dispara evento de reset. Use-as no console DevTools ou em `page.evaluate` nos testes. Por exemplo, para testar uma edição sem estoque, localize o NFT no draft e defina `nft.edition.available = 0`; para restaurar o cenário de teste e o estado inteiro, chame `__mswReset()` e, se necessário, `__mswScenario('default')`. Reset não equivale a um reset isolado de uma entidade: ele descarta alterações anteriores do store.

Os cenários aceitos em [src/mocks/scenarios.ts](../src/mocks/scenarios.ts) incluem `default`, `empty`, `slow-3s`, `flaky-500`, `session-expired`, `coupon-expired`, `price-changed-mid-checkout`, `edition-sold-out`, `payment-declined`, `timeout-after-order-create` e `out-of-order`. Os cenários globais de atraso e erro intermitente afetam requests REST; os demais exercitam casos específicos conforme seus handlers. Alguns de falha única retornam automaticamente a `default` depois de disparar; atraso, intermitência, catálogo vazio e atualização fora de ordem permanecem ativos até serem trocados ou o store ser reiniciado. Consulte o código dos handlers e os testes ao depender de comportamento específico.

O mock de Socket.IO usa `socket.io-client` **4.8.4** e `@mswjs/socket.io-binding` **0.2.x** conforme as faixas do package, com o worker MSW v2 (**2.15.x** declarada). O cliente envia `nft.subscribe` com um ID de NFT ou `order.subscribe` com ID de pedido; o mock responde com `nft.updated` ou `order.updated`. Atualizações carregam `{ id, version, data }`, com contador de versão crescente em [src/mocks/store.ts](../src/mocks/store.ts) e tipos em [src/mocks/socket-bus.ts](../src/mocks/socket-bus.ts). O cenário `out-of-order` devolve duas atualizações do NFT em ordem invertida para verificar que o cliente reconcilie por versão, ignorando snapshots antigos. Isso simula protocolo e eventos, não valida um servidor Socket.IO externo.

## Cobertura E2E

Os testes em [e2e](../e2e/bootstrap.spec.ts) são Playwright contra o app com MSW no browser. Em conjunto, os quatro specs atuais cobrem 27 casos: inicialização e dados do catálogo, contratos/erros de API, autenticação, idempotência de pedidos, cenários de falha, socket com versões, filtros e histórico de navegação, detalhe/avaliações, perfil/carteiras, carrinho de visitante, merge após login e checkout. Exemplos concretos: `discovery.spec.ts` verifica filtro móvel refletido na URL após reload e voltar; `account.spec.ts` verifica sessão, logout e validação de endereços; `cart-checkout.spec.ts` testa cupom, quantidade/estoque, retry após timeout e recusa de pagamento; `bootstrap.spec.ts` verifica retry idempotente e atualização realtime fora de ordem. Os testes não substituem integração com API, pagamentos, carteira blockchain ou socket reais.

## Backend real (pendente)

Para testar uma integração real, configure `VITE_ENABLE_MOCKS=false` e URLs compatíveis para API e socket no ambiente de build. É necessário que esses serviços implementem os contratos usados pelo frontend, incluindo cookies/sessões, cabeçalhos de carrinho e idempotência, erros esperados e eventos realtime versionados. O repositório descreve contratos, mas esta configuração por si só não cria nem confirma serviços. Faça validação de rede, autenticação e CORS com o backend provisionado antes de considerar o fluxo integrado.

## CI, build e publicação

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) roda em PRs direcionadas a `main`, pushes para `main` e disparo manual (`workflow_dispatch`). Seu único job, em Ubuntu 24.04, faz checkout; configura Node 24 com cache npm; instala npm 10.9.9; executa `npm ci`; instala Chromium e dependências do Playwright; verifica formatação, tipos e lint; roda E2E com `CI=true`; e finalmente constrói o bundle de produção. Em falha, tenta anexar `test-results/` por sete dias. **Isso é CI (checks e build), não deployment**: o YAML não publica artefatos em Vercel nem contém etapa de deploy.

O [vercel.json](../vercel.json) configura Vite, `npm run build`, saída `dist`, fallback de rotas SPA sem reescrever `/api/*`, cabeçalhos de segurança e cache. Se a integração Git da Vercel estiver configurada para este repositório, ela pode executar deploys Preview/Production conforme a branch e as configurações daquele projeto. A existência do arquivo e o sucesso da CI não confirmam que essa integração esteja conectada nem que algum deploy tenha sido publicado. Verifique o dashboard da Vercel e seus logs; configure ali variáveis de build apropriadas ao destino, distinguindo explicitamente demo de backend real.
