# Kurio — NFT Marketplace

Frontend do marketplace Kurio com React/TypeScript, contratos Zod, cliente Axios, TanStack Query/Router, MSW v2 e eventos Socket.IO simulados. A aplicação cobre descoberta (Home e detalhe), autenticação e configurações da conta, carrinho de visitante/autenticado e checkout com cotação, pedido idempotente e confirmação.

## Documentação

O [índice de `docs/`](./docs/README.md) reúne a [visão geral](./docs/application-overview.md), a [referência da API](./docs/api.md), os handoffs de [identidade/carteiras](./docs/backend-auth-and-wallets.md) e [carrinho/checkout/pagamentos](./docs/backend-commerce-and-payments.md), o guia de [desenvolvimento/testes](./docs/development-and-testing.md) e a [extração visual do Figma](./docs/design-system.md). Os handoffs descrevem o contrato frontend e o trabalho recomendado; o backend e o processamento de pagamento reais ainda não estão implementados neste repositório.

## Começar

```bash
npm install
npm run dev
```

`VITE_ENABLE_MOCKS=true` inicia o Service Worker MSW em desenvolvimento e nos bundles de demonstração. O worker `public/mockServiceWorker.js` é versionado; o build padrão e `build:demo` habilitam os mocks para `vite preview`.

```bash
npm run build:demo
npm run preview:demo
```

Para apontar a um backend real, defina `VITE_ENABLE_MOCKS=false` no ambiente de build e configure `VITE_API_URL` e `VITE_SOCKET_URL`.

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

Os contratos Zod e tipos inferidos ficam em `src/api/types/`: `Session`, `User`, `CollectorProfile`, `NFT`, `NftReview`, `Favorite`, `CartItem`, `Cart`, `Coupon`, `Quote`, `Order`, `Wallet` e `ApiError`. `NFT` inclui `images[]`, `rating`, `reviewCount`, `createdAt` e `trendingScore` para detalhe, galeria e ordenação. `rating` e `reviewCount` são derivados das avaliações de `src/mocks/fixtures/reviews.ts`, então a nota do catálogo e a média da aba "Avaliações de colecionadores" nunca divergem.

Preços, descontos, taxas, subtotais e totais ETH trafegam como strings decimais (`"1.19"`, `"26.846"`); a interface não os converte para `number`/float. Os cálculos usam helpers decimais baseados em unidades inteiras; `PriceDisplay` mostra ao menos duas casas e preserva casas significativas adicionais (por exemplo, `0.004 ETH`). `NFT.image` e cada item de `NFT.images[]` são paths como `/nfts/emerald-ape-042.webp`. Os arquivos ainda não estão no repositório; `NFTImage` preserva a proporção e usa fallback até você adicioná-los em `public/nfts/`.

Todo erro REST tem formato `{ code, message, fieldErrors? }`. `fieldErrors` é opcional; o status HTTP identifica a classe do erro. Os handlers simulam `400`, `401`, `403`, `404`, `409`, `422` e `500`.

## Rotas

- `/` — descoberta com busca, filtros, ordenação, paginação e estado refletido nos search params Zod.
- `/nft/:id` — detalhe, galeria `NFTImage`, favoritos e adição ao carrinho.
- `/cart` — linhas editáveis, cupom, resumo ETH, empty/error/loading states e carrinho de visitante.
- `/checkout` — protegido por sessão; seleciona carteira, cria/atualiza cotação, cria pedido idempotente e exibe confirmação/recusa.
- `/profile` e `/wallets` — páginas protegidas para perfil e carteiras.

### Cadastro de carteiras

Para salvar uma carteira, preencha os campos marcados com `*`: **nome**, **apelido**, **rede**, **endereço público**, **tipo** e **e-mail**. O e-mail da conta já vem preenchido. **ENS** e **código de indicação** são opcionais; a carteira secundária também é opcional. Para adicionar uma secundária, marque “Adicionar carteira secundária” e preencha seus próprios campos obrigatórios; “Igual à carteira principal” copia os valores da principal.

O endereço precisa corresponder à rede selecionada: Ethereum e Polygon usam `0x` seguido de 40 caracteres hexadecimais; Solana usa endereço público Base58 de 32–44 caracteres. O tipo descreve onde a carteira é mantida: software/extensão, dispositivo hardware ou serviço de custódia. Nunca informe frase-semente ou chave privada no formulário.

A autenticação não tem página própria: `/login` e `/register` são apenas atalhos que abrem o card de autenticação sobre a rota em que o visitante estava e devolvem a navegação para ela. O card (`AuthDialog`) é único para login, cadastro e recuperação de senha, com abas "Entrar"/"Criar conta", divisória social (Google/Facebook) e fechamento por botão, `Esc` ou clique no backdrop. Ele é um overlay do `RootLayout`, portanto funciona em qualquer rota; o estado vive em `src/lib/auth-dialog.ts` (store externo) e não em search params, então a página de baixo continua montada. Os pontos de entrada — botão do header, "finalizar compra" sem sessão e o `401` de sessão expirada — abrem o mesmo card preservando `redirect`.

A camada de UI recebe os dados via endpoints; não há fixtures de NFT/preço/atributo em JSX. Textos são mantidos em constantes nomeadas. `TanStack Query` mantém o estado remoto e refaz queries afetadas após mutations e eventos realtime.

## Sessão e carrinho de visitante

A autenticação usa cookie de sessão simulado pelo MSW. A resposta de login/registro configura o cookie e o cliente persiste somente metadados do usuário, nunca senha ou token de acesso em `localStorage`. `rememberMe` define a duração do cookie de demonstração; o endpoint de sessão restaura a conta após refresh. O interceptor Axios emite evento global em `401`; o hook raiz decide sobre toast, limpeza do cache e abertura do card de login preservando a rota de retorno. A limpeza usa `resetQueryCache()` (`resetQueries`) em vez de `queryClient.clear()`: `clear()` remove as queries da cache mas deixa os componentes montados ligados às instâncias antigas, que ficam presas em `pending` — era o que travava `/profile` em "carregando" logo após o login pelo card.

O cliente cria um identificador UUID para carrinho convidado e o envia em `X-Guest-Cart-Id`; o identificador é persistido no browser, enquanto as linhas/cupom ficam no store MSW. O endpoint `POST /cart/merge` combina quantidades com o carrinho autenticado, usa preço atual quando o NFT ainda existe e conserva cupom válido quando a conta ainda não tiver um. Linhas acima do estoque ou de NFTs removidos também são mescladas e exibidas para revisão/remoção; o checkout permanece bloqueado até correção. Login e registro tentam fazer esse merge após a autenticação e oferecem retry explícito se houver falha de rede/API.

## Descoberta — Home e detalhe

`/` valida search params com Zod: `q`, `collections[]`, `networks[]`, `priceMin`, `priceMax`, `sort` e `page`. Filtros combináveis, abas, ordenação e paginação atualizam a URL; refresh e histórico do browser restauram o estado. `useQuery` usa `['nfts', params]`, passa `AbortSignal` ao Axios e mantém os resultados anteriores durante refetch. Coleções e redes são derivadas da resposta da API.

`/nft/:id` carrega o NFT pelo endpoint de detalhe. A galeria lê `images[]`; avaliações, atributos e edição vêm da API. Favoritar usa mutation otimista com rollback em erro; adicionar ao carrinho aceita visitante e usuário autenticado. Edições esgotadas não podem ser compradas. As abas "Detalhes do NFT" e "Avaliações de colecionadores (N)" ficam em `src/components/ui/tabs.tsx` sobre `@radix-ui/react-tabs`; a contagem `N` vem de `reviewCount` e a nota ao lado das estrelas abre a mesma aba. A lista usa `useNftReviews`, que só busca quando a aba é aberta.

`GET /nfts` aceita `query`, `collection` ou múltiplos `collections`, `network` ou múltiplos `networks`, `priceMin`/`priceMax` como strings decimais, `sort` (`relevance`, `newest`, `trending`, `price-asc`, `price-desc`), `isRare`, `page` e `pageSize`. A Home traduz `q` para `query`; comparação e ordenação ETH não convertem valores para float.

## Endpoints REST

Base URL: `/api`. Os endpoints protegidos usam o cookie de sessão simulado (não `Authorization: Bearer`). Carrinho de visitante usa `X-Guest-Cart-Id` e também pode solicitar `/quote` (estimativa sem carteira); `/orders`, perfil, carteiras e favoritos exigem sessão. Os payloads são JSON quando indicado.

| Método e path                     | Payload / parâmetros                                                                                                 | Sucesso                                                                                                   | Erros principais                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`                | `{ "email", "password", "rememberMe?" }`                                                                             | `200 { session, user, profile, mockSessionToken }`; configura cookie simulado                             | `401 INVALID_CREDENTIALS`, `422 VALIDATION_ERROR`                                                                                                                   |
| `POST /auth/register`             | `{ "email", "password", "displayName" }`                                                                             | `201 { session, user, profile, mockSessionToken }`; cria cookie/sessão                                    | `409 EMAIL_ALREADY_REGISTERED`, `422 VALIDATION_ERROR`                                                                                                              |
| `GET /auth/session`               | —                                                                                                                    | `200 { session, user, profile }`                                                                          | `401 UNAUTHORIZED`                                                                                                                                                  |
| `POST /auth/logout`               | —                                                                                                                    | `200 { "success": true }`; revoga a sessão e expira o cookie                                              | —                                                                                                                                                                   |
| `PATCH /auth/password`            | `{ "currentPassword", "newPassword" }`                                                                               | `200 { "success": true }`                                                                                 | `401`, `404 NOT_FOUND`, `422 CURRENT_PASSWORD_INVALID`/`VALIDATION_ERROR`                                                                                           |
| `POST /auth/social`               | `{ "provider": "google"\|"facebook" }`                                                                               | `200 { session, user, profile, mockSessionToken }`; autentica a conta demo via provedor simulado          | `422 VALIDATION_ERROR`, `503 SOCIAL_UNAVAILABLE`                                                                                                                    |
| `POST /auth/forgot-password`      | `{ "email" }`                                                                                                        | `200 { "message": "RESET_LINK_SENT" }`, sempre, para não revelar e-mails cadastrados                      | `422 VALIDATION_ERROR`                                                                                                                                              |
| `GET /nfts`                       | Query opcional: `query`, `collection(s)`, `network(s)`, `priceMin`, `priceMax`, `sort`, `isRare`, `page`, `pageSize` | `200 NFT[]`                                                                                               | `400 BAD_REQUEST`; `500 INTERNAL_ERROR` no cenário flaky                                                                                                            |
| `GET /nfts/:nftId`                | —                                                                                                                    | `200 NFT`                                                                                                 | `404 NOT_FOUND`                                                                                                                                                     |
| `GET /nfts/:nftId/reviews`        | —                                                                                                                    | `200 NftReview[]` (mais recentes primeiro; vazio no cenário `empty`)                                      | `404 NOT_FOUND`                                                                                                                                                     |
| `GET /favorites`                  | —                                                                                                                    | `200 Favorite[]` do usuário                                                                               | `401 UNAUTHORIZED`                                                                                                                                                  |
| `POST /favorites/:nftId`          | —                                                                                                                    | `201 Favorite` novo ou `200 Favorite` existente                                                           | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `DELETE /favorites/:nftId`        | —                                                                                                                    | `200 { "success": true }`                                                                                 | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `GET /cart`                       | —; visitante precisa de `X-Guest-Cart-Id`                                                                            | `200 Cart` do usuário ou visitante                                                                        | `401 UNAUTHORIZED` para visitante sem identificador ou cookie inválido/expirado                                                                                     |
| `POST /cart/items`                | `{ "nftId", "quantity" }`; acrescenta à quantidade atual                                                             | `201 Cart` atualizado                                                                                     | `401`, `404 NOT_FOUND`, `409 EDITION_SOLD_OUT`, `422 VALIDATION_ERROR`                                                                                              |
| `PATCH /cart/items/:nftId`        | `{ "quantity" }`; define a quantidade da linha                                                                       | `200 Cart` atualizado                                                                                     | `401`, `404 NOT_FOUND`, `409 EDITION_SOLD_OUT`, `422 VALIDATION_ERROR`                                                                                              |
| `DELETE /cart/items/:nftId`       | —                                                                                                                    | `200 Cart` atualizado                                                                                     | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `DELETE /cart`                    | —                                                                                                                    | `200 Cart` vazio                                                                                          | `401`                                                                                                                                                               |
| `POST /cart/coupon`               | `{ "code" }`                                                                                                         | `200 Cart` com cupom                                                                                      | `401`, `422 COUPON_INVALID` ou `COUPON_EXPIRED`                                                                                                                     |
| `DELETE /cart/coupon`             | —                                                                                                                    | `200 Cart` sem cupom                                                                                      | `401`                                                                                                                                                               |
| `POST /cart/merge`                | Vazio; requer sessão e `X-Guest-Cart-Id`                                                                             | `200 Cart` mesclado; inclui linhas indisponíveis para revisão e esvazia guest cart após persistir a cópia | `400 BAD_REQUEST`, `401`                                                                                                                                            |
| `POST /quote`                     | `{ "walletId"?: string \| null }`                                                                                    | `201 Quote` com itens, cupom e totais ETH em string (aceita carrinho de visitante)                        | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 PRICE_CHANGED`/`EDITION_SOLD_OUT`, `422 CART_EMPTY`/`COUPON_EXPIRED`                                                  |
| `POST /orders`                    | Header **obrigatório** `Idempotency-Key`; body `{ "quoteId", "walletId" }`                                           | `201 Order` novo; `200` com mesmo pedido no retry da mesma chave e body                                   | `400 IDEMPOTENCY_KEY_REQUIRED`, `401`, `403`, `404`, `409 IDEMPOTENCY_CONFLICT`/`EDITION_SOLD_OUT`/`PRICE_CHANGED`, `422 QUOTE_EXPIRED`, `500 TIMEOUT_AFTER_CREATE` |
| `GET /orders`                     | —                                                                                                                    | `200 Order[]` do usuário                                                                                  | `401`                                                                                                                                                               |
| `GET /orders/:orderId`            | —                                                                                                                    | `200 Order`                                                                                               | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`                                                                                                                             |
| `POST /orders/:orderId/confirm`   | —                                                                                                                    | `200 Order` com status `confirmed` ou `declined`                                                          | `401`, `403 FORBIDDEN`, `404 NOT_FOUND`                                                                                                                             |
| `GET /profile`                    | —                                                                                                                    | `200 CollectorProfile`                                                                                    | `401`, `404 NOT_FOUND`                                                                                                                                              |
| `PATCH /profile`                  | Campos opcionais `displayName`, `ens`, `avatar`, `bio`                                                               | `200 CollectorProfile` atualizado                                                                         | `401`, `404`, `422 VALIDATION_ERROR`                                                                                                                                |
| `GET /wallets`                    | —                                                                                                                    | `200 Wallet[]` do usuário                                                                                 | `401`                                                                                                                                                               |
| `POST /wallets`                   | `{ "name", "nickname", "address", "network", "type", "ens", "referralCode", "email" }`                               | `201 Wallet`                                                                                              | `401`, `409 WALLET_ALREADY_CONNECTED`, `422 VALIDATION_ERROR` (inclusive endereço incompatível com a rede)                                                          |
| `PATCH /wallets/:walletId`        | Campos opcionais `name`, `nickname`, `address`, `network`, `type`, `ens`, `referralCode`, `email`                    | `200 Wallet` atualizado                                                                                   | `401`, `403 FORBIDDEN`, `404`, `409 WALLET_ALREADY_CONNECTED`, `422 VALIDATION_ERROR`                                                                               |
| `DELETE /wallets/:walletId`       | —                                                                                                                    | `200 { "success": true }`                                                                                 | `401`, `403`, `404`, `409 LAST_WALLET`                                                                                                                              |
| `POST /wallets/:walletId/primary` | —                                                                                                                    | `200 Wallet` marcada como principal                                                                       | `401`, `403`, `404`                                                                                                                                                 |

### Idempotência de pedidos

`POST /orders` rejeita uma requisição sem `Idempotency-Key` com `400`. O mock guarda chave, impressão do body e ID do pedido em `msw:state:v1`. Mesma chave + mesmo body devolve o pedido existente, sem criar outro; mesma chave + body diferente retorna `409 IDEMPOTENCY_CONFLICT`. O frontend persiste `quoteId`, `walletId` e UUID da tentativa na sessão do browser. Em `timeout-after-order-create`, o pedido é salvo antes da resposta simulada `500`; o botão de retry reutiliza a mesma chave e o mesmo body. `POST /orders/:orderId/confirm` muda o estado para `confirmed` ou `declined`; sucesso limpa o carrinho e exibe snapshot/transação.

## Cenários de MSW

Ative no console do browser com `window.__mswScenario('nome')`; nomes são validados por TypeScript. `window.__mswPatch((draft) => { ... })` altera o store simulado dentro da página (usado pelos testes e2e para mudar disponibilidade sem correr risco de sobrescrita). `window.__mswReset()` reinicializa fixtures, sessão, carrinhos, cenários e o store persistido em `localStorage` (`msw:state:v1`). Cenários de falha de uma única operação (`session-expired`, `coupon-expired`, `price-changed-mid-checkout`, `edition-sold-out`, `payment-declined` e `timeout-after-order-create`) retornam ao padrão após o primeiro disparo, permitindo a recuperação da interface sem reset manual. `slow-3s`, `flaky-500`, `empty` e `out-of-order` permanecem ativos até ativar outro cenário/reset.

| Cenário                      | Comportamento                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`                    | Respostas mockadas usuais; 24 NFTs e dados demo.                                                                                                                 |
| `empty`                      | Catálogo, favoritos, pedidos e carteiras retornam listas vazias; carrinho responde sem itens/cupom.                                                              |
| `slow-3s`                    | Espera três segundos antes de responder às requisições REST.                                                                                                     |
| `flaky-500`                  | A cada duas requisições REST, alterna entre `500 INTERNAL_ERROR` e resposta normal.                                                                              |
| `session-expired`            | O primeiro endpoint autenticado retorna `401 UNAUTHORIZED`; o login seguinte pode recuperar a sessão.                                                            |
| `coupon-expired`             | Uma tentativa de aplicar cupom retorna `422 COUPON_EXPIRED`.                                                                                                     |
| `price-changed-mid-checkout` | `POST /quote` eleva em `0.10` ETH o primeiro NFT, atualiza o carrinho e publica `nft.updated`, depois responde `409 PRICE_CHANGED`; novo quote usa o preço novo. |
| `edition-sold-out`           | `POST /quote` esgota o primeiro NFT, publica `nft.updated` e responde `409 EDITION_SOLD_OUT`; a disponibilidade alterada fica persistida.                        |
| `payment-declined`           | Uma confirmação retorna pedido `declined` com `transactionId: null`; uma nova tentativa pode seguir normalmente.                                                 |
| `timeout-after-order-create` | Cria pedido, mas responde `500 TIMEOUT_AFTER_CREATE`; retry idempotente retorna o mesmo pedido.                                                                  |
| `out-of-order`               | Na inscrição do NFT, envia atualização com versão maior e depois uma atualização anterior, para testar reconciliação por `version`.                              |

## Socket.IO simulado

O cliente usa `socket.io-client` em `/socket.io/`; o worker MSW integra-se com `@mswjs/socket.io-binding`. Eventos:

| Evento            | Direção        | Payload                                              |
| ----------------- | -------------- | ---------------------------------------------------- |
| `nft.subscribe`   | cliente → mock | `nftId: string`; solicita inscrição em um NFT        |
| `order.subscribe` | cliente → mock | `orderId: string`; solicita inscrição em um pedido   |
| `nft.updated`     | mock → cliente | `{ "id": string, "version": number, "data": NFT }`   |
| `order.updated`   | mock → cliente | `{ "id": string, "version": number, "data": Order }` |

A versão é incremental; `data` contém o snapshot tipado mais recente. Clientes devem ignorar versão igual/mais antiga. O checkout aplica mudanças recentes no cache e invalida carrinho/cotação; ao reconectar, revalida as queries ativas.

## Estrutura

```text
src/
  api/{client.ts,realtime.ts,endpoints/,types/}
  mocks/{handlers/,fixtures/,store.ts,scenarios.ts,socket-bus.ts}
  routes/                         TanStack Router code-based: Home/Detail/Cart/Checkout/Account
  components/ui/                  Primitives acessíveis inspirados em shadcn/ui
  components/domain/              NFTImage, linhas de carrinho, resumo e confirmação
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

## Deploy (Vercel)

O projeto é um SPA estático: a Vercel detecta o preset Vite, roda `npm run build` (type-check + Vite em modo `production`) e publica `dist`. Não existe backend — todas as chamadas `/api/*` e o Socket.IO são interceptados no navegador pelo MSW.

### CI/CD

O workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) roda em pull requests para `main`, em pushes para `main` e manualmente. Ele usa Ubuntu 24.04, Node 24 e npm 10.9.9 (versões declaradas pelo projeto), instala com `npm ci`, valida formatação, TypeScript e lint, executa os testes E2E do Playwright no Chromium e confirma o build de produção usado na Vercel. Em caso de falha, guarda `test-results/` como artefato para diagnóstico.

O deploy fica a cargo da integração Git da Vercel, evitando duplicar credenciais de deploy no GitHub Actions: com o repositório conectado no projeto Vercel, PRs geram Preview Deployments e pushes para a branch Production (normalmente `main`) geram Production Deployments. Se a integração Git da Vercel ainda não estiver conectada, conecte o repositório nas configurações do projeto Vercel; o workflow de CI não requer secrets.

```bash
npx vercel          # preview deployment
npx vercel --prod   # produção
```

Ou importe o repositório em [vercel.com/new](https://vercel.com/new); nenhuma variável de ambiente precisa ser configurada para a demonstração, porque `.env.production` (versionado) já traz `VITE_ENABLE_MOCKS=true`.

O [`vercel.json`](./vercel.json) cuida do que o preset Vite não cobre:

- **Fallback de SPA** para `/nft/:id`, `/cart`, `/checkout`, `/profile` e `/wallets` funcionarem em acesso direto e refresh. Arquivos estáticos têm precedência sobre rewrites, e `/api/*` fica de fora para não devolver HTML no lugar de JSON quando um endpoint não está mockado.
- **`mockServiceWorker.js`** com `Cache-Control: no-cache` e `Service-Worker-Allowed: /`, garantindo escopo na raiz e atualização do worker entre deploys.
- **Headers de segurança** básicos (`nosniff`, `Referrer-Policy`) e cache imutável para os assets com hash.

O Service Worker exige HTTPS (a Vercel fornece) e registra o escopo na primeira visita; para apontar a um backend real, sobrescreva `VITE_ENABLE_MOCKS=false`, `VITE_API_URL` e `VITE_SOCKET_URL` nas configurações do projeto.
