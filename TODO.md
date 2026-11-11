# TODO — Kurio

## Fase: Carrinho e checkout — implementada

### Carrinho `/cart`

- [x] Renderizar carrinho da API em desktop com linhas e resumo lateral, e em mobile com cards empilhados e CTA fixo. Cada linha exibe `NFTImage`, nome, token/edição, preço unitário, quantidade, total e ação de remoção.
- [x] Buscar NFTs/linhas pela API; usar `NFTImage`; implementar carrinho vazio, skeleton estável, erro com retry e refetch sem esconder conteúdo já carregado.
- [x] Permitir alterar quantidade sem baixar de 1, respeitar estoque e oferecer remoção separada; erros de mutation são anunciados e associados ao stepper por `aria-describedby`.
- [x] Aplicar/remover cupom pela API; preservar o valor escrito em erro; diferenciar cupom inválido e expirado, com mensagem ligada ao input.
- [x] Exibir subtotal, desconto, taxa e total como strings ETH da API; subtotal provisório de visitante usa os preços string do carrinho; mutations invalidam/recalculam a cotação.
- [x] Tratar carrinho vazio, item esgotado, estoque insuficiente e preço alterado sem apagar a linha; impedir avanço até correção explícita.
- [x] Manter carrinho de visitante via API mockada entre refreshes; após login/registro, mesclar quantidades e cupom válido com o carrinho de conta. Linhas acima do estoque/NFT removido permanecem visíveis para revisão ou remoção, sem bloquear login nem perder os itens; falhas transitórias de API são anunciadas e permitem retry explícito.

### Checkout `/checkout`

- [x] Exigir sessão e redirecionar para login preservando `/checkout`; carregar perfil, carteiras e carrinho via API com loading, retry e estados empty/error.
- [x] Exibir perfil, carteira(s), itens e resumo; selecionar carteira/rede atualiza a chave e recalcula a cotação via API.
- [x] Exibir subtotal, desconto, taxa, total, cupom e validade da cotação; manter valores ETH como strings e bloquear confirmação para carrinho vazio, sem carteira válida, quote vencido ou item indisponível.
- [x] Tratar `PRICE_CHANGED`, `EDITION_SOLD_OUT`, `COUPON_EXPIRED` e `QUOTE_EXPIRED`; apresentar causa, reconciliar queries e oferecer atualização/revisão antes de confirmar.
- [x] Criar pedido com `Idempotency-Key` estável por tentativa; após timeout, reutilizar a mesma chave e body; invalidar as queries do carrinho, NFTs e pedidos sem reload.
- [x] Representar estados `pending`, `confirmed` e `declined`; recusa é recuperável. Confirmação apresenta modal acessível com snapshot, carteira, data, total, taxa, itens, `transactionId` e link de explorer quando disponível.
- [x] Permitir fechar o modal por botão ou teclado, retornar ao marketplace e manter snapshot visível enquanto o modal estiver aberto. O primitive Dialog provê foco preso, Escape e gestão de foco.

### Requisitos transversais

- [x] NFT, usuário, carteira, cupom, preço, disponibilidade, pedido, imagem e resumo vêm da API mockada; textos da interface estão em constantes nomeadas; componentes recebem props tipadas e dinheiro usa aritmética decimal sem float.
- [x] Manter foco visível, labels associadas, `aria-describedby` em erros, `role="alert"`/`role="status"`, botões-ícone com `aria-label` e respeito a `prefers-reduced-motion` via componentes existentes.
- [x] Atualizações Socket.IO versionadas reconciliam cache de NFT/carrinho/cotação; reconexão revalida queries ativas do checkout.
- [x] Cobrir os fluxos de carrinho visitante/merge, erro de cupom, login protegido, compra confirmada, timeout idempotente, preço alterado, recusa de pagamento e regressões existentes com Playwright.
