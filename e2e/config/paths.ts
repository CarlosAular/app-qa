import {mkdirSync, rmSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

/**
 * tsx transpila los archivos de config a CommonJS, donde `import.meta.dirname`
 * es undefined. Este módulo resuelve la raíz de la suite en los dos mundos.
 */
const here =
  typeof __dirname === "string"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))

export const E2E_ROOT = resolve(here, "..")
export const REPORTS_DIR = resolve(E2E_ROOT, "reports")

/** El servicio de Appium escribe su log antes de que WDIO cree el outputDir. */
export const ensureReportsDir = () => {
  mkdirSync(REPORTS_DIR, {recursive: true})
  return REPORTS_DIR
}

/**
 * Vacía los resultados de la corrida anterior.
 *
 * Allure y JUnit ACUMULAN: sin esto el reporte HTML mezcla corridas viejas con
 * la actual y el conteo deja de significar nada. Se saltea cuando
 * E2E_APPEND_RESULTS=1, que es lo que pone scripts/e2e-run.mjs al encadenar la
 * segunda plataforma para que el reporte final tenga las dos.
 */
export const clearPreviousResults = () => {
  if (process.env.E2E_APPEND_RESULTS === "1") {
    return
  }

  for (const dir of ["allure-results", "allure", "junit", "qase-report"]) {
    rmSync(resolve(REPORTS_DIR, dir), {recursive: true, force: true})
  }

  mkdirSync(REPORTS_DIR, {recursive: true})
}
