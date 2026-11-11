# Arquitetura e Decisões de Engenharia

Este documento detalha as decisões técnicas, a gestão de estados, políticas de concorrência e eventuais desvios do design original (Figma) adotados na construção do NFT Marketplace.

## 1. Gestão de Estado e Estratégia de Cache (TanStack Query)

O estado remoto é o coração da aplicação. Não utilizamos estado global (`Context` ou `Zustand`) para dados que pertencem ao servidor (como listas de NFTs ou carrinho). Tudo passa pelo TanStack Query.

*   **Cache Time vs Stale Time:** Listagens de catálogo possuem um `staleTime` de 30 segundos, pois os preços variam. Dados estáticos de perfil de usuário possuem um `staleTime` estendido.
*   **Invalidação Coerente:** Ao realizar um pedido com sucesso, apenas as *query keys* pertinentes (`['cart']` e `['nft', id]`) são invalidadas, acionando o *refetch* automático sem recarregar a tela.
*   **Atualização Otimista:** Implementada no fluxo de "Favoritar NFT". A UI responde imediatamente, e caso a mutation falhe (HTTP 500 simulado no MSW), o cache sofre *rollback* automático para a versão anterior.

## 2. Reconciliação entre REST e Socket.IO

Um dos maiores desafios técnicos abordados foi evitar *race conditions* (condições de corrida) entre os eventos de WebSockets e as chamadas REST.

*   Quando o evento `nft.updated` é recebido, o payload (novo preço e disponibilidade) é interceptado.
*   Em vez de substituir o dado cegamente, comparamos a "versão" (timestamp) do evento. Se for mais recente, usamos `queryClient.setQueryData` para atualizar o cache do TanStack silenciosamente.
*   **Recuperação (Reconexão):** Se o Socket.IO desconectar temporariamente, ao reconectar, um gatilho faz *refetch* ativo das rotas de carrinho e checkout na API REST, garantindo que o usuário não finalize um pedido com preço obsoleto após um *blind spot* da rede.

## 3. Carrinho de Compras, Idempotência e Pedidos

*   **Persistência do Carrinho:** Visitantes deslogados possuem seu carrinho gerenciado localmente. Ao realizar o login, ocorre o *merge* das informações com a sessão autenticada, preservando a intenção de compra.
*   **Idempotência no Checkout:** A requisição de finalização de pedido envia um cabeçalho `Idempotency-Key` (gerado via UUID no front-end). Se a conexão cair após o clique e o usuário tentar reenviar o formulário, a API (MSW) entende que é o mesmo pedido e devolve o status já processado, evitando cobrança duplicada.
*   **Validação em Trânsito:** Se um item do carrinho for comprado por outro usuário (esgotar a edição), o carrinho exibe um alerta de indisponibilidade e trava a finalização até o usuário remover o item inválido.

## 4. Política de Sessão e Autenticação

A sessão é controlada via token persistido de forma segura para recuperação após *refresh*. 
*   Se um requisição retornar `401 Unauthorized` (simulado por expiração), a interceptação do Axios captura o erro, armazena a rota atual, redireciona para `/login`, e após autenticação, devolve o usuário ao ponto exato onde estava (ex: na etapa final do Checkout).
*   Eventos e `subscriptions` do Socket.IO são eliminados rigorosamente na rotina de *logout* para prevenir vazamento de dados caso outra conta seja logada na mesma máquina.

## 5. Mocking de Rede (MSW) e Contratos REST

A camada de MSW foi arquitetada não apenas para prover dados, mas para simular regras de negócio estritas do servidor.
*   **Isolamento:** Componentes React e o cliente Axios não conhecem os *fixtures* de dados falsos. Eles enxergam uma API real, garantindo que o código base é de produção.
*   **Contratos:** Todas as respostas (sucesso, erro de validação, sessão inválida) respeitam rigorosamente os tipos TypeScript criados na pasta `src/api/types`.

## 6. Acessibilidade e UX (Desvios e Adaptações)

O layout do Figma foi respeitado nos critérios de hierarquia, tipografia e respiro. No entanto, foram feitas adaptações focadas em Acessibilidade (a11y) baseadas nas análises do Lighthouse e boas práticas:

1.  **Foco:** Foram adicionados *outlines* visíveis na navegação por teclado (Tab) não previstos no design original.
2.  **Skeletons:** Implementados *Shimmer Effects* fixos baseados nas dimensões reais das imagens para evitar *Cumulative Layout Shift* (CLS) durante carregamentos assíncronos.
3.  **Comentários do Figma:** Regras de interação descritas nas anotações do Figma foram incorporadas na lógica dos componentes e validadas nos testes do Playwright.
4.  **Escopo do Desafio:** Páginas listadas como fora de escopo (como Suporte e Ofertas) foram implementadas com botões neutros não-clicáveis, evitando confusão para o usuário final.

---
*Nota: Este projeto foi estruturado, desenvolvido e testado dentro de uma janela restrita de execução, priorizando arquitetura sólida, gestão de estado robusta e resiliência de UI em detrimento de micro-interações animadas.*
