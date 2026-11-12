# Lighthouse — baseline mobile da Home (build local)

Medição de laboratório do bundle de produção local em `dist`, com o MSW de demonstração habilitado pela configuração de produção. Não é dado de usuário real (RUM/CrUX).

- Data da coleta: 2026-11-12T15:49:07.593Z
- Commit do repositório no momento da coleta: cd89bdb
- Lighthouse: 13.6.0
- Dispositivo: emulação mobile padrão do Lighthouse
- URL medida: `http://localhost:46421/`
- Repetições: 5; a mediana de cada métrica é calculada independentemente

| Métrica           | Execução 1 | Execução 2 | Execução 3 | Execução 4 | Execução 5 |  Mediana |
| ----------------- | ---------: | ---------: | ---------: | ---------: | ---------: | -------: |
| LCP (s)           |       4.24 |       4.28 |       4.32 |       4.22 |       4.23 |     4.24 |
| CLS               |      0.001 |      0.001 |      0.001 |      0.001 |      0.001 |    0.001 |
| TBT (ms)          |      324.0 |      352.5 |      315.0 |      315.0 |      306.0 |    315.0 |
| Performance score |   79 / 100 |   77 / 100 |   78 / 100 |   79 / 100 |   79 / 100 | 79 / 100 |

Os relatórios HTML/JSON e o manifesto ficam em `reports/lighthouse/runs`. A CI publica a pasta e este resumo como artifact da execução. LCP e CLS são métricas Core Web Vitals; TBT é uma métrica de laboratório usada como proxy de interatividade, não um Core Web Vital. Consulte o [guia de performance](docs/performance.md) para interpretação, limites recomendados e fontes oficiais.
