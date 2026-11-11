# Arquitetura e decisões de engenharia

Este documento registra as decisões efetivamente implementadas no frontend Kurio e as adaptações às telas do Figma. O PDF continua sendo a referência visual; `docs/design-system.md` lista as medidas estimadas e lacunas que exigem validação.

## 1. Estado remoto e cache

TanStack Query é a fonte de verdade no cliente para NFTs, favoritos, perfil, carteiras, carrinho, cotações e pedidos. Componentes de domínio são apresentacionais e recebem props tipadas; não importam fixtures. Estado local é reservado a drafts de formulário, seleção de carteira, abertura de modal e tentativas temporárias.

As mutations do carrinho substituem o cache `['cart']` com a resposta da API e invalidam cotações. A compra confirmada invalida carrinho, NFTs e pedidos sem recarregar a página. As consultas passam `AbortSignal` aos endpoints quando aplicável. O catálogo mantém dados anteriores durante refetch; skeletons têm dimensões estáveis para evitar layout shift.

Valores ETH são strings decimais ponta a ponta. Subtotais e totais são calculados com helpers de unidades inteiras/`BigInt`; nenhum componente usa aritmética de ponto flutuante para dinheiro.

## 2. REST e Socket.IO

O cliente Axios adiciona `X-Guest-Cart-Id` para identificar o carrinho de visitante e inclui cookies (`withCredentials`). O interceptor de resposta não redireciona: para `401`, apenas emite evento global. `useAuthError`, no layout raiz, limpa sessão/cache e subscriptions realtime e encaminha para `/login`, preservando caminho, query e hash.

O Socket.IO tipa `nft.updated` e `order.updated` como `{ id, version, data }`. A UI ignora versões repetidas ou mais antigas. Atualizações de NFT atualizam o cache da entidade e invalidam carrinho/cotação; atualizações de pedido atualizam a query do pedido e podem concluir a tela de confirmação. Na reconexão, checkout refaz as queries ativas de carrinho, perfil, carteiras e cotação.

## 3. Carrinho de visitante, checkout e pedidos

O carrinho é sempre gerenciado pela API mockada, inclusive antes do login. O browser persiste somente o UUID de visitante; MSW mantém carrinho, quantidades e cupom no store persistido `msw:state:v1`. `POST /cart/merge`, chamado após login/registro, copia todas as linhas para a conta e só então esvazia o guest cart. Estoque insuficiente ou NFT removido não bloqueia o merge: a linha permanece visível na conta com alerta para ajuste/remoção, e o checkout fica bloqueado até correção. Falha de API após autenticação mostra feedback e permite retry explícito. O cookie inválido/expirado recebe `401`, enquanto uma requisição sem cookie pode seguir como visitante com `X-Guest-Cart-Id`.

No checkout, a carteira escolhida altera a chave da cotação e recalcula taxa/total via `POST /quote`. Uma cotação vencida ou conflitos de preço, disponibilidade e cupom bloqueiam a confirmação até a pessoa revisar/atualizar a compra. Os cenários pontuais do MSW deixam preço/estoque alterados no store e retornam ao cenário default após o erro para possibilitar recuperação real da tela.

Cada tentativa de compra recebe UUID em `Idempotency-Key`. `quoteId`, `walletId` e chave são guardados na sessão do browser durante retries, associados ao usuário. Após timeout, o reenvio preserva o mesmo body/chave; o servidor mock retorna o pedido existente, sem duplicá-lo. A confirmação usa o snapshot congelado do pedido. `confirmed` limpa o carrinho e abre modal acessível; `declined` mantém feedback recuperável e permite uma nova tentativa.

## 4. Sessão e autenticação

A autenticação usa cookie de sessão simulado pelo MSW. O handler envia `Set-Cookie` com atributos de sessão e, no modo de mock, há uma ponte de browser para simular o comportamento do cookie. O cliente persiste apenas metadados validados de `User` em `localStorage`; não persiste senha ou token de sessão nesse storage. `rememberMe` altera a expiração da sessão de demonstração.

`useAuthSession` recupera usuário/sessão após refresh. Ao receber `401`, o hook raiz remove os metadados do usuário, limpa o cache, encerra realtime e redireciona preservando a rota anterior; o identificador e os dados do carrinho convidado são mantidos. Logout também limpa o cache, remove listeners/conexão Socket.IO e retorna à Home.

## 5. MSW e contratos

A camada MSW simula regras de negócio, não apenas fixtures: valida disponibilidade, sessão, carteira, cupom, cotação e idempotência. Respostas e erros são validados contra schemas Zod/types em `src/api/types`. Componentes React não conhecem os dados seed; os handlers/fixtures são a fronteira do mock. A lista completa de endpoints, payloads, respostas e cenários está em `README.md`.

Cenários de falha de uma operação são consumidos no primeiro disparo para testar a recuperação da interface. Cenários contínuos (`empty`, `slow-3s`, `flaky-500` e `out-of-order`) permanecem ativos até reset/seleção de outro cenário.

## 6. Acessibilidade e adaptação visual

Foco visível, labels associados, erros ligados por `aria-describedby`, mensagens `role="alert"`, estados `role="status"`, rótulos para botões-ícone e redução de movimento são tratados como requisitos de interface. Dialog/Drawer usam primitivos acessíveis para foco/teclado. A sidebar de settings torna-se drawer em mobile; carrinho e checkout reorganizam conteúdo e CTA para telas estreitas.

Os tokens e layouts são aproximações extraídas de PDF rasterizado, não metadados originais do Figma. Inputs de carteira são simulados — não há integração com extensão ou WalletConnect — e `transactionId`/explorer são dados de demonstração, não transação on-chain real. As telas sem estado visual definido no PDF e as limitações restantes estão registradas em `docs/design-system.md`.
