# Kurio — NFT Marketplace

Base do desafio front-end do marketplace Kurio. Nesta etapa, o repositório contém contratos TypeScript/Zod, cliente Axios, API REST simulada com MSW v2, cenários de falha e eventos Socket.IO. As rotas de produto continuam como shells; a UI completa será construída em fases seguintes.

## Começar

```bash
npm install
npm run dev
```

`VITE_ENABLE_MOCKS=true` inicia o Service Worker MSW em desenvolvimento e nos bundles de demonstração. O worker `public/mockServiceWorker.js` é versionado. O build padrão e `build:demo` carregam `.env.production`, que habilita os mocks para `vite preview`.

```bash
npm run build:demo
npm run preview:demo
```

Para apontar a um backend real, defina `VITE_ENABLE_MOCKS=false` no ambiente de build e configure `VITE_API_URL` e `VITE_SOCKET_URL` para os serviços correspondentes.

| Variável             | Uso                         | Padrão de demonstração |
| -------------------- | --------------------------- | ---------------------- |
| `VITE_API_URL`       | Base URL do Axios           | `/api`                 |
| `VITE_ENABLE_MOCKS`  | Inicia MSW no browser       | `true`                 |
| `VITE_SOCKET_URL`    | Origem do cliente Socket.IO | origem da aplicação    |
| `VITE_MOCK_SCENARIO` | Cenário opcional de boot    | `default`              |

## Contas de demonstração

| E-mail               | Senha      |
| -------------------- | ---------- |
| `user@kurio.io`      | `demo1234` |
| `collector@kurio.io` | `demo1234` |

As credenciais são fixtures locais exclusivas do mock. O handler remove a senha antes de retornar entidades `User` ao cliente.

## Contratos e valores monetários

Os contratos Zod e os tipos inferidos ficam em `src/api/types/`: `Session`, `User`, `CollectorProfile`, `NFT`, `Favorite`, `CartItem`, `Cart`, `Coupon`, `Quote`, `Order`, `Wallet` e `ApiError`. Os preços, descontos, taxas, subtotais e totais ETH trafegam como strings decimais (`"1.19"`, `"26.846"`); não são convertidos para `number`/float. O cálculo mockado de totais usa `BigInt` em unidades decimais.

`NFT.image` é somente um path como `/nfts/emerald-ape-042.webp`. Os arquivos ainda não estão no repositório; o componente `NFTImage` preserva a proporção e renderiza o fallback até você adicionar os arquivos em `public/nfts/`.

Todos os erros REST seguem o formato:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "fieldErrors": { "email": ["Invalid email"] }
}
```

`fieldErrors` é opcional; o status HTTP continua indicando a classe de erro. Os handlers usam respostas padronizadas nos status `400`, `401`, `403`, `404`, `409`, `422` e `500`.

## Endpoints REST

Base URL: `/api`. Salvo indicação em contrário, os endpoints autenticados aceitam `Authorization: Bearer <accessToken>` recebido de `/auth/login` ou `/auth/register`.

| Método e path                     | Payload / parâmetros                                                           | Sucesso                                                                        | Erros principais                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`                | `{ "email", "password" }`                                                      | `200 AuthResponse` — `{ session, user, profile }`; o cliente persiste a sessão | `401 INVALID_CREDENTIALS`, `422 VALIDATION_ERROR`                                                                                                                   |
| `POST /auth/register`             | `{ "email", "password", "displayName" }`                                       | `201 AuthResponse`                                                             | `409 EMAIL_ALREADY_REGISTERED`, `422 VALIDATION_ERROR`                                                                                                              |
| `GET /auth/session`               | —                                                                              | `200 AuthResponse`                                                             | `401 UNAUTHORIZED`                                                                                                                                                  |
| `POST /auth/logout`               | —                                                                              | `200 { "success": true }`; revoga a sessão do mock e remove o token do cliente | —                                                                                                                                                                   |
| `GET /nfts`                       | Query opcional: `query`, `collection`, `network`, `isRare`, `page`, `pageSize` | `200 NFT[]`                                                                    | `400 BAD_REQUEST` para paginação/filtro inválido; `500 INTERNAL_ERROR` no cenário flaky                                                                             |
| `GET /nfts/:nftId`                | —                                                                              | `200 NFT`                                                                      | `404 NOT_FOUND`                                                                                                                                                     |
| `GET /favorites`                  | —                                                                              | `200 Favorite[]` do usuário                                                    | `401 UNAUTHORIZED`                                                                                                                                                  |
| `POST /favorites/:nftId`          | —                                                                              | `201 Favorite` novo ou `200 Favorite` já existente                             | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `DELETE /favorites/:nftId`        | —                                                                              | `200 { "success": true }`                                                      | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `GET /cart`                       | —                                                                              | `200 Cart`                                                                     | `401 UNAUTHORIZED`                                                                                                                                                  |
| `POST /cart/items`                | `{ "nftId", "quantity" }`; acrescenta à quantidade atual                       | `201 Cart` atualizado                                                          | `401`, `404 NOT_FOUND`, `409 EDITION_SOLD_OUT`, `422 VALIDATION_ERROR`                                                                                              |
| `PATCH /cart/items/:nftId`        | `{ "quantity" }`; define a quantidade da linha                                 | `200 Cart` atualizado                                                          | `401`, `404 NOT_FOUND`, `409 EDITION_SOLD_OUT`, `422 VALIDATION_ERROR`                                                                                              |
| `DELETE /cart/items/:nftId`       | —                                                                              | `200 Cart` atualizado                                                          | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `DELETE /cart`                    | —                                                                              | `200 Cart` vazio                                                               | `401`                                                                                                                                                               |
| `POST /cart/coupon`               | `{ "code" }`                                                                   | `200 Cart` com cupom                                                           | `401`, `422 COUPON_INVALID` ou `COUPON_EXPIRED`                                                                                                                     |
| `DELETE /cart/coupon`             | —                                                                              | `200 Cart` sem cupom                                                           | `401`                                                                                                                                                               |
| `POST /quote`                     | `{ "walletId"?: string \| null }`                                              | `201 Quote` com itens e valores ETH em string                                  | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 PRICE_CHANGED`/`EDITION_SOLD_OUT`, `422 CART_EMPTY`/`COUPON_EXPIRED`                                                  |
| `POST /orders`                    | Header **obrigatório** `Idempotency-Key`; body `{ "quoteId", "walletId" }`     | `201 Order` nova; `200` com o mesmo pedido em retry da mesma chave e body      | `400 IDEMPOTENCY_KEY_REQUIRED`, `401`, `403`, `404`, `409 IDEMPOTENCY_CONFLICT`/`EDITION_SOLD_OUT`/`PRICE_CHANGED`, `422 QUOTE_EXPIRED`, `500 TIMEOUT_AFTER_CREATE` |
| `GET /orders`                     | —                                                                              | `200 Order[]` do usuário                                                       | `401`                                                                                                                                                               |
| `GET /orders/:orderId`            | —                                                                              | `200 Order`                                                                    | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`                                                                                                                             |
| `POST /orders/:orderId/confirm`   | —                                                                              | `200 Order`, com status `confirmed` ou `declined`                              | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`                                                                                                                             |
| `GET /profile`                    | —                                                                              | `200 CollectorProfile`                                                         | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `PATCH /profile`                  | Campos opcionais `displayName`, `ens`, `avatar`, `bio`                         | `200 CollectorProfile` atualizado                                              | `401`, `404`, `422 VALIDATION_ERROR`                                                                                                                                |
| `GET /wallets`                    | —                                                                              | `200 Wallet[]` do usuário                                                      | `401`                                                                                                                                                               |
| `POST /wallets`                   | `{ "name", "address", "network" }`                                             | `201 Wallet`                                                                   | `401`, `409 WALLET_ALREADY_CONNECTED`, `422 VALIDATION_ERROR`                                                                                                       |
| `PATCH /wallets/:walletId`        | Campos opcionais `name`, `address`, `network`                                  | `200 Wallet` atualizado                                                        | `401`, `403 FORBIDDEN`, `404`, `422 VALIDATION_ERROR`                                                                                                               |
| `DELETE /wallets/:walletId`       | —                                                                              | `200 { "success": true }`                                                      | `401`, `403`, `404`, `409 LAST_WALLET`                                                                                                                              |
| `POST /wallets/:walletId/primary` | —                                                                              | `200 Wallet` principal                                                         | `401`, `403`, `404`                                                                                                                                                 |

### Idempotência de pedidos

`POST /orders` rejeita uma requisição sem `Idempotency-Key` com `400`. O mock guarda chave, impressão do body e ID do pedido em `msw:state:v1`. Mesma chave + mesmo body retorna o pedido já criado, sem criar outro. Mesma chave + body diferente retorna `409 IDEMPOTENCY_CONFLICT`. No cenário `timeout-after-order-create`, o primeiro pedido é persistido antes da resposta simulada `500`; repetir a mesma requisição com a mesma chave recupera esse pedido.

## Cenários de MSW

Ative um cenário no console do browser com `window.__mswScenario('nome')`. Os nomes são validados por TypeScript. `window.__mswReset()` reinicializa fixtures, sessão, carrinhos, cenários e dados persistidos em `localStorage` (`msw:state:v1`).

| Cenário                      | Comportamento                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`                    | Respostas mockadas usuais; 24 NFTs e dados demo.                                                                                                                            |
| `empty`                      | Catálogo, favoritos, pedidos e carteiras retornam listas vazias; carrinho retorna sem itens/cupom.                                                                          |
| `slow-3s`                    | Espera três segundos antes de responder às requisições REST.                                                                                                                |
| `flaky-500`                  | A cada duas requisições REST, alterna resposta `500 INTERNAL_ERROR` e resposta normal.                                                                                      |
| `session-expired`            | Chamadas autenticadas retornam `401 UNAUTHORIZED`.                                                                                                                          |
| `coupon-expired`             | Aplicar cupom retorna `422 COUPON_EXPIRED`.                                                                                                                                 |
| `price-changed-mid-checkout` | `POST /quote` aumenta o preço do primeiro NFT do carrinho em `0.10` ETH, publica `nft.updated` e responde `409 PRICE_CHANGED`; o preço alterado fica no store.              |
| `edition-sold-out`           | `POST /quote` esgota o primeiro NFT do carrinho, publica `nft.updated` e responde `409 EDITION_SOLD_OUT`.                                                                   |
| `payment-declined`           | `POST /orders/:orderId/confirm` conclui o pedido com status `declined` e `transactionId: null`.                                                                             |
| `timeout-after-order-create` | Cria e persiste o pedido, mas a primeira resposta de `POST /orders` é `500 TIMEOUT_AFTER_CREATE`; retry idempotente retorna o mesmo pedido.                                 |
| `out-of-order`               | Na inscrição de NFT pelo socket, envia primeiro uma atualização com versão maior e depois a atualização anterior com versão menor, para testar reconciliação por `version`. |

## Socket.IO simulado

O cliente usa `socket.io-client` em `/socket.io/`; o worker MSW integra-se pelo pacote `@mswjs/socket.io-binding`. Eventos emitidos pelo mock:

| Evento            | Direção        | Payload                                              |
| ----------------- | -------------- | ---------------------------------------------------- |
| `nft.subscribe`   | cliente → mock | `nftId: string`; solicita inscrição em um NFT        |
| `order.subscribe` | cliente → mock | `orderId: string`; solicita inscrição em um pedido   |
| `nft.updated`     | mock → cliente | `{ "id": string, "version": number, "data": NFT }`   |
| `order.updated`   | mock → cliente | `{ "id": string, "version": number, "data": Order }` |

A versão é um inteiro incremental atribuído pelo store. `data` contém o snapshot tipado mais recente; clientes devem ignorar eventos cuja versão não seja mais nova que a já aplicada.

## Estrutura

```text
src/
  api/{client.ts,realtime.ts,endpoints/,types/}
  mocks/{handlers/,fixtures/,store.ts,scenarios.ts,socket-bus.ts}
  routes/                         TanStack Router code-based, type-safe
  components/ui/                  Primitives acessíveis inspirados em shadcn/ui
  components/domain/              NFTImage e componentes de domínio
  hooks/                          Hooks TanStack Query
  lib/                            Validação, decimal ETH e utilitários
public/nfts/                      Destino dos assets que serão adicionados pelo usuário
```

## Comandos

```bash
npm run dev            # Vite + MSW
npm run type-check     # TypeScript strict
npm run lint           # ESLint, sem any explícito e console.log
npm run format:check   # Prettier
npm run build          # type-check + build com mocks de demo
npm run build:demo     # build explícito de demonstração
npm run preview:demo   # servir dist depois de build:demo
npm run test:e2e       # Playwright
```
