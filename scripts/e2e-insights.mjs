#!/usr/bin/env node
/**
 * Genera la página de insights de la suite E2E (HTML autocontenido).
 *
 *   node scripts/e2e-insights.mjs <allure-results> <salida.html> [--open]
 *   bun run e2e:insights          -> la arma con las últimas corridas y la abre
 *
 * También la arma scripts/e2e-tiers-report.mjs, sin abrirla.
 * El análisis (matriz de detección, ruido de la línea base, fallos, riesgos,
 * tiempos) vive en scripts/lib/insights-model.mjs.
 */
import {execFileSync, spawn} from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import {renderInsights} from "./lib/insights-html.mjs"
import {buildInsights} from "./lib/insights-model.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CASES = resolve(ROOT, "e2e/data/qase-cases.json")

const [resultsDir, output] = process.argv
  .slice(2)
  .filter(arg => !arg.startsWith("--"))

if (!resultsDir || !output) {
  console.error(
    "Uso: node scripts/e2e-insights.mjs <allure-results> <salida.html>"
  )
  process.exit(1)
}

const results = readdirSync(resultsDir)
  .filter(file => file.endsWith("-result.json"))
  .map(file => JSON.parse(readFileSync(resolve(resultsDir, file), "utf8")))

const cases = existsSync(CASES) ? JSON.parse(readFileSync(CASES, "utf8")) : {}

const commit = (() => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return undefined
  }
})()

const insights = buildInsights(results, cases)

if (insights.rows.length === 0) {
  console.error(
    "[e2e-insights] No hay resultados con nivel y plataforma: ¿se corrió " +
      "scripts/e2e-tiers.mjs?"
  )
  process.exit(1)
}

mkdirSync(dirname(output), {recursive: true})
writeFileSync(
  output,
  renderInsights(insights, {
    generatedAt: new Date().toLocaleString("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    commit,
  })
)

console.log(
  `[e2e-insights] ${insights.tests.length} tests, ${insights.rows.length} ` +
    `resultados -> ${output.replace(`${ROOT}/`, "")}`
)

if (process.argv.includes("--open")) {
  const opener = process.platform === "darwin" ? "open" : "xdg-open"

  spawn(opener, [resolve(output)], {stdio: "ignore", detached: true}).unref()
}
