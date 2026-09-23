#!/usr/bin/env node
/**
 * Repara WebDriverAgent cuando Xcode y el runtime del simulador no coinciden.
 *
 * SÍNTOMA: la sesión de iOS se queda esperando para siempre y Appium termina
 * con "Failed to start the preinstalled WebDriverAgent". El proceso del runner
 * aparece corriendo en el simulador pero NUNCA abre el puerto 8100.
 *
 * CAUSA: el runner se compila con el toolchain de Xcode, que desde la 26.x
 * enlaza el stack de Swift Testing (`Testing.framework`, `_Testing_Foundation`,
 * etc.). Si el runtime del simulador instalado es de una versión ANTERIOR a la
 * de Xcode, esos frameworks no existen en el runtime y dyld no los encuentra:
 *
 *   dyld: Library not loaded: @rpath/_Testing_Foundation.framework/_Testing_Foundation
 *
 * En esta Mac: Xcode 26.6 con el único runtime iOS 26.5 instalado.
 *
 * EL ARREGLO DE FONDO es instalar el runtime que matchea el Xcode:
 *
 *   xcodebuild -downloadPlatform iOS
 *
 * (~8 GB, ~20 min). Este script es el parche mientras tanto: copia los
 * frameworks desde el platform de simulador de Xcode —donde sí existen— dentro
 * del bundle del runner, que es uno de los paths que dyld busca.
 *
 * Hay que volver a correrlo cada vez que Appium reconstruya o reinstale WDA.
 *
 * Uso: node scripts/e2e-ios-wda-fix.mjs [udid]
 */
import {execFileSync, spawnSync} from "node:child_process"
import {cpSync, existsSync, readdirSync, rmSync} from "node:fs"
import {homedir} from "node:os"
import {dirname, join, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const FRAMEWORKS = [
  "Testing",
  "_Testing_Foundation",
  "_Testing_CoreGraphics",
  "_Testing_CoreImage",
  "_Testing_UIKit",
]

const WDA_BUNDLE_ID = "com.facebook.WebDriverAgentRunner.xctrunner"
const RUNNER_APP = "WebDriverAgentRunner-Runner.app"

const log = message => console.log(`\x1b[36m[wda-fix]\x1b[0m ${message}`)

const die = message => {
  console.error(`\x1b[31m[wda-fix] ${message}\x1b[0m`)
  process.exit(1)
}

const developerDir = () =>
  execFileSync("xcode-select", ["-p"], {encoding: "utf8"}).trim()

const bootedUdid = () => {
  const raw = execFileSync(
    "xcrun",
    ["simctl", "list", "devices", "booted", "--json"],
    {encoding: "utf8"}
  )

  const {devices} = JSON.parse(raw)

  for (const list of Object.values(devices)) {
    const device = list.find(entry => entry.name.startsWith("iPhone"))

    if (device) {
      return device.udid
    }
  }

  die("No hay ningún simulador de iPhone booteado.")
}

/** Todos los bundles del runner: el instalado en el simulador y el compilado. */
const runnerBundles = udid => {
  const found = []

  const containers = join(
    homedir(),
    "Library/Developer/CoreSimulator/Devices",
    udid,
    "data/Containers/Bundle/Application"
  )

  if (existsSync(containers)) {
    for (const entry of readdirSync(containers)) {
      const candidate = join(containers, entry, RUNNER_APP)

      if (existsSync(candidate)) {
        found.push(candidate)
      }
    }
  }

  const products = resolve(ROOT, "e2e/reports/wda-derived-data/Build/Products")

  if (existsSync(products)) {
    for (const entry of readdirSync(products)) {
      const candidate = join(products, entry, RUNNER_APP)

      if (existsSync(candidate)) {
        found.push(candidate)
      }
    }
  }

  return found
}

const udid = process.argv[2] ?? bootedUdid()
const source = join(
  developerDir(),
  "Platforms/iPhoneSimulator.platform/Developer/Library/Frameworks"
)

if (!existsSync(source)) {
  die(`No encontré los frameworks de Xcode en ${source}`)
}

const bundles = runnerBundles(udid)

if (bundles.length === 0) {
  die(
    "No encontré ningún WebDriverAgentRunner-Runner.app.\n" +
      "Corré la suite de iOS una vez para que Appium lo compile e instale, y volvé a intentar."
  )
}

for (const bundle of bundles) {
  for (const framework of FRAMEWORKS) {
    const from = join(source, `${framework}.framework`)
    const to = join(bundle, "Frameworks", `${framework}.framework`)

    if (!existsSync(from)) {
      continue
    }

    rmSync(to, {recursive: true, force: true})
    cpSync(from, to, {recursive: true})
  }

  log(`Parchado: ${bundle}`)
}

spawnSync("xcrun", ["simctl", "terminate", udid, WDA_BUNDLE_ID], {
  stdio: "ignore",
})

log("Listo. Volvé a correr: bun run e2e:ios")
