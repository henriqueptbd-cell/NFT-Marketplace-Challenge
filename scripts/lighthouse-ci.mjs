import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { format } from 'prettier'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const configRelativePath = process.argv[2] ?? 'lighthouserc.json'
const summaryRelativePath = process.argv[3] ?? 'reports/lighthouse/summary.md'
const configPath = resolve(root, configRelativePath)
const config = JSON.parse(await readFile(configPath, 'utf8'))
const collectConfig = config.ci?.collect
const rawReportsRelativePath = config.ci?.upload?.outputDir

if (!collectConfig || !rawReportsRelativePath) {
  throw new Error(`Invalid Lighthouse CI configuration: ${configRelativePath}`)
}

const rawReportsDirectory = resolve(root, rawReportsRelativePath)
const summaryPath = resolve(root, summaryRelativePath)
const expectedRuns = collectConfig.numberOfRuns ?? 1
const isLocalBundle = Boolean(collectConfig.staticDistDir)
const cliPath = resolve(root, 'node_modules/@lhci/cli/src/cli.js')
const chromePath = chromium.executablePath()

if (!existsSync(chromePath)) {
  throw new Error(
    `Chromium not found at ${chromePath}. Install it with: npx playwright install chromium`,
  )
}
if (!existsSync(cliPath)) {
  throw new Error('Lighthouse CI is not installed. Run npm ci first.')
}

await rm(rawReportsDirectory, { recursive: true, force: true })

const collection = spawnSync(
  process.execPath,
  [cliPath, 'autorun', `--config=${configRelativePath}`],
  {
    cwd: root,
    env: { ...process.env, CHROME_PATH: chromePath },
    stdio: 'inherit',
  },
)

if (collection.error) throw collection.error
if (collection.status !== 0) process.exit(collection.status ?? 1)

async function findReports(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const reports = []
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name)
    if (entry.isDirectory()) reports.push(...(await findReports(entryPath)))
    else if (entry.name.endsWith('.report.json')) reports.push(entryPath)
  }
  return reports.sort()
}

const reportPaths = await findReports(rawReportsDirectory)
if (reportPaths.length !== expectedRuns) {
  throw new Error(
    `Expected ${expectedRuns} Lighthouse JSON reports; found ${reportPaths.length}.`,
  )
}

const runs = []
for (const reportPath of reportPaths) {
  const report = JSON.parse(await readFile(reportPath, 'utf8'))
  const metric = (id) => {
    const value = report.audits?.[id]?.numericValue
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(
        `Missing numeric Lighthouse metric: ${id} in ${reportPath}`,
      )
    }
    return value
  }
  runs.push({
    lcpMs: metric('largest-contentful-paint'),
    cls: metric('cumulative-layout-shift'),
    tbtMs: metric('total-blocking-time'),
    performanceScore: report.categories?.performance?.score,
    lighthouseVersion: report.lighthouseVersion,
    finalUrl: report.finalUrl,
  })
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

const medians = {
  lcpMs: median(runs.map((run) => run.lcpMs)),
  cls: median(runs.map((run) => run.cls)),
  tbtMs: median(runs.map((run) => run.tbtMs)),
  performanceScore: median(
    runs.map((run) => run.performanceScore).filter(Number.isFinite),
  ),
}
const lighthouseVersion = runs[0]?.lighthouseVersion ?? 'unknown'
let commit = 'unavailable'
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
} catch {
  // Git metadata is optional when the report is generated from a source archive.
}

const seconds = (milliseconds) => (milliseconds / 1000).toFixed(2)
const clsValue = (value) => value.toFixed(3)
const milliseconds = (value) => value.toFixed(1)
const score = (value) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value * 100)} / 100`
    : 'n/a'
const inlineCode = (value) => `\`${value}\``
const runValues = (key, formatter) =>
  runs.map((run) => formatter(run[key])).join(' | ')
const reportDirectory = relative(root, rawReportsDirectory)
const measuredUrl = runs[0]?.finalUrl ?? collectConfig.url?.[0] ?? 'unknown'
const title = isLocalBundle
  ? '# Lighthouse — baseline mobile da Home (build local)'
  : '# Lighthouse — baseline mobile da Home publicada'
const scope = isLocalBundle
  ? `Medição de laboratório do bundle de produção local em ${inlineCode('dist')}, com o MSW de demonstração habilitado pela configuração de produção.`
  : `Medição de laboratório do site público. URL informada no repositório: ${inlineCode(measuredUrl)}.`
const artifactDescription = isLocalBundle
  ? 'A CI publica a pasta e este resumo como artifact da execução.'
  : 'Esta auditoria de produção foi executada manualmente; os arquivos brutos permanecem locais e o resumo Markdown pode ser versionado.'

const summary = `${title}

${scope} Não é dado de usuário real (RUM/CrUX).

- Data da coleta: ${new Date().toISOString()}
- Commit de código/configuração: ${commit}
- Lighthouse: ${lighthouseVersion}
- Dispositivo: emulação mobile padrão do Lighthouse
- URL medida: ${inlineCode(measuredUrl)}
- Repetições: ${runs.length}; a mediana de cada métrica é calculada independentemente

| Métrica | ${runs.map((_, index) => `Execução ${index + 1}`).join(' | ')} | Mediana |
| --- | ${runs.map(() => '---:').join(' | ')} | ---: |
| LCP (s) | ${runValues('lcpMs', seconds)} | ${seconds(medians.lcpMs)} |
| CLS | ${runValues('cls', clsValue)} | ${clsValue(medians.cls)} |
| TBT (ms) | ${runValues('tbtMs', milliseconds)} | ${milliseconds(medians.tbtMs)} |
| Performance score | ${runValues('performanceScore', score)} | ${score(medians.performanceScore)} |

Os relatórios HTML/JSON e o manifesto ficam em ${inlineCode(reportDirectory)}. ${artifactDescription} LCP e CLS são métricas Core Web Vitals; TBT é uma métrica de laboratório usada como proxy de interatividade, não um Core Web Vital. Consulte o [guia de performance](docs/performance.md) para interpretação, limites recomendados e fontes oficiais.
`

await mkdir(resolve(root, 'reports/lighthouse'), { recursive: true })
await writeFile(summaryPath, await format(summary, { filepath: summaryPath }))
console.log(`Wrote Lighthouse median summary to ${summaryPath}`)
