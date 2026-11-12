# Documentação do Kurio

Esta pasta reúne a referência visual, a visão técnica e os handoffs para quem for assumir a aplicação. O site atual é um frontend demonstrativo com API e realtime simulados pelo MSW; os documentos que descrevem o backend futuro são especificações de integração, não confirmação de serviços já existentes.

## Guias

| Documento                                                                      | Para que serve                                                                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [Visão geral da aplicação](application-overview.md)                            | Rotas, jornada de uso, arquitetura frontend, estado, fronteiras de serviço e limites conhecidos. Bom ponto de partida.                 |
| [Referência da API](api.md)                                                    | Contratos REST realmente consumidos, payloads, respostas, autenticação, erros, headers, idempotência e Socket.IO relacionado.          |
| [Handoff de identidade e carteiras](backend-auth-and-wallets.md)               | Como funcionam autenticação, cadastro, perfil e carteiras no mock; segurança, persistência e trabalho necessário para um backend real. |
| [Handoff de carrinho, checkout e pagamentos](backend-commerce-and-payments.md) | Carrinho guest, merge, cotação, pedido, retry, estoque e fronteira entre pagamento mockado e futura integração real.                   |
| [Desenvolvimento e testes](development-and-testing.md)                         | Instalação, comandos, MSW, cenários, Playwright, CI e deploy Vercel condicional.                                                       |
| [Performance Lighthouse](performance.md)                                       | Como rodar Lighthouse mobile, interpretar LCP/CLS/TBT e encontrar relatórios brutos e baseline.                                        |
| [Design system e telas do Figma](design-system.md)                             | Extração visual estimada, quatro artes atualmente usadas e lacunas de correspondência individual com o PDF.                            |

## Leitura sugerida para implementar um backend

1. Leia a [visão geral](application-overview.md) e a [referência da API](api.md) para entender a fronteira que o frontend espera.
2. Use o handoff de [identidade e carteiras](backend-auth-and-wallets.md) para persistência, sessão, propriedade dos recursos e validações.
3. Use o handoff de [commerce e pagamentos](backend-commerce-and-payments.md) para desenhar estoque, cotação, pedido e pagamento. A modalidade/provedor de pagamento ainda não foi decidido.
4. Consulte [desenvolvimento e testes](development-and-testing.md) para rodar o frontend, desligar MSW apenas quando o backend compatível estiver disponível e executar a CI.

## Fonte de verdade e manutenção

Os contratos implementados devem ser conferidos em `src/api/`, as respostas de demonstração e efeitos colaterais em `src/mocks/handlers/`, e o comportamento apresentado em `src/routes/` e `src/hooks/`. Se o código mudar, atualize os guias e mantenha explícito o que é comportamento atual, decisão de produto ainda pendente ou recomendação para produção. Não copie credenciais nem valores secretos para a documentação.
