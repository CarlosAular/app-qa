#!/usr/bin/env node
/**
 * Baja de Qase la metadata de los casos y la deja en e2e/data/qase-cases.json.
 *
 *   bun run qase:sync
 *
 * Los casos se crean y se editan primero en Qase; este script sólo LEE. El
 * reporte de la suite (scripts/e2e-tiers-report.mjs) usa el archivo para
 * etiquetar cada resultado con su severidad, prioridad, capa y riesgo, así que
 * se versiona: el reporte se puede regenerar sin red.
 *
 * Los enums de la API de Qase vienen numerados; la tabla de abajo se verificó
 * contra QQL (por ejemplo severity = "major" devuelve los casos con id 3).
 * Un id que no esté en la tabla queda en null en vez de adivinarse.
 *
 * Token: QASE_TESTOPS_API_TOKEN del entorno o del .env (nunca se imprime).
 * Proyecto: QASE_TESTOPS_PROJECT, por defecto COCOS.
 */
import {spawnSync} from "node:child_process"
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUTPUT = resolve(ROOT, "e2e/data/qase-cases.json")
const PAGE_SIZE = 100

const SEVERITY = {
  1: "blocker",
  2: "critical",
  3: "major",
  4: "normal",
  5: "minor",
  6: "trivial",
}
const PRIORITY = {1: "high", 2: "medium", 3: "low"}
const LAYER = {1: "e2e", 2: "api", 3: "unit"}
const BEHAVIOR = {2: "positive", 3: "negative", 4: "destructive"}
const AUTOMATION = {0: "manual", 1: "to-be-automated", 2: "automated"}

const readToken = () => {
  if (process.env.QASE_TESTOPS_API_TOKEN) {
    return process.env.QASE_TESTOPS_API_TOKEN
  }

  const envFile = resolve(ROOT, ".env")

  if (!existsSync(envFile)) {
    return undefined
  }

  return /^\s*QASE_TESTOPS_API_TOKEN\s*=\s*(\S+)/m
    .exec(readFileSync(envFile, "utf8"))?.[1]
    ?.replace(/^["']|["']$/g, "")
}

const token = readToken()
const project = process.env.QASE_TESTOPS_PROJECT ?? "COCOS"

if (!token) {
  console.error(
    "[qase-sync] No encuentro QASE_TESTOPS_API_TOKEN ni en el entorno ni en " +
      "el .env (ver .env.example)."
  )
  process.exit(1)
}

const fetchPage = async offset => {
  const response = await fetch(
    `https://api.qase.io/v1/case/${project}?limit=${PAGE_SIZE}&offset=${offset}`,
    {headers: {Token: token, Accept: "application/json"}}
  )

  if (!response.ok) {
    throw new Error(`Qase respondió ${response.status} ${response.statusText}`)
  }

  return (await response.json()).result
}

const cases = []

for (let offset = 0; ; offset += PAGE_SIZE) {
  const page = await fetchPage(offset)

  cases.push(...page.entities)

  if (offset + PAGE_SIZE >= page.total) {
    break
  }
}

const tagsOf = entity => (entity.tags ?? []).map(tag => tag.title)

const metadata = Object.fromEntries(
  cases
    .sort((a, b) => a.id - b.id)
    .map(entity => {
      const tags = tagsOf(entity)

      return [
        entity.id,
        {
          title: entity.title,
          severity: SEVERITY[entity.severity] ?? null,
          priority: PRIORITY[entity.priority] ?? null,
          layer: LAYER[entity.layer] ?? null,
          behavior: BEHAVIOR[entity.behavior] ?? null,
          automation: AUTOMATION[entity.automation] ?? null,
          risks: tags
            .filter(tag => tag.startsWith("riesgo:"))
            .map(tag => tag.slice("riesgo:".length)),
          tags,
        },
      ]
    })
)

mkdirSync(dirname(OUTPUT), {recursive: true})
writeFileSync(OUTPUT, `${JSON.stringify(metadata, null, 2)}\n`)

// El repo exige prettier (bun run format:check): el archivo sale ya formateado.
spawnSync(resolve(ROOT, "node_modules/.bin/prettier"), ["--write", OUTPUT], {
  cwd: ROOT,
  stdio: "ignore",
})

console.log(
  `[qase-sync] ${cases.length} casos de ${project} -> ` +
    OUTPUT.replace(`${ROOT}/`, "")
)
