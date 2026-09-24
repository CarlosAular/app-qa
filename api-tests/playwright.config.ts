import {defineConfig} from "@playwright/test"
import path from "node:path"

import type {BugsTier} from "./fixtures"

// `bun run` lee el .env pero no se lo pasa al proceso hijo: se carga acá para que
// QASE_TESTOPS_API_TOKEN llegue al reporter. No pisa variables ya exportadas.
try {
  process.loadEnvFile(path.join(__dirname, "../.env"))
} catch {
  // Sin .env: se usan las variables del entorno.
}

const TIERS: BugsTier[] = ["off", "easy", "medium", "hard"]

const requested = (process.env.API_TIERS ?? "off")
  .split(",")
  .map(tier => tier.trim().toLowerCase())
  .filter((tier): tier is BugsTier => TIERS.includes(tier as BugsTier))

const defects = process.env.API_DEFECTS === "1"
const tiersLabel = (requested.length ? requested : ["off"]).join("+")

/*
 * Qase. Igual que los E2E: apagado por defecto (QASE_MODE=off) y se publica con
 * QASE_MODE=testops + QASE_TESTOPS_API_TOKEN. Se configura por variables de
 * entorno porque tienen precedencia sobre el qase.config.json de la raíz, que es
 * el de Appium (título "Appium E2E") y pisaría las opciones del reporter.
 */
process.env.QASE_MODE ??= "off"
process.env.QASE_TESTOPS_PROJECT ??= "COCOS"
process.env.QASE_TESTOPS_RUN_TITLE ??=
  `Playwright API · tier ${tiersLabel}` +
  (defects ? " · defectos conocidos" : "")
process.env.QASE_TESTOPS_RUN_COMPLETE ??= "true"
process.env.QASE_REPORT_DRIVER ??= "local"
process.env.QASE_REPORT_CONNECTION_PATH ??= path.join(
  __dirname,
  "reports/qase-report"
)
process.env.QASE_REPORT_CONNECTION_FORMAT ??= "json"

/**
 * Suite de API separada de la de UI (Appium). Por defecto corre sólo el tier
 * `off` (golden path, línea base que debe pasar en verde). Los otros tiers
 * inyectan bugs a propósito: se corren con API_TIERS=off,easy,medium,hard y ahí
 * los fallos SON los hallazgos.
 */
export default defineConfig<{tier: BugsTier}>({
  testDir: "./specs",
  testMatch: "**/*.api.ts",
  // Los tests @defecto afirman el comportamiento correcto y hoy fallan a propósito:
  // no van en la corrida base, sólo con API_DEFECTS=1 (bun run test:api:defectos).
  ...(defects ? {grep: /@defecto/} : {grepInvert: /@defecto/}),
  outputDir: "./reports/test-output",
  fullyParallel: true,
  retries: 0,
  timeout: 30_000,
  expect: {timeout: 10_000},
  reporter: [
    ["list"],
    ["junit", {outputFile: "./reports/junit/results.xml"}],
    ["playwright-qase-reporter", {}],
    [
      "allure-playwright",
      {
        resultsDir: path.join(__dirname, "reports/allure-results"),
        detail: true,
      },
    ],
  ],
  use: {
    baseURL: process.env.API_URL ?? "https://dummy-api-topaz.vercel.app",
  },
  projects: (requested.length ? requested : (["off"] as BugsTier[])).map(
    tier => ({name: `tier-${tier}`, use: {tier}})
  ),
})
