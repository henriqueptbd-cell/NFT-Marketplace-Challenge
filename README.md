# NFT Marketplace Challenge

Plataforma front-end completa para um Marketplace de NFTs, desenvolvida com foco em resiliência, gestão de estado assíncrono e integração de dados em tempo real.

O projeto implementa fluxos de descoberta, gerenciamento de carrinho e checkout seguro (com chaves de idempotência), utilizando uma API mockada internamente para simular condições extremas de rede e concorrência.

## 🛠 Tecnologias e Ferramentas

*   **Interface:** React (Vite) + TypeScript
*   **Roteamento:** TanStack Router
*   **Estado Assíncrono:** TanStack Query
*   **Cliente HTTP:** Axios
*   **Tempo Real:** Socket.IO Client
*   **Estilização & UI:** Tailwind CSS + shadcn/ui
*   **Mocking de Rede:** MSW (Mock Service Worker)
*   **Testes E2E:** Playwright
*   **Performance:** Lighthouse

## ⚙️ Pré-requisitos

*   Node.js (versão 18+ recomendada)
*   NPM, Yarn ou pnpm

## 🚀 Instalação e Execução local

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/nft-marketplace-challenge.git
cd nft-marketplace-challenge
npm install
```

Para iniciar o servidor de desenvolvimento com os mocks (MSW) ativados:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`. O acesso direto a qualquer rota (ex: `/nft/123`, `/checkout`) está configurado e funcional.

## 📜 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no \`.env.example\`:

```env
VITE_API_URL=http://localhost:5173/api
VITE_ENABLE_MSW=true
```

## 🔑 Credenciais Fictícias (Mocks)

Para acessar os fluxos privados (Perfil, Carteiras, Checkout), utilize:

*   **E-mail:** `collector@nftmarket.com`
*   **Senha:** `Secret123!`

O fluxo de Cadastro também está funcional localmente através do MSW.

## 🧪 Simulação de Cenários e Falhas (MSW)

A camada de Mock Service Worker foi configurada para simular cenários reais de rede. Para testar o comportamento de recuperação de erros da interface, utilize o painel de debug (ou altere no arquivo `src/mocks/config.ts`):

*   **Timeout/Latência:** Simula respostas demoradas (2s a 5s).
*   **Erro 500:** Força falhas no fechamento do pedido.
*   **Sessão Expirada:** Retorna 401 para forçar o fluxo de relogin salvando o estado atual.
*   **Socket.IO:** Dispara eventos de mudança de preço (`nft.updated`) pelo console do navegador para testar a invalidação de cache.

Para resetar o "banco de dados" do MSW para o estado inicial, execute o comando global no console do navegador: `window.__mswReset()`.

## 📦 Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o projeto com MSW ativado |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Executa validações de código e estilos |
| `npm run type-check` | Verifica a integridade da tipagem |
| `npm run test:e2e` | Executa testes end-to-end (Playwright) sem interface |
| `npm run test:e2e:ui` | Abre a interface visual do Playwright |
| `npm run audit` | Executa a auditoria do Lighthouse no terminal |
