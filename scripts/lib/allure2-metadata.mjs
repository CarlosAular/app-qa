/**
 * Archivos de metadata que Allure 2 lee del directorio de resultados y con los
 * que llena los widgets del dashboard:
 *
 *   categories.json      Categories: tipos de fallo (ver failure-categories.mjs)
 *   environment.xml      Environment: de dónde salen los resultados
 *   executor.json        Executors: quién los generó y qué número de tanda es
 *
 * environment.xml y no environment.properties: el formato .properties de Java
 * no admite acentos sin escapar y el XML se lee siempre como UTF-8.
 */
import {writeFileSync} from "node:fs"
import {resolve} from "node:path"

import {allure2Categories} from "./failure-categories.mjs"

const xml = value =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

/** environment.xml a partir de un objeto {clave: valor}; omite los vacíos. */
export const environmentXml = variables =>
  `<?xml version="1.0" encoding="UTF-8"?>
<environment>
${Object.entries(variables)
  .filter(([, value]) => value !== undefined && value !== "")
  .map(
    ([key, value]) =>
      `  <parameter><key>${xml(key)}</key><value>${xml(value)}</value></parameter>`
  )
  .join("\n")}
</environment>
`

/** Escribe las tres piezas en el directorio de resultados. */
export const writeAllure2Metadata = (directory, {environment, executor}) => {
  writeFileSync(
    resolve(directory, "categories.json"),
    JSON.stringify(allure2Categories(), null, 2)
  )
  writeFileSync(
    resolve(directory, "environment.xml"),
    environmentXml(environment)
  )
  writeFileSync(
    resolve(directory, "executor.json"),
    JSON.stringify(executor, null, 2)
  )
}
