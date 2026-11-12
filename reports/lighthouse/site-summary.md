# Lighthouse — baseline mobile da Home publicada

Medição de laboratório do site público. URL informada no repositório: `https://nft-marketplace-challenge-ten.vercel.app/`. Não é dado de usuário real (RUM/CrUX).

- Data da coleta: 2026-11-12T15:50:11.767Z
- Commit do repositório no momento da coleta: cd89bdb
- Lighthouse: 13.6.0
- Dispositivo: emulação mobile padrão do Lighthouse
- URL medida: `https://nft-marketplace-challenge-ten.vercel.app/`
- Repetições: 5; a mediana de cada métrica é calculada independentemente

| Métrica           | Execução 1 | Execução 2 | Execução 3 | Execução 4 | Execução 5 |  Mediana |
| ----------------- | ---------: | ---------: | ---------: | ---------: | ---------: | -------: |
| LCP (s)           |       3.04 |       3.03 |       3.09 |       3.03 |       3.15 |     3.04 |
| CLS               |      0.001 |      0.000 |      0.000 |      0.000 |      0.000 |    0.000 |
| TBT (ms)          |      335.5 |      350.5 |      397.5 |      294.5 |      474.5 |    350.5 |
| Performance score |   87 / 100 |   86 / 100 |   84 / 100 |   88 / 100 |   81 / 100 | 86 / 100 |

Os relatórios HTML/JSON e o manifesto ficam em `reports/lighthouse/site-runs`. Esta auditoria de produção foi executada manualmente; os arquivos brutos permanecem locais e o resumo Markdown pode ser versionado. LCP e CLS são métricas Core Web Vitals; TBT é uma métrica de laboratório usada como proxy de interatividade, não um Core Web Vital. Consulte o [guia de performance](docs/performance.md) para interpretação, limites recomendados e fontes oficiais.
