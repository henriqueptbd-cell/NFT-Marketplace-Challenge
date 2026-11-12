# Visão geral da aplicação

## Propósito e composição

O projeto é uma aplicação React/TypeScript de marketplace de NFTs chamada Kurio, organizada como frontend com rotas, componentes de domínio e uma camada HTTP tipada. `src/main.tsx` carrega estilos e fontes, inicia o service worker do MSW apenas quando a configuração de mocks está habilitada e, em seguida, monta React em `StrictMode`. `src/App.tsx` envolve o router com `QueryClientProvider`, usando a instância compartilhada em [`src/lib/query-client.ts`](../src/lib/query-client.ts). A árvore de rotas está em [`src/routes/router.tsx`](../src/routes/router.tsx); [`src/routes/RootLayout.tsx`](../src/routes/RootLayout.tsx) mantém o conteúdo da rota, o diálogo global de autenticação, o rodapé e avisos de erro de autenticação.

## Mapa de rotas

Todas as rotas abaixo são filhas do layout raiz. Páginas de conta podem exibir estados de autenticação necessária; não há um bloqueio global de navegação declarado no router.

| Rota                  | Papel confirmado                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                   | Descoberta: busca, filtros por coleção/rede/faixa de preço, ordenação, abas e listagem. Os parâmetros de busca são validados e refletidos na URL.                   |
| `/nft/$id`            | Detalhe, galeria, avaliação, avaliações escritas, favoritos, quantidade e ação para adicionar ao carrinho; também mostra itens relacionados.                        |
| `/cart`               | Carrinho, edição/remover itens, cupom, resumo/cotação e entrada no checkout. Para visitante, a ação abre autenticação com destino `/checkout`.                      |
| `/checkout`           | Exige sessão, busca perfil e carteiras, solicita cotação associada à carteira, cria/confirma pedido e apresenta confirmação em diálogo.                             |
| `/profile`            | Edição de perfil/avatar e troca de senha, após consultar sessão e perfil. Visitante recebe convite de login com destino `/profile`.                                 |
| `/wallets`            | Cadastro/edição das carteiras principal e secundária do usuário autenticado.                                                                                        |
| `/login`, `/register` | Rotas de entrada para diálogo, não páginas dedicadas: abrem o modo indicado se não houver usuário persistido e retornam por `replace` ao destino interno resolvido. |

O cabeçalho abre o login mantendo caminho e query atuais como destino. `AuthDialog` fica montado no layout raiz para sobrepor a página de trás sem desmontá-la; alterna login/cadastro em abas. Ao autenticar, `useCompleteAuth` publica a sessão no cache e tenta mesclar o carrinho de visitante; só fecha e aplica o redirect depois da mesclagem. Falha nela mantém o diálogo aberto e oferece nova tentativa. Redirects externos, relativos sem `/` inicial, `//` e barras invertidas são descartados por [`src/lib/account-routing.ts`](../src/lib/account-routing.ts).

## Fluxo de descoberta à confirmação

Na Home, os filtros e a busca vivem na query string; os valores padrão são omitidos. Submeter uma busca pelo header grava `q`, navega com `#market` e rola até o catálogo, que passa a exibir "Resultados para “termo”" e a ação "Limpar busca" — o mesmo handler é usado em todas as páginas que renderizam o header. `useNfts` consulta o catálogo e mantém resultados anteriores durante a troca de consulta. A página solicita até 100 itens e fatia os resultados localmente em páginas visuais de 12; portanto, a paginação exibida não envia o número da página à API. A partir de um card, o usuário chega a `/nft/$id`; nessa tela, quantidade, imagem selecionada, aba e mensagens de feedback são estado local. Adicionar ao carrinho e favoritar são mutations remotas via hooks.

Em `/cart`, o carrinho e a cotação são dados remotos; o componente busca também os detalhes dos NFTs para conferir preço e disponibilidade. Quantidades, remoções e cupom atualizam e invalidam cache e cotação. O valor subtotal local usa operações decimais em strings; a cotação do serviço, quando disponível, substitui o resumo provisório. Visitante pode manter o carrinho, mas precisa autenticar-se ao prosseguir.

No checkout, são consultados carrinho, perfil, carteiras e cotação; a carteira selecionada é estado de interface. Uma tentativa contendo usuário, cotação, carteira e chave de idempotência é guardada em `sessionStorage` para permitir repetir a mesma tentativa. A criação e confirmação do pedido são chamadas separadas pela camada de API. Quando o pedido chega como confirmado, o cache é invalidado e abre-se o diálogo com snapshot, totais e, se existir identificador de transação, link para explorador. A confirmação exibida não significa que o navegador realizou uma transação blockchain.

## Estado e fronteira de serviços

**Estado remoto:** TanStack Query armazena sessão, NFTs, avaliações, carrinho, cotação, perfil, carteiras e pedidos; hooks padronizam chaves, mutations e invalidações. O padrão global é cache recente por 30 segundos, uma tentativa de retry em consultas, revalidação ao voltar o foco e nenhuma tentativa automática em mutations. Páginas usam estados explícitos de carregamento, erro, vazio e atualização.

**Rascunhos e UI:** formulários de perfil/carteira, filtros de preço ainda não aplicados, campo de cupom, seleção de imagem/quantidade, aba ativa, drawer e avisos são estados de componente. Busca/filtros de catálogo persistem na URL. O usuário é espelhado em `localStorage`; um ID de carrinho visitante também é guardado localmente. Tentativa de checkout fica na sessão do navegador. Isso não substitui a validação/autorização do servidor.

**Camada de integração:** `src/api/client.ts` cria Axios com base em `/api` (ou configuração de URL), credenciais incluídas, cabeçalho de identificador de carrinho visitante e evento global ao receber 401. `src/api/endpoints/` agrupa operações por domínio; os dados recebidos são validados por schemas Zod em `src/api/types/`. `src/api/realtime.ts` define o cliente Socket.IO e eventos versionados usados no checkout. Esta camada constitui o contrato esperado pelo frontend, não prova que um serviço remoto esteja implantado.

> **Hoje (MSW/demo):** quando ativado na inicialização, handlers em `src/mocks/handlers/` interceptam endpoints e manipulam fixtures/estado simulado; existe também transporte simulado para eventos. Login, carrinho, cotação, carteiras, pedidos e pagamento são cenários do navegador. O handler de confirmação pode devolver status simulado e identificador sintético.
>
> **Backend real (pendente):** não há backend real comprovado neste repositório. É necessário implementar os contratos HTTP, autenticação/sessão, validações autoritativas, persistência, pagamentos e canal realtime no servidor antes de tratar as operações como produção. Não há integração on-chain confirmada; redes, carteiras e links para exploradores na interface não comprovam conexão, assinatura ou envio de transação.

Para contratos HTTP, consulte [`docs/api.md`](api.md); para sessão e carteiras, [`docs/backend-auth-and-wallets.md`](backend-auth-and-wallets.md); para cotação, pedidos e pagamentos, [`docs/backend-commerce-and-payments.md`](backend-commerce-and-payments.md). Essas páginas são mantidas em paralelo à visão geral. Ver também [`docs/development-and-testing.md`](development-and-testing.md) para práticas de desenvolvimento e testes; este documento não replica instalação nem listas completas de endpoints.

## Pastas, acessibilidade e limites

`src/routes/` reúne páginas e router; `src/components/domain/` contém peças de negócio reutilizáveis (cards, cabeçalho, resumos, formulários e diálogos); `src/components/ui/` fornece controles base; `src/hooks/` concentra integração React com query/auth/carrinho; `src/api/` define cliente, tipos, endpoints e realtime; `src/mocks/` guarda worker, handlers, fixtures e cenários; `src/lib/` reúne validação, formatação, cópia textual e lógica compartilhada. `src/index.css` configura tokens, largura/gutters e foco visível.

O layout responde a breakpoints: filtros da Home mudam para drawer em telas estreitas, carrinho/checkout têm ação fixa inferior em mobile, navegação de conta vira drawer e colunas surgem em telas maiores. Há rótulos acessíveis, regiões `status`/`alert`, semântica de navegação e indicação de foco, além de respeito a movimento reduzido. Isso descreve recursos existentes, não uma certificação de acessibilidade.

Limitações a considerar: funcionalidades de conta e compra dependem de handlers ou de um backend compatível; páginas de atividade, wishlist, ofertas, downloads e suporte aparecem desabilitadas na navegação de conta. O catálogo visual pagina localmente o conjunto retornado, e o fluxo de checkout só cobre os estados implementados pela interface e pelos contratos. Antes de ampliar o produto, alinhar os schemas, regras de negócio e eventos de frontend com o backend real e registrar decisões nos documentos de integração acima.
