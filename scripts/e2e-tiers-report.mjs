#!/usr/bin/env node
/**
 * Arma y abre el reporte de Allure con todas las corridas (4 niveles de
 * defectos x android/ios) a partir de e2e/reports/todas-las-corridas/
 * allure-results, que deja scripts/e2e-tiers.mjs. No vuelve a correr ninguna
 * prueba.
 *
 *   bun run e2e:report:tiers                -> arma el reporte y lo abre
 *   bun run e2e:report:tiers -- --no-open   -> sólo lo arma (lo usa e2e-tiers)
 *
 * Qué hace para que el dashboard de Allure 2 se pueda leer:
 *   1. Etiqueta cada resultado (scripts/lib/enrich-results.mjs): una barra por
 *      corrida en Suites, severidad de Qase, área funcional y riesgos.
 *   2. Escribe categories.json (tipos de fallo por mensaje, en vez de las dos
 *      categorías por estado de Allure), environment.xml y executor.json.
 *   3. Conserva el historial entre tandas: los gráficos de Trend se llenan a
 *      medida que se corre la suite.
 *   4. Genera el reporte en español y con nombre propio.
 *
 * También deja la página de insights (scripts/e2e-insights.mjs); se abre con
 * `bun run e2e:insights`.
 */
import {spawn, spawnSync} from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import {writeAllure2Metadata} from "./lib/allure2-metadata.mjs"
import {enrichDirectory, identityOf} from "./lib/enrich-results.mjs"
import {PLATFORMS, PLATFORM_NAMES, TIERS} from "./lib/tiers.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// E2E_REPORTS_DIR redirige todo (resultados, reporte e historial) a otra carpeta;
// sirve para probar el script sin tocar los reportes reales.
const REPORTS_DIR = resolve(
  process.env.E2E_REPORTS_DIR ?? resolve(ROOT, "e2e/reports")
)
const ALL_RUNS_DIR = resolve(REPORTS_DIR, "todas-las-corridas")
const RESULTS = resolve(ALL_RUNS_DIR, "allure-results")
const ALLURE_REPORT = resolve(ALL_RUNS_DIR, "allure")
const INSIGHTS = resolve(ALL_RUNS_DIR, "insights/index.html")
const CASES = resolve(ROOT, "e2e/data/qase-cases.json")
const ALLURE = resolve(ROOT, "node_modules/.bin/allure")

/**
 * Historial de Allure: vive fuera de todas-las-corridas/, que e2e-tiers.mjs
 * borra al empezar cada tanda. `latest` es el de la última generación y
 * `previous` el que había justo antes; ver más abajo.
 */
const HISTORY_DIR = resolve(REPORTS_DIR, "history/tiers")
const LATEST = resolve(HISTORY_DIR, "latest")
const PREVIOUS = resolve(HISTORY_DIR, "previous")
const FINGERPRINT = resolve(HISTORY_DIR, "fingerprint")

const REPORT_NAME = "Suite E2E · todas las corridas"
const open = !process.argv.includes("--no-open")

if (!existsSync(RESULTS)) {
  console.error(
    "\n[e2e-tiers-report] No hay resultados en " +
      `${RESULTS.replace(`${ROOT}/`, "")}. ` +
      "Se generan con `bun run publish:e2e:tiers`.\n"
  )
  process.exit(1)
}

// 1. Etiquetas.
if (existsSync(CASES)) {
  const {touched, missing} = enrichDirectory(
    RESULTS,
    JSON.parse(readFileSync(CASES, "utf8"))
  )

  console.log(`[e2e-tiers-report] Resultados etiquetados: ${touched}.`)

  if (missing.length > 0) {
    console.warn(
      `[e2e-tiers-report] Casos que no están en Qase: ${missing.join(", ")}. ` +
        "Corré `bun run qase:sync` si son nuevos."
    )
  }
} else {
  console.warn(
    "[e2e-tiers-report] Falta e2e/data/qase-cases.json: el reporte sale sin " +
      "severidad ni riesgos. Se genera con `bun run qase:sync`."
  )
}

const results = readdirSync(RESULTS)
  .filter(file => file.endsWith("-result.json"))
  .map(file => JSON.parse(readFileSync(resolve(RESULTS, file), "utf8")))

const tiers = TIERS.filter(tier =>
  results.some(result => identityOf(result.labels ?? []).tier === tier)
)
const platforms = PLATFORMS.filter(platform =>
  results.some(result => identityOf(result.labels ?? []).platform === platform)
)
const runs = new Set(
  results.map(result => {
    const {tier, platform} = identityOf(result.labels ?? [])

    return `${tier}-${platform}`
  })
).size

/**
 * 3. Historial. Cada `generate` suma un punto a los gráficos de Trend. Si se
 * vuelve a armar el reporte con los mismos resultados (sin correr nada nuevo),
 * ese punto quedaría duplicado: en ese caso se parte del historial anterior en
 * vez del último. La huella de una tanda es la cantidad de resultados y el fin
 * del último.
 */
const fingerprint = `${results.length}:${Math.max(0, ...results.map(result => result.stop ?? 0))}`
const sameBatch =
  existsSync(FINGERPRINT) &&
  readFileSync(FINGERPRINT, "utf8").trim() === fingerprint

if (!sameBatch && existsSync(LATEST)) {
  rmSync(PREVIOUS, {recursive: true, force: true})
  cpSync(LATEST, PREVIOUS, {recursive: true})
}

const historySource = sameBatch ? PREVIOUS : LATEST

rmSync(resolve(RESULTS, "history"), {recursive: true, force: true})

if (existsSync(historySource)) {
  cpSync(historySource, resolve(RESULTS, "history"), {recursive: true})
}

// Número de tanda: las entradas que ya tiene el historial, más esta.
const trendFile = resolve(RESULTS, "history/history-trend.json")
const buildOrder =
  (existsSync(trendFile)
    ? JSON.parse(readFileSync(trendFile, "utf8")).length
    : 0) + 1

// 2. Metadata del dashboard.
const git = args => {
  const {stdout} = spawnSync("git", args, {cwd: ROOT, encoding: "utf8"})

  return stdout?.trim() || undefined
}
const commit = git(["rev-parse", "--short", "HEAD"])

writeAllure2Metadata(RESULTS, {
  environment: {
    Suite: "Appium + WebdriverIO (UI)",
    Corridas: `${runs} (nivel de bugs x plataforma)`,
    "Niveles de bugs": tiers.join(", "),
    Plataformas: platforms.map(platform => PLATFORM_NAMES[platform]).join(", "),
    Resultados: results.length,
    Commit: commit,
    Rama: git(["rev-parse", "--abbrev-ref", "HEAD"]),
  },
  executor: {
    name: "Appium + WebdriverIO",
    type: "appium",
    buildName: `Tanda ${buildOrder}${commit ? ` · ${commit}` : ""}`,
    buildOrder,
    reportName: REPORT_NAME,
  },
})

// 4. Reporte.
const generated = spawnSync(
  ALLURE,
  [
    "generate",
    RESULTS,
    "--clean",
    "-o",
    ALLURE_REPORT,
    "--report-name",
    REPORT_NAME,
    "--report-language",
    "es",
  ],
  {cwd: ROOT, stdio: "inherit"}
)

if (generated.status !== 0) {
  console.error(
    "\n[e2e-tiers-report] No se pudo generar el reporte (Allure necesita Java)."
  )
  process.exit(generated.status ?? 1)
}

rmSync(LATEST, {recursive: true, force: true})
mkdirSync(HISTORY_DIR, {recursive: true})

if (existsSync(resolve(ALLURE_REPORT, "history"))) {
  cpSync(resolve(ALLURE_REPORT, "history"), LATEST, {recursive: true})
}

writeFileSync(FINGERPRINT, `${fingerprint}\n`)

// Página de insights (no se abre sola: `bun run e2e:insights`).
const insights = spawnSync(
  "node",
  [resolve(ROOT, "scripts/e2e-insights.mjs"), RESULTS, INSIGHTS],
  {cwd: ROOT, stdio: "inherit"}
)

if (insights.status !== 0) {
  console.warn("[e2e-tiers-report] No se pudo generar la página de insights.")
}

console.log(
  "\n[e2e-tiers-report] Listo:\n" +
    `  Allure    ${ALLURE_REPORT.replace(`${ROOT}/`, "")}\n` +
    `  Insights  ${INSIGHTS.replace(`${ROOT}/`, "")}  (bun run e2e:insights)\n`
)

if (open) {
  spawn(ALLURE, ["open", ALLURE_REPORT], {cwd: ROOT, stdio: "inherit"})
}
