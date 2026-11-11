# Kurio — extração do design system

> **Fonte:** `FrontendChallenge.pdf`, 15 páginas de screens exportados do Figma.
> **Escopo:** documentação visual somente; nenhum asset foi extraído e nenhum código de produto foi criado. Os arquivos de imagem do NFT devem ser fornecidos depois pelo usuário em `public/nfts/`.
>
> **Confiabilidade das medidas:** o PDF é uma exportação rasterizada, não contém tokens nem metadados de fonte. Os hex abaixo foram estimados pela amostragem das páginas renderizadas (com pequenas variações por compressão); tamanhos, pesos, radii e espaçamentos são aproximações visuais em pixels CSS. Confirmar esses valores no Figma antes de tratá-los como tokens exatos.

## 1. Linguagem visual

Marketplace escuro e editorial, com superfícies marrom-café, acentos âmbar/dourados, ilustrações de primatas em retratos quadrados e interface predominantemente monoespaçada. Desktop usa conteúdo amplo em colunas e linhas; mobile mantém fundo escuro, simplifica navegação e adota painéis/cards maiores, cantos mais arredondados e ações de compra persistentes/próximas ao rodapé.

## 2. Paleta estimada

| Token | Hex estimado | Uso observado |
|---|---|---|
| `color.bg` | `#140C08` | Fundo principal, canvas das telas e áreas vazias. |
| `color.surface` | `#241410` | Cards, painéis, sidebar, modal e rodapé elevado. |
| `color.surface-raised` | `#2C1C14` | Superfície alternativa/realce de linhas e controles; confirmar no Figma. |
| `color.border` | `#402820` | Contorno discreto de inputs, separadores e bordas de cards; estimativa visual. |
| `color.primary` | `#D0884C` | Botões de ação, preço, seleção ativa, links e ênfases âmbar. |
| `color.primary-soft` | `#38200C` | Bloco marrom-âmbar de rodapé/áreas de ênfase e variantes de superfície. |
| `color.text-primary` | `#F8F0D8` | Títulos e texto de maior contraste. |
| `color.text-secondary` | `#C4B18A` | Descrições, placeholders e metadados. |
| `color.text-tertiary` | `#8E795A` | Token IDs, detalhes auxiliares e texto de baixa ênfase. |
| `color.on-primary` | `#140C08` | Texto escuro sobre o botão âmbar. |
| `color.selection` | `#D0884C` | Estado selecionado/ativo; seleção também pode ser indicada por contorno. |

A arte dos NFTs introduz verdes, roxos, creme e dourado, mas são cores das imagens e não devem ser incorporadas à paleta funcional da interface. Estados de sucesso, erro e aviso não estão padronizados/mostrados de forma suficiente no material.

## 3. Tipografia

| Papel | Família observada/proposta | Tamanho estimado | Peso | Letter-spacing estimado |
|---|---|---:|---:|---:|
| Display / hero desktop | Monoespaçada; visual semelhante a `Roboto Mono` ou fallback `ui-monospace` | 40–48 px | 700–800 | 0 a `0.02em`; headline em caixa alta |
| H1 de página | Mesma família monoespaçada | 28–36 px desktop; 22–26 px mobile | 700 | 0 a `0.01em` |
| H2 / título de seção | Mesma família monoespaçada | 20–24 px desktop; 18–20 px mobile | 700 | aproximadamente `0` |
| Body / descrição | Mesma família monoespaçada | 14–16 px desktop; 14–16 px mobile | 400 | aproximadamente `0` |
| Label / metadado | Mesma família monoespaçada | 12–14 px | 400–500 | `0` a `0.02em` |
| Preço | Mesma família monoespaçada | 16–20 px desktop; 16–18 px mobile | 600–700 | aproximadamente `0` |
| Marca “KURIO” | Monoespaçada em caixa alta | 12–16 px no header; maior em auth mobile | 700 | `0.10–0.14em` |

**Observação:** a família real não é identificável com segurança pelo PDF. As telas sugerem uma única família monoespaçada para display e corpo, com contraste principalmente por tamanho, peso, cor e caixa alta; validar nome e disponibilidade da fonte antes de implementar.

## 4. Formas e espaçamento

### Radii estimados

| Elemento | Raio estimado | Observação |
|---|---:|---|
| Card desktop | 4–8 px | Cards de NFT e painéis escuros, geralmente discretos. |
| Card/painel mobile | 12–20 px | Carrinho e cartões de carteira têm cantos mais macios. |
| Botão desktop | 4–6 px | Botões primários retangulares com pequeno raio. |
| Botão mobile | 12–24 px; CTA de compra até 999 px | CTA de compra em formato pílula em detalhe/carrinho mobile. |
| Input desktop | 3–5 px | Bordas finas e cantos quase retos. |
| Input mobile | 10–14 px | Formulários de autenticação e campo promocional mais arredondados. |
| Badge/chip | 2–4 px ou pílula | Tag “RARO” retangular; edição/seleção em chips arredondados. |
| Modal | 0–8 px | Modal de confirmação desktop é painel predominantemente retangular. |

### Escala de espaçamento

Escala recorrente solicitada, em pixels CSS. O PDF não revela valores exatos; tratar como tokens de partida e conferir no Figma.

| Token | Uso sugerido observado |
|---:|---|
| 4 px | Ícone–label, ajustes finos e espaçamento interno compacto. |
| 8 px | Label/campo, metadados e gaps pequenos entre controles. |
| 12 px | Conteúdo de card, grupos curtos e cards mobile. |
| 16 px | Padding padrão de inputs/cards e gaps de formulário. |
| 24 px | Separação de grupos, cards e seções menores. |
| 32 px | Padding de painéis e separação entre blocos principais. |
| 48 px | Distância entre seções e respiro de conteúdo desktop. |
| 64 px | Margens verticais amplas entre seções de landing/rodapé. |

Desktop apresenta um container centrado e alinhamento consistente; mobile reduz colunas e mantém margens laterais estreitas. Larguras máximas, breakpoints e gutters exatos não podem ser medidos com fiabilidade pelo PDF.

## 5. Componentes e variantes identificadas

| Componente | Variantes/uso observados | Detalhes visuais/funcionais visíveis |
|---|---|---|
| **Botão** | Primário preenchido; secundário contornado; textual/link; social (Google/Facebook); ícone; ação de navegação. | Âmbar para CTA (“Explorar”, “Comprar”, “Confirmar compra”, “Salvar”); texto escuro sobre primário. CTA mobile de compra pode ser pílula. Há ações desabilitadas/hover não demonstradas. |
| **Input** | Texto, e-mail, senha com toggle de visibilidade, select, endereço de carteira, área de texto, busca, código promocional/newsletter. | Fundo escuro, borda fina marrom, placeholder de baixo contraste. Labels aparecem acima em formulários desktop; auth mobile usa placeholder dentro do campo. Required indicado com asterisco. |
| **Card de NFT** | Grade desktop, miniatura em carrinho/checkout, recomendação/coleção, card de mobile; com ou sem badge. | Imagem quadrada, nome/edição e preço ETH. Algumas interações surgem sobre a imagem (favorito, carrinho, busca) e badge “RARO”. |
| **Badge / chip** | Raridade (“RARO”), oferta (“OFERTA LIMITADA”), edição (1/1, 1/10, 1/50, aberta), filtro ativo e contador de carrinho. | Ênfase âmbar ou contorno âmbar; chips de edição circulares/ovais. Critérios de status e todas as cores não estão definidos. |
| **Paginação** | Desktop numerada (1–4) com controles anterior/próximo; indicador de carrossel por pontos. | Número ativo preenchido em âmbar e números inativos escuros/contornados; mobile não mostra claramente a mesma paginação. |
| **Quantity stepper** | Botões `−` e `+` com quantidade; versão compacta em detalhe, cart line item e item de carrinho. | Botões circulares/ovais âmbar na tela de detalhe; em carrinho desktop aparecem pequenos botões âmbar com contagem ao centro; mobile apresenta controles reduzidos e possível remover item. Limites e comportamento ao chegar a zero não aparecem. |
| **Modal de confirmação** | Sucesso pós-compra, com fechar, resumo de transação e CTA para explorer externo. | Painel escuro central, ícone/envelope dourado, ID/data/total/carteira, lista de NFTs, taxa e total, mensagem de confirmação e botão “Ver no Etherscan”; faixa âmbar inferior. O PDF não mostra estado de falha. |
| **Navegação** | Header desktop com itens e ícones; navegação inferior mobile; sidebar de perfil. | Item ativo destacado em âmbar e linha inferior no header desktop; navegação mobile com ícones. O comportamento responsivo intermediário não está especificado. |
| **Resumo de compra** | Resumo de carrinho/checkout com subtotal, desconto, taxa, total e seleção de carteira. | Separadores finos e total destacado; em mobile o resumo do carrinho fica agrupado na metade inferior da tela. |

## 6. Mapeamento das telas do PDF

### Home desktop — página 1
Header horizontal com marca, navegação, busca/carrinho/login; hero dividido entre texto e retrato de NFT, seguido pelo mercado com filtros laterais e grade de cards.
A página continua com paginação, promoções de coleção, artigos, benefícios/newsletter e rodapé em colunas.

### Detail desktop — página 2
Breadcrumb e área principal em duas colunas: galeria/miniaturas à esquerda e nome, preço, avaliações, descrição curta, edição, quantidade e ações à direita.
Abaixo, tabs de detalhes/avaliações, texto de procedência/contrato/direitos, recomendações da coleção e rodapé.

### Cart desktop — página 3
Breadcrumb; tabela/lista de NFTs com imagem, nome, token, preço, quantidade ajustável, total por linha e remoção; resumo da carteira à direita.
Resumo inclui código promocional, subtotal, desconto, taxa de rede, total e CTA de checkout; recomendações e rodapé ficam abaixo.

### Checkout desktop — página 4
Breadcrumb e formulário de perfil do colecionador em duas colunas, com dados pessoais, rede/carteira, e-mail, ENS e observação opcional.
Coluna de NFTs e resumo financeiro à direita; seleção de carteira/rede e confirmação da compra abaixo do total; rodapé completo.

### Confirmation modal — página 5
Modal central sobre canvas escuro, com ícone de sucesso, confirmação de aquisição e resumo superior (ID, data, total e carteira).
Lista os NFTs/edições/subtotais, taxa e total, texto de confirmação e CTA “Ver no Etherscan”; tem botão de fechar.

### Login modal desktop — página 6
Modal sobre home desktop; alternância “Entrar | Criar conta”, texto introdutório, e-mail/senha, recuperar senha e CTA principal.
Divider “Ou continue com”, botões Google/Facebook e fechar; login é o estado visível.

### Register modal desktop — página 7
Mesmo padrão de modal sobre home, no estado “Criar conta”; campos de usuário, e-mail, senha e confirmação.
CTA “Criar conta”, alternativas Google/Facebook e fechar; transição para o estado de login é indicada na aba superior.

### Profile desktop — página 8
Header do marketplace e sidebar “Meu perfil” com dados, carteiras, atividade, lista de interesse, ofertas, downloads, suporte e sair.
Conteúdo principal edita dados do colecionador, ENS, avatar e senha, com ação de salvar.

### Wallets desktop — página 9
Header e sidebar de perfil; painel “Carteira principal” com formulário de identificação, rede, endereço, tipo, e-mail e ENS.
Ação salvar carteira, controles para adicionar/igualar carteira secundária e estado vazio informativo.

### Home mobile — página 10
Topo com busca e filtro; hero compacto em cartão com carrossel/indicadores, tabs de mercado e grade de NFTs em duas colunas.
Cards incluem preço e raridade; barra de navegação inferior fixa com ícones para seções principais.

### Detail mobile — página 11
Barra superior com voltar e favorito; imagem grande do NFT e painel inferior com título, avaliação, descrição, chips de edição, token, coleção e atributos.
Barra de compra inferior mostra stepper, preço e CTA “Comprar NFT”, mais ação de carrinho.

### Cart mobile — página 12
Título e voltar, lista vertical de cards compactos com imagem, edição, preço, quantidade e controle de remoção.
Resumo inferior agrupa cupom, subtotal, desconto, taxa e total; CTA largo “Conectar e finalizar”.

### Checkout mobile — página 13
Tela “Pagamento com carteira” com carteiras conectadas, troca de carteira, cartões de conta/rede e opções WalletConnect, MetaMask e Coinbase.
Total destacado; botão “Confirmar compra” largo, ancorado junto à base da tela.

### Login mobile — página 14
Marca centralizada, título “Entrar”, campos de e-mail e senha, recuperar senha e CTA primário em coluna.
Divider e login social Google/Facebook, seguido do link para criar conta; layout sem header global.

### Register mobile — página 15
Marca e título “Criar perfil de colecionador”; campos de usuário, e-mail, senha e confirmação em coluna.
CTA “Criar perfil”, alternativas sociais Google/Facebook e link para entrar; layout sem header global.

## 7. Inventário de assets de imagem necessários

Os screens usam retratos quadrados/recortáveis de primatas estilizados. A lista abaixo identifica os NFTs nomeados no PDF e o uso provável/observado; os arquivos **não foram extraídos**. Sugestão de nomes de arquivo é apenas convenção para futura adição em `public/nfts/`. A exportação reaproveita retratos entre diferentes NFTs; confirmar no Figma se cada token precisa de arte única ou se o reaproveitamento é intencional.

| NFT / arquivo sugerido | Descrição visual do macaco | Onde aparece |
|---|---|---|
| **Emerald Ape #042** — `emerald-ape-042.webp` | Macaco marrom de cabelo espetado, óculos redondos verdes com aro dourado, jaqueta varsity verde-esmeralda e pingente. | Hero da Home desktop/mobile, cards da Home, detalhe desktop/mobile, carrinho/checkout, modal de confirmação e miniaturas editoriais. |
| **Sage Nomad #009** — `sage-nomad-009.webp` | Retrato de macaco em roupa de explorador/nomad; aparência do card desktop não é inequívoca no raster e pode reutilizar o gorila de chapéu. Validar associação nome–retrato. | Grade da Home, sobreposição de login/registro desktop, itens de carrinho/checkout quando presentes. |
| **Neon Vessel #552** — `neon-vessel-552.webp` | Retrato estilizado de macaco de aparência escura com blazer creme e gola alta escura no card que aparenta corresponder ao item; confirmar mapeamento visual no Figma. | Grade da Home desktop, associado a badge de raridade em algumas composições; não aparece como item nomeado nas telas de compra. |
| **Cosmic Bloom #118** — `cosmic-bloom-118.webp` | Macaco cinza, chapéu bucket verde-oliva e moletom roxo. | Home desktop/mobile, recomendados da página de detalhe/carrinho, checkout e textos/cartões editoriais. |
| **Violet Nomad #314** — `violet-nomad-314.webp` | Macaco cinza com chapéu bucket verde-oliva e moletom roxo; visual semelhante ao Cosmic Bloom, sugerindo reuso ou variação não evidente no PDF. | Home desktop, detalhe/recomendações, carrinho desktop/mobile, checkout e modal de confirmação. |
| **Ivory Baron #088** — `ivory-baron-088.webp` | Gorila/macaco de pelo escuro, blazer claro marfim e gola alta preta. | Home desktop, recomendações, carrinho desktop/mobile, checkout e modal de confirmação. |
| **Golden Beat #207** — `golden-beat-207.webp` | Macaco dourado/alaranjado usando fones verdes grandes e jaqueta clara. | Home desktop, recomendações, carrinho mobile, modal de confirmação e artigos. |
| **Golden Frequency #071** — `golden-frequency-071.webp` | Macaco cinza em moletom roxo e chapéu bucket; aparência muito próxima de Cosmic Bloom/Violet Nomad. | Grade da Home desktop. |
| **Golden Signal #160** — `golden-signal-160.webp` | Macaco dourado/alaranjado usando fones verdes e jaqueta clara; visual próximo ao Golden Beat. | Grade da Home desktop, recomendações da coleção e faixa “mais desta coleção”. |

**Requisitos de entrega a confirmar ao adicionar os arquivos:** uma imagem principal por NFT, resolução/origem, proporção e crop de cards, existência de imagem hero diferente da miniatura, versões responsivas/retina e texto alternativo. Não há arquivos de imagem referenciados ou exportados junto com esta documentação.

## 8. Lacunas do PDF para validação

### Telas e cobertura responsiva ausentes
- **Profile mobile** e **Wallets mobile** não aparecem; adaptar a sidebar desktop para navegação compacta e definir fluxo/formulário mobile.
- **Confirmation modal mobile** não aparece; definir se vira página, bottom sheet ou modal de tela cheia, incluindo fechamento e comportamento do CTA externo.
- Não há telas completas de **coleção**, perfil de criador, busca, resultados filtrados, histórico/atividade, lista de interesse, ofertas, downloads, suporte ou aprendizagem; esses links aparecem na navegação/rodapé, mas sem destinos demonstrados.
- Não há rota desktop dedicada de login/registro: o material mostra esses fluxos como modais sobre a Home, além de telas mobile dedicadas. Confirmar se o desktop deve ter modal, rota, ou ambos.
- Não há tablet/intermediário, menu mobile aberto, scroll states nem regras de breakpoints/container.

### Estados de interação ausentes
- Hover, focus-visible, active/pressed, disabled, loading e feedback de sucesso para botões, links, cards, tabs, paginação, filtros, select, stepper e navegação.
- Estados de input vazio/preenchido, erro, validação, campo obrigatório, autocomplete, senha visível/oculta, seleção de dropdown e upload/remoção de avatar.
- Interações completas de filtros/sort e busca; seleção de edição, favoritar/compartilhar, remover do carrinho, quantidade mínima/máxima, código promocional válido/inválido e cálculo/atualização de taxa.
- Fluxo de conexão/troca de carteira, carteira não suportada, rede errada, assinatura da transação, pendência, rejeição, falha e confirmação/on-chain lenta.
- Fechar modal, clicar fora, Escape, foco inicial, foco preso e retorno de foco ao acionador não estão especificados.

### Empty states, falhas e conteúdo
- Não há empty state de carrinho vazio, resultados de busca/filtro sem resultados, coleção vazia, lista de interesse vazia, perfil sem avatar, carteira secundária ausente além da mensagem simples da página Wallets, ou artigos/conteúdo indisponíveis.
- Não há telas de erro 404/500/offline, erro de carregamento de imagem, falha de API, transação recusada/expirada, carteira desconectada, autenticação inválida ou limite de inventário.
- Não há skeletons, placeholders de carregamento ou fallback para imagem quebrada.
- Não há estados de sucesso/erro para cadastro, login, recuperação de senha, newsletter, atualização de perfil e cadastro de carteira; não existe screen de “esqueci minha senha”.
- Textos, moeda/locale e inconsistências de exemplo (ETH com formatos decimais diferentes; IDs/edições que variam entre telas; mesma arte associada a tokens diferentes) precisam de validação de conteúdo.

### Acessibilidade e especificação visual
- Contraste e cores semânticas de erro/sucesso/aviso não são indicados; confirmar contraste de placeholders/texto terciário sobre superfícies.
- Não há especificação de estados de foco acessíveis, navegação por teclado, rótulos acessíveis para ícones, ordem de tabulação, leitores de tela ou redução de movimento.
- Família de fonte, pesos exatos, escalas oficiais, line-height, letter-spacing, radii, medidas, grid, breakpoints, ícones/logos vetoriais e tokens originais não podem ser recuperados com certeza do PDF.
- Conteúdo em português está visível; não há regras de tradução, datas, pluralização, formatação ETH/USD, truncamento de endereços ou fallback para textos longos.

**Pontos principais para validação antes da implementação:** confirmar fonte e tokens exatos com acesso ao Figma; mapear corretamente nome de NFT para arquivo de arte (há repetições visuais/associações ambíguas); aprovar as decisões responsivas e os estados ausentes acima.
