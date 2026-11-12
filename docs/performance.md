# Auditoria Lighthouse

## Escopo da evidência

O baseline local mede a Home (`/`) do bundle de produção criado com `npm run build`, em emulação mobile, com cinco execuções. O modo de produção mantém MSW ativo para a demonstração, e os caminhos `/nfts/ape1.webp` até `/nfts/ape4.webp` são copiados de `public/` para o bundle.

No site público, a configuração de Home mobile executa cinco repetições. A matriz complementar mede três execuções para cada combinação: Home desktop, detalhe de NFT mobile e detalhe de NFT desktop. Cada rota/dispositivo tem configuração e resumo próprios para não misturar populações diferentes. A rota de detalhe usa o fixture `emerald-ape-042`.

Cada resumo mostra os valores individuais e medianas de LCP, CLS e TBT, além dos scores de Performance, Acessibilidade, Boas práticas e SEO. São medições de laboratório, não dados de usuários reais (RUM/CrUX).

## Como executar

Com Node `24.x` e npm `10.9.9`, instale as dependências e o navegador Chromium uma vez, então rode:

```bash
npm ci
npx playwright install chromium
npm run lighthouse
npm run lighthouse:site
npm run lighthouse:site:matrix
```

`npm run lighthouse` compila o bundle de produção e usa `lighthouserc.json` para cinco execuções mobile da Home local. `npm run lighthouse:site` usa `lighthouserc.site.json` para cinco execuções mobile da Home publicada, sem rebuild. `npm run lighthouse:site:matrix` executa três configurações separadas para Home desktop, detalhe mobile e detalhe desktop no site público. As configurações estão em `lighthouserc.site.home.desktop.json`, `lighthouserc.site.detail.mobile.json` e `lighthouserc.site.detail.desktop.json`.

Os resumos versionados são [`summary.md`](../reports/lighthouse/summary.md), [`site-summary.md`](../reports/lighthouse/site-summary.md), [`site-home-desktop-summary.md`](../reports/lighthouse/site-home-desktop-summary.md), [`site-detail-mobile-summary.md`](../reports/lighthouse/site-detail-mobile-summary.md) e [`site-detail-desktop-summary.md`](../reports/lighthouse/site-detail-desktop-summary.md). Cada configuração grava HTML/JSON e `manifest.json` em sua pasta própria de `reports/lighthouse/`; esses artefatos brutos são ignorados pelo Git, enquanto os resumos Markdown podem ser revisados e versionados.

A GitHub Actions executa o baseline local da Home mobile após o build e publica seus relatórios e resumo como artifact por 30 dias. A matriz do site público é manual e depende do deploy acessível na URL configurada; ela não é misturada ao baseline local nem executada pelo workflow de CI.

## Como interpretar

LCP (Largest Contentful Paint) estima quando o maior conteúdo visível é renderizado; a recomendação do Web Vitals é até 2,5 segundos. CLS (Cumulative Layout Shift) mede instabilidade visual e a recomendação é até 0,1. TBT (Total Blocking Time) mede bloqueios da thread principal durante o carregamento; é uma métrica de laboratório que serve como proxy de interatividade/INP, não é um Core Web Vital. Lighthouse não substitui dados de campo; diferenças de dispositivo, rede, cache, localização e interação podem mudar os resultados [1] [2].

As pontuações e métricas oscilam entre execuções. Por isso a evidência mostra valores brutos e a mediana, não apenas o melhor resultado. Use o relatório HTML individual para investigar audits e oportunidades; para discutir comportamento real em produção, faça também coleta de campo quando houver volume suficiente [3].

## Fontes oficiais

[1]: https://web.dev/articles/vitals 'Web Vitals: métricas e limites recomendados'
[2]: https://web.dev/articles/vitals-measurement-getting-started 'Medição de laboratório versus dados de campo'
[3]: https://developer.chrome.com/docs/lighthouse/overview 'Lighthouse: execução e relatórios'
[4]: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html 'Configuração Lighthouse CI: repetições e saída filesystem'
