#!/usr/bin/env node
/**
 * Punto de entrada único de la suite.
 *
 *   bun run e2e            -> las dos plataformas, una después de la otra
 *   bun run e2e android    -> sólo Android
 *   bun run e2e ios        -> sólo iOS
 *
 * Verifica que exista el binario antes de arrancar, para fallar con un mensaje
 * útil en vez de con un error de sesión de Appium.
 */
import {spawnSync} from "node:child_process"
import {existsSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const requested = process.argv.slice(2).filter(arg => !arg.startsWith("-"))
const platforms = requested.length > 0 ? requested : ["android", "ios"]

const invalid = platforms.filter(
  platform => !["android", "ios"].includes(platform)
)

if (invalid.length > 0) {
  console.error(
    `Plataforma desconocida: ${invalid.join(", ")}. Usá android o ios.`
  )
  process.exit(1)
}

let failed = 0
let ran = 0

for (const platform of platforms) {
  const info = resolve(ROOT, `e2e/.build-info.${platform}.json`)

  if (!existsSync(info)) {
    console.error(
      `\n[e2e] Falta el binario de ${platform}.\n` +
        `      Compilalo con: bun run e2e:build:${platform}\n`
    )
    failed += 1
    continue
  }

  if (platform === "ios" && process.platform !== "darwin") {
    console.error("\n[e2e] iOS sólo corre en macOS. Salteando.\n")
    continue
  }

  if (platform === "android") {
    spawnSync("node", [resolve(ROOT, "scripts/e2e-android-prepare.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
    })
  }

  console.log(`\n[e2e] ===== ${platform.toUpperCase()} =====\n`)

  const result = spawnSync(
    "node",
    [
      resolve(ROOT, "node_modules/.bin/wdio"),
      "run",
      resolve(ROOT, `e2e/config/wdio.${platform}.conf.ts`),
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      // La primera plataforma limpia los resultados; la segunda se suma, para
      // que el reporte HTML final tenga las dos.
      env: {...process.env, ...(ran > 0 ? {E2E_APPEND_RESULTS: "1"} : {})},
    }
  )

  ran += 1

  if (result.status !== 0) {
    failed += 1
  }
}

process.exit(failed > 0 ? 1 : 0)
