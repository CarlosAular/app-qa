#!/usr/bin/env node
/**
 * Corre la suite de UI en las dos plataformas y en los cuatro niveles de
 * defectos de la API, en serie, y publica cada corrida en Qase.
 *
 *   bun run publish:e2e:tiers                  -> off, easy, medium y hard x android e ios
 *   bun run publish:e2e:tiers -- --dry-run     -> muestra el plan sin correr nada
 *   bun run publish:e2e:tiers -- --tiers=off,hard --platforms=android
 *
 * Antes de cada corrida levanta el emulador de Android o el simulador de iOS si
 * no están corriendo (la misma lógica de `bun run dev`, con --boot-only).
 *
 * Orden: por nivel, y dentro de cada nivel Android y luego iOS. El nivel queda
 * compilado en el binario (EXPO_PUBLIC_BUGS_TIER), así que cada nivel recompila
 * las dos apps (scripts/e2e-run.mjs --build lo hace solo). Son 8 corridas y 8
 * builds: cuenta con varias horas.
 *
 * Cada corrida es un run propio en Qase, titulado "Appium E2E · <plataforma> ·
 * <nivel>", con las etiquetas <nivel> y <plataforma> (off, easy, medium o
 * hard, y android o ios) para filtrarlos en Qase.
 * Un nivel que falla no corta el resto: en easy, medium y hard los fallos son
 * hallazgos. Al final imprime el resumen y sale con código 1 si
 * alguna corrida no terminó en verde.
 */
import {spawnSync} from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const ALL_TIERS = ["off", "easy", "medium", "hard"]
const ALL_PLATFORMS = ["android", "ios"]

const option = name =>
  process.argv
    .find(arg => arg.startsWith(`--${name}=`))
    ?.split("=")[1]
    .split(",")
    .filter(Boolean)

const tiers = option("tiers") ?? ALL_TIERS
const platforms = option("platforms") ?? ALL_PLATFORMS
const dryRun = process.argv.includes("--dry-run")

const invalid = [
  ...tiers.filter(tier => !ALL_TIERS.includes(tier)),
  ...platforms.filter(platform => !ALL_PLATFORMS.includes(platform)),
]

if (invalid.length > 0) {
  console.error(
    `Valor desconocido: ${invalid.join(", ")}. ` +
      `Niveles: ${ALL_TIERS.join(", ")}. Plataformas: ${ALL_PLATFORMS.join(", ")}.`
  )
  process.exit(1)
}

const plan = tiers.flatMap(tier =>
  platforms.map(platform => ({tier, platform}))
)

console.log(`\n[e2e-tiers] ${plan.length} corridas, en este orden:`)
plan.forEach(({tier, platform}, index) =>
  console.log(`  ${index + 1}. ${platform} · ${tier}`)
)

if (dryRun) {
  process.exit(0)
}

// El token lo lee el reporter de Qase del .env, igual que en `publish:api`. Acá
// sólo se avisa si no está en ningún lado, antes de perder horas de corrida.
const tokenInEnvFile = existsSync(resolve(ROOT, ".env"))
  ? /^\s*QASE_TESTOPS_API_TOKEN\s*=\s*\S/m.test(
      readFileSync(resolve(ROOT, ".env"), "utf8")
    )
  : false

if (!process.env.QASE_TESTOPS_API_TOKEN && !tokenInEnvFile) {
  console.error(
    "\n[e2e-tiers] No encuentro QASE_TESTOPS_API_TOKEN ni en el entorno ni " +
      "en el .env. Agregalo al .env (ver .env.example).\n"
  )
  process.exit(1)
}

const ALLURE_SOURCE = resolve(ROOT, "e2e/reports/allure-results")
const ALL_RUNS_DIR = resolve(ROOT, "e2e/reports/todas-las-corridas")
const ALL_RUNS_RESULTS = resolve(ALL_RUNS_DIR, "allure-results")

/**
 * e2e-run limpia los resultados de Allure al empezar cada corrida, y los tests
 * se llaman igual en todas: mezclarlos tal cual los mostraría como reintentos
 * de un mismo test. Se copian a un directorio común reescribiendo dos cosas:
 * el árbol de suites pasa a ser nivel > plataforma > suite original (el nivel
 * de defectos es lo que distingue las corridas) y el historyId lleva el sufijo de la corrida.
 */
const mergeAllureResults = (platform, tier) => {
  if (!existsSync(ALLURE_SOURCE)) {
    return
  }

  mkdirSync(ALL_RUNS_RESULTS, {recursive: true})

  for (const file of readdirSync(ALLURE_SOURCE)) {
    const from = resolve(ALLURE_SOURCE, file)
    const to = resolve(ALL_RUNS_RESULTS, file)

    if (!file.endsWith("-result.json")) {
      copyFileSync(from, to)
      continue
    }

    const result = JSON.parse(readFileSync(from, "utf8"))
    const labels = result.labels ?? []
    const original = labels.find(label => label.name === "parentSuite")?.value

    result.labels = [
      ...labels.filter(
        label => !["parentSuite", "suite", "subSuite"].includes(label.name)
      ),
      {name: "parentSuite", value: tier},
      {name: "suite", value: platform},
      ...(original ? [{name: "subSuite", value: original}] : []),
      {name: "tag", value: tier},
      {name: "tag", value: platform},
    ]
    result.historyId = `${result.historyId}-${platform}-${tier}`

    writeFileSync(to, JSON.stringify(result))
  }
}

if (!dryRun) {
  rmSync(ALL_RUNS_DIR, {recursive: true, force: true})
}

const results = []

for (const {tier, platform} of plan) {
  const title = `Appium E2E · ${platform} · ${tier}`

  console.log(`\n[e2e-tiers] ===== ${title} =====\n`)

  // Levanta el emulador o el simulador si no está corriendo, como `bun run dev`.
  const boot = spawnSync(
    "node",
    [resolve(ROOT, "scripts/dev-device.mjs"), platform, tier, "--boot-only"],
    {cwd: ROOT, stdio: "inherit"}
  )

  if (boot.status !== 0) {
    console.error(
      `[e2e-tiers] No se pudo levantar el dispositivo de ${platform}.`
    )
    results.push({title, ok: false})
    continue
  }

  const result = spawnSync(
    "node",
    [resolve(ROOT, "scripts/e2e-run.mjs"), platform, "--build"],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        QASE_MODE: "testops",
        EXPO_PUBLIC_BUGS_TIER: tier,
        QASE_TESTOPS_RUN_TITLE: title,
        // Etiquetas del run en Qase: el nivel (off, easy, medium, hard) y la
        // plataforma, para filtrar la lista de runs por cualquiera de los dos.
        QASE_TESTOPS_RUN_TAGS: `${tier},${platform}`,
        QASE_TESTOPS_RUN_DESCRIPTION: `Suite de UI (Appium) en ${platform}, nivel de defectos ${tier}.`,
      },
    }
  )

  mergeAllureResults(platform, tier)

  results.push({title, ok: result.status === 0})
}

console.log("\n[e2e-tiers] Resumen")
results.forEach(({title, ok}) =>
  console.log(`  ${ok ? "verde " : "fallos"}  ${title}`)
)

if (existsSync(ALL_RUNS_RESULTS)) {
  const report = resolve(ALL_RUNS_DIR, "allure")
  const allure = resolve(ROOT, "node_modules/.bin/allure")

  const generated = spawnSync(
    allure,
    ["generate", ALL_RUNS_RESULTS, "--clean", "-o", report],
    {cwd: ROOT, stdio: "inherit"}
  )

  console.log(
    generated.status === 0
      ? "\n[e2e-tiers] Reporte de Allure con todas las corridas: bun run e2e:report:tiers"
      : "\n[e2e-tiers] No se pudo generar el reporte (Allure necesita Java). " +
          "Los resultados quedaron en e2e/reports/todas-las-corridas/allure-results."
  )
}

process.exit(results.every(({ok}) => ok) ? 0 : 1)
