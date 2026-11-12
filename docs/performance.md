# Auditoria Lighthouse

## Escopo da evidência

A auditoria padrão mede a Home (`/`) do bundle estático de produção criado localmente com `npm run build`. O modo de produção do projeto mantém MSW ativo para a demonstração, e os caminhos `/nfts/ape1.webp` até `/nfts/ape4.webp` são copiados de `public/` para o bundle. A configuração faz cinco execuções de Lighthouse em emulação mobile; a tabela apresenta cada execução e a mediana independente de LCP, CLS e TBT. O runner usa o Chromium instalado pelo Playwright para evitar depender de uma instalação global do Chrome.

A URL pública [nft-marketplace-challenge-ten.vercel.app](https://nft-marketplace-challenge-ten.vercel.app/) também é verificada por uma configuração separada, sem misturar resultados do deploy com o baseline local. As duas coletas são de laboratório e não representam a experiência de usuários reais (RUM/CrUX).

## Como executar

Com Node `24.x` e npm `10.9.9`, instale as dependências e o navegador Chromium uma vez, então rode:

```bash
npm ci
npx playwright install chromium
npm run lighthouse
npm run lighthouse:site
```

`npm run lighthouse` compila o bundle de produção e executa `scripts/lighthouse-ci.mjs` com `lighthouserc.json` (build local). `npm run lighthouse:site` repete a coleta contra a URL publicada indicada em `lighthouserc.site.json`, sem rebuild. Cada configuração executa cinco repetições mobile, salva os HTML/JSON e `manifest.json` em sua própria pasta (`reports/lighthouse/runs/` ou `reports/lighthouse/site-runs/`) e gera um resumo separado (`reports/lighthouse/summary.md` ou `reports/lighthouse/site-summary.md`). O resumo registra os valores individuais, medianas, versão Lighthouse, data, URL e commit/configuração; cada mediana é calculada separadamente a partir dos cinco resultados, não é um relatório artificial nem um único run apresentado como mediana.

A workflow de GitHub Actions executa a mesma coleta depois do build e publica a pasta com os relatórios e o resumo como artifact `lighthouse-reports-<run id>` por 30 dias. Os arquivos de execução são ignorados pelo Git para não versionar os HTML/JSON grandes; o resumo Markdown do baseline é versionável. O workflow coleta evidência, mas ainda não reprova builds por score: limites de performance devem ser escolhidos depois de revisar a variação e os resultados reais.

## Como interpretar

LCP (Largest Contentful Paint) estima quando o maior conteúdo visível é renderizado; a recomendação do Web Vitals é até 2,5 segundos. CLS (Cumulative Layout Shift) mede instabilidade visual e a recomendação é até 0,1. TBT (Total Blocking Time) mede bloqueios da thread principal durante o carregamento; é uma métrica de laboratório que serve como proxy de interatividade/INP, não é um Core Web Vital. Lighthouse não substitui dados de campo (RUM/CrUX); diferenças de dispositivo, rede, cache, localização e interação podem mudar os resultados [1] [2].

A pontuação e as métricas oscilam entre execuções. Por isso a evidência mostra cinco valores brutos e a mediana, não apenas o melhor resultado. Use o relatório HTML individual para investigar audits e oportunidades; para discutir comportamento real em produção, faça também coleta de campo quando houver volume suficiente [3].

## Fontes oficiais

[1]: https://web.dev/articles/vitals 'Web Vitals: métricas e limites recomendados'
[2]: https://web.dev/articles/vitals-measurement-getting-started 'Medição de laboratório versus dados de campo'
[3]: https://developer.chrome.com/docs/lighthouse/overview 'Lighthouse: execução e relatórios'
[4]: https://googlechrome.github.io/lighthouse-ci/docs/configuration.html 'Configuração Lighthouse CI: repetições e saída filesystem'
