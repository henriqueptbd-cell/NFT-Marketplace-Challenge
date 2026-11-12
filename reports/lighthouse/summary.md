# Lighthouse — Home mobile (build local)

Medição de laboratório do bundle de produção local em `dist`, com o MSW de demonstração habilitado pela configuração de produção. Não é dado de usuário real (RUM/CrUX).

- Data da coleta: 2026-11-12T22:06:37.616Z
- Commit do repositório no momento da coleta: 1708f76
- Lighthouse: 13.6.0
- Dispositivo: emulação mobile padrão do Lighthouse
- URL medida: `http://localhost:40815/`
- Repetições: 5; a mediana de cada métrica é calculada independentemente

| Métrica              | Execução 1 | Execução 2 | Execução 3 | Execução 4 | Execução 5 |   Mediana |
| -------------------- | ---------: | ---------: | ---------: | ---------: | ---------: | --------: |
| LCP (s)              |       4.21 |       4.16 |       4.17 |       4.19 |       4.23 |      4.19 |
| CLS                  |      0.001 |      0.001 |      0.001 |      0.001 |      0.001 |     0.001 |
| TBT (ms)             |      290.0 |      261.0 |      244.0 |      236.0 |      271.0 |     261.0 |
| Performance score    |   80 / 100 |   81 / 100 |   82 / 100 |   82 / 100 |   81 / 100 |  81 / 100 |
| Accessibility score  |  100 / 100 |  100 / 100 |  100 / 100 |  100 / 100 |  100 / 100 | 100 / 100 |
| Best Practices score |  100 / 100 |  100 / 100 |  100 / 100 |  100 / 100 |  100 / 100 | 100 / 100 |
| SEO score            |   92 / 100 |   92 / 100 |   92 / 100 |   92 / 100 |   92 / 100 |  92 / 100 |

Os relatórios HTML/JSON e o manifesto ficam em `reports/lighthouse/runs`. A CI publica a pasta e este resumo como artifact da execução. LCP e CLS são métricas Core Web Vitals; TBT é uma métrica de laboratório usada como proxy de interatividade, não um Core Web Vital. Consulte o [guia de performance](docs/performance.md) para interpretação, limites recomendados e fontes oficiais.
