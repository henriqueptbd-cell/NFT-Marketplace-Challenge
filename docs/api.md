# Referência da API

> **Escopo:** contrato usado pela aplicação hoje, conferido no cliente, nos schemas e nos handlers MSW. As respostas e códigos HTTP descritos como observados são os do mock; não há implementação de servidor real confirmada neste repositório. Não trate cenários de demonstração como garantia de produção.

## Cliente, configuração e sessão

O cliente Axios e seus interceptors estão em [`src/api/client.ts`](../src/api/client.ts); os métodos exportados ficam em [`src/api/endpoints`](../src/api/endpoints/index.ts), e os schemas de transporte em [`src/api/types`](../src/api/types/index.ts). `baseURL` é `VITE_API_URL`, com fallback `/api`; os caminhos nas tabelas são relativos a essa base (por exemplo, `/auth/login`). Todas as chamadas enviam `Content-Type: application/json` e usam `withCredentials: true`. O app inicia MSW apenas quando `VITE_ENABLE_MOCKS === 'true'` ([`src/main.tsx`](../src/main.tsx)); handlers interceptam `/api/*` e requisições não interceptadas passam adiante.

O interceptor acrescenta `X-Guest-Cart-Id` a **todas** as chamadas se conseguir obter/criar um UUID persistido em `localStorage` (`kurio:guest-cart-id:v1`). Ele identifica carrinho anônimo; não autentica operações de conta. No MSW, endpoints de carrinho aceitam usuário autenticado ou guest ID UUID válido, mas se houver cookie presente e inválido/expirado retornam 401 em vez de cair para guest. `/cart/merge` exige usuário autenticado e esse header válido.

A sessão do mock usa cookie `kurio_session`; login/registro/login social retornam `mockSessionToken`, e o cliente grava esse valor como cookie somente no modo mocks. O handler também emite `Set-Cookie` com `HttpOnly; SameSite=Lax; Path=/` (30 dias com `rememberMe`, de outro modo sessão sem `Max-Age`). A credencial é verificada pelo mock contra hash SHA-256 e expiração em seu estado local. O usuário também é armazenado em `localStorage` (`kurio:user:v1`) para a interface, não como credencial bearer. Logout limpa dados locais e cookie mesmo se a chamada falhar. O interceptor de resposta emite `kurio:api-unauthorized` em 401, exceto para login, registro e logout; o hook raiz trata o evento limpando o usuário/cookie, resetando as queries ativas e desconectando o socket, mostra um toast e abre o diálogo de login sobre a rota atual com essa rota como redirect. A limpeza não remove `kurio:guest-cart-id:v1`; após login bem-sucedido, o merge do carrinho visitante ocorre antes da retomada da rota.

## Convenções de payload e erros

Os objetos Zod são em geral `strict`: campos extras são rejeitados; os schemas de request da aplicação validam antes de enviar. Respostas com dados são novamente parseadas, portanto campos/formatos inesperados falham no cliente. Valores monetários (`priceString`, subtotal, descontos, taxa, total) são **strings decimais**, não números JSON; schema permite até 18 casas e não aceita expoente. Datas são strings ISO datetime. Redes: `Ethereum`, `Polygon`, `Solana`.

Formato comum de erro é `{ code, message, fieldErrors? }`, onde `fieldErrors` mapeia campo para lista de mensagens ([`api-error.ts`](../src/api/types/api-error.ts), [`common.ts`](../src/mocks/handlers/common.ts)). O helper MSW responde `400 BAD_REQUEST` para JSON inválido, `422 VALIDATION_ERROR` para schema inválido e `401 UNAUTHORIZED` quando autenticação exigida falta/expira. Códigos adicionais e status por recurso aparecem abaixo. Para requests canceláveis, `getNfts`/`getNft`/`getNftReviews` aceitam `AbortSignal` e o encaminham ao Axios; os outros métodos não expõem sinal. Cancelamento não é erro de domínio definido pelo handler.

## Auth

| Método e caminho             | Acesso; request                            | Sucesso (MSW)                                                                                                            | Erros observados                                                                        |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `POST /auth/login`           | Público; `{email,password,rememberMe?}`    | 200; `{session,user,profile,mockSessionToken}` no transporte; cliente omite token do retorno público e persiste usuário. | 400/422 genéricos; 401 `INVALID_CREDENTIALS` (fieldErrors.email); 500 `INTERNAL_ERROR`. |
| `POST /auth/register`        | Público; `{email,password,displayName}`    | 201; mesma resposta de auth.                                                                                             | 400/422; 409 `EMAIL_ALREADY_REGISTERED`; 500.                                           |
| `GET /auth/session`          | Cookie de sessão                           | 200; `{session,user,profile}`.                                                                                           | 401 `UNAUTHORIZED` (inclusive sessão já indisponível).                                  |
| `POST /auth/logout`          | Público/idempotente no mock                | 200 `{success:true}` e expira cookie.                                                                                    | Nenhum erro de domínio implementado.                                                    |
| `PATCH /auth/password`       | Sessão; `{currentPassword,newPassword}`    | 200 `{success:true}`.                                                                                                    | 400/422; 401; 404 `NOT_FOUND`; 422 `CURRENT_PASSWORD_INVALID` (fieldErrors).            |
| `POST /auth/social`          | Público; `{provider:'google'\|'facebook'}` | 200; resposta de auth.                                                                                                   | 400/422; 503 `SOCIAL_UNAVAILABLE`; 500.                                                 |
| `POST /auth/forgot-password` | Público; `{email}`                         | 200 `{message:'RESET_LINK_SENT'}`.                                                                                       | 400/422.                                                                                |

`Session` tem `userId`, `issuedAt`, `expiresAt`; `User` tem `id,email,role,displayName,username,createdAt`; `CollectorProfile` está detalhado em Perfil. No mock, login social sempre seleciona a conta demo codificada no handler, não realiza OAuth; recuperação só devolve confirmação simulada.

## NFTs e reviews

| Método e caminho           | Acesso; query                                                                                                 | Sucesso                                                                                                       | Erros observados                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /nfts`                | Público; `query`, `collection(s)`, `network(s)`, `priceMin`, `priceMax`, `sort`, `isRare`, `page`, `pageSize` | 200 `NFT[]` (padrão page 1, size 100; máximo 100) e `X-Total-Count` (total após filtros, antes da paginação). | 400 `BAD_REQUEST` em paginação, boolean, rede, preços, intervalo mínimo/máximo ou ordenação inválidos. |
| `GET /nfts/:nftId`         | Público                                                                                                       | 200 `NFT`                                                                                                     | 404 `NOT_FOUND`.                                                                                       |
| `GET /nfts/:nftId/reviews` | Público                                                                                                       | 200 `NftReview[]`                                                                                             | 404 `NOT_FOUND`.                                                                                       |

`NFT`: `id,name,image,images,priceString,edition,collection,network,attributes,isRare,description,rating,reviewCount,createdAt,trendingScore`. `edition` tem `total,available,isOpen`; atributo tem `traitType,value`. Sort: `relevance,newest,trending,price-asc,price-desc`. Filtros, ordenação e corte da página são executados pelo mock; `X-Total-Count` informa o total filtrado. Um backend cross-origin deve expor esse cabeçalho com `Access-Control-Expose-Headers`. Não há criação/edição de review no cliente.

## Favorites

| Método e caminho           | Acesso; request | Sucesso                                                              | Erros observados                            |
| -------------------------- | --------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| `GET /favorites`           | Sessão          | 200 `Favorite[]`                                                     | 401.                                        |
| `POST /favorites/:nftId`   | Sessão          | 201 `Favorite`; repetição já existente retorna 200 com o mesmo item. | 401; 404 `NOT_FOUND` para NFT ausente.      |
| `DELETE /favorites/:nftId` | Sessão          | 200 `{success:true}`                                                 | 401; 404 `NOT_FOUND` para favorito ausente. |

`Favorite`: `id,userId,nftId,createdAt`.

## Cart, coupons e merge

Exceto merge, acesso significa sessão ou `X-Guest-Cart-Id` válido. Respostas de mutação devolvem o carrinho completo, schema [`Cart`](../src/api/types/cart.ts): `id,userId,items[{nftId,quantity,priceString}],couponCode,updatedAt,version`.

| Método e caminho            | Request                               | Sucesso                      | Erros específicos observados                            |
| --------------------------- | ------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `GET /cart`                 | —                                     | 200 `Cart`                   | 401; cupom inválido/expirado é removido no mock ao ler. |
| `POST /cart/items`          | `{nftId,quantity}`                    | 201 `Cart`                   | 400/422; 401; 404 NFT; 409 `EDITION_SOLD_OUT`.          |
| `PATCH /cart/items/:nftId`  | `{quantity}`                          | 200 `Cart`                   | 400/422; 401; 404 item/NFT; 409 `EDITION_SOLD_OUT`.     |
| `DELETE /cart/items/:nftId` | —                                     | 200 `Cart`                   | 401; 404 `NOT_FOUND`.                                   |
| `DELETE /cart`              | —                                     | 200 `Cart` vazio, cupom nulo | 401.                                                    |
| `POST /cart/coupon`         | `{code}`                              | 200 `Cart`                   | 400/422; 401; 422 `COUPON_INVALID` ou `COUPON_EXPIRED`. |
| `DELETE /cart/coupon`       | —                                     | 200 `Cart`                   | 401.                                                    |
| `POST /cart/merge`          | `{}`; sessão + `X-Guest-Cart-Id` UUID | 200 `Cart` do usuário        | 400 `BAD_REQUEST` sem ID válido; 401.                   |

Quantidade precisa ser inteiro positivo. O mock soma quantidade ao adicionar item existente, valida estoque de edições fechadas, e no merge combina itens e transfere cupom guest válido se o carrinho da conta não tiver cupom. São detalhes de demonstração, não garantias de atomicidade/conflito de concorrência do servidor futuro.

## Quote

| Método e caminho | Acesso; request                                   | Sucesso                                                                                                                                                                                                  | Erros observados                                                                                                            |
| ---------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `POST /quote`    | Sessão ou guest cart; `{walletId?: string\|null}` | 201 `Quote`: `id,userId,cartId,walletId,items[],subtotalString,discountString,networkFeeString,totalString,couponCode,expiresAt,version`. Item: `nftId,name,image,quantity,priceString,edition,network`. | 400/422; 401; 404 wallet/NFT; 403 wallet alheia; 422 `CART_EMPTY`/`COUPON_EXPIRED`; 409 `PRICE_CHANGED`/`EDITION_SOLD_OUT`. |

A cotação do mock vence em cinco minutos; subtotal/desconto/taxa/total são strings decimais. Taxa/regras vêm de fixtures; preço pode mudar durante o fluxo. Não envie quantias calculadas pelo cliente como autoridade: o request só seleciona wallet (opcional).

## Orders

| Método e caminho                | Acesso; request/header                                       | Sucesso                                                                     | Erros observados                                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /orders`                  | Sessão; `{quoteId,walletId}` e `Idempotency-Key` obrigatório | 201 `Order`; repetição idêntica com a mesma chave retorna 200 mesmo pedido. | 400 `IDEMPOTENCY_KEY_REQUIRED`/erros de body; 401; 404 quote/wallet/NFT; 403 wallet alheia; 422 `QUOTE_EXPIRED`; 409 `IDEMPOTENCY_CONFLICT`, `PRICE_CHANGED`, `EDITION_SOLD_OUT`; cenário pode responder 500 `TIMEOUT_AFTER_CREATE`. |
| `GET /orders`                   | Sessão                                                       | 200 `Order[]`                                                               | 401.                                                                                                                                                                                                                                 |
| `GET /orders/:orderId`          | Sessão                                                       | 200 `Order`                                                                 | 401; 404; 403 pedido alheio.                                                                                                                                                                                                         |
| `POST /orders/:orderId/confirm` | Sessão                                                       | 200 `Order`; `pending` passa a `confirmed` ou `declined`                    | 401; 404; 403.                                                                                                                                                                                                                       |

`Order` contém `id,userId,quoteId,status,snapshot,transactionId,createdAt,updatedAt,version`; status `pending|confirmed|declined`. Snapshot preserva itens e valores monetários, couponCode e walletAddress. O cliente recusa chave vazia com `TypeError`. No mock, a mesma chave vinculada a usuário/corpo diferentes gera conflito; após timeout simulado, repetir com **a mesma** chave permite recuperar resultado sem duplicar pedido. Definir escopo, retenção e persistência de idempotência no backend é pendente.

## Profile, wallets e newsletter

| Método e caminho                  | Acesso; request                                                                      | Sucesso                                                                                              | Erros observados                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `GET /profile`                    | Sessão                                                                               | 200 `CollectorProfile`                                                                               | 401; 404 `NOT_FOUND`.                                               |
| `PATCH /profile`                  | Sessão; campos opcionais: `displayName,username,email,ens,walletNickname,avatar,bio` | 200 `CollectorProfile` (`userId,displayName,username,email,ens,walletNickname,avatar,bio,updatedAt`) | 400/422; 401; 404; 409 `EMAIL_ALREADY_REGISTERED`.                  |
| `GET /wallets`                    | Sessão                                                                               | 200 `Wallet[]`                                                                                       | 401.                                                                |
| `POST /wallets`                   | Sessão; `name,nickname,address,network,type,ens,referralCode,email`                  | 201 `Wallet` (campos de entrada + `id,userId,isPrimary,createdAt`)                                   | 400/422; 401; 409 `WALLET_ALREADY_CONNECTED` (fieldErrors.address). |
| `PATCH /wallets/:walletId`        | Sessão; subconjunto parcial do objeto de entrada                                     | 200 `Wallet`                                                                                         | 400/422; 401; 404; 403; 409 `WALLET_ALREADY_CONNECTED`.             |
| `DELETE /wallets/:walletId`       | Sessão                                                                               | 200 `{success:true}`                                                                                 | 401; 404; 403; 409 `LAST_WALLET`.                                   |
| `POST /wallets/:walletId/primary` | Sessão                                                                               | 200 `Wallet`                                                                                         | 401; 404; 403; 500 `INTERNAL_ERROR`.                                |
| `POST /newsletter`                | Público; `{email}`                                                                   | 201 `{email,subscribedAt}`                                                                           | 400/422.                                                            |

Perfil PATCH é strict; `ens` e `avatar` aceitam null. A carteira aceita tipos `software|hardware|custodial`; endereço é validado conforme rede (EVM ou Solana) e endereços duplicados por rede são recusados. O handler de perfil aceita avatar até 2 MB, enquanto o schema de request do cliente só verifica string/null; confirmar limite e normalização no backend.

## Realtime e lacunas de backend

Há canal Socket.IO tipado separadamente em [`src/api/realtime.ts`](../src/api/realtime.ts), não é endpoint REST: clientes emitem `nft.subscribe(nftId)` e `order.subscribe(orderId)` e recebem `nft.updated`/`order.updated` com `{id,version,data}`. Para pedidos, o mock valida o cookie de sessão simulado e só autoriza o dono; conexões sem sessão, sem assinatura ou pertencentes a outra conta não recebem snapshot nem atualizações. `order.unsubscribe(orderId)` remove a assinatura, e fechar a conexão limpa as inscrições. A URL usa `VITE_SOCKET_URL` ou origem atual, path `/socket.io`, transporte WebSocket. No backend real, autentique o handshake e verifique a titularidade no servidor — nunca confie em `userId` enviado pelo cliente.

**Hoje (MSW/demo):** respostas, estado, cenários de falha e efeitos colaterais acima estão em [`src/mocks/handlers`](../src/mocks/handlers/index.ts). O mock fornece validação e exemplos executáveis, mas inclui estado em memória, cenários artificiais e integrações simuladas.

**Backend real (pendente):** não foi localizado servidor REST neste escopo. Confirmar com a implementação real autenticação/cookie (incluindo atributos `Secure`/política CSRF), persistência, limites de rate e tamanho, semântica transacional de carrinho/estoque, cálculo de taxa/desconto, idempotência distribuída, contratos de sucesso dos endpoints sem schema (logout e reset) e regras do realtime. Não se documentam aqui endpoints de criação de review, pagamento real ou outros caminhos não presentes em `src/api/endpoints` e handlers.
