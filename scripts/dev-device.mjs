#!/usr/bin/env node
/**
 * Deja un dispositivo listo para probar la app con un bug tier dado.
 *
 *   bun run dev android hard     -> emulador Android + app con tier hard
 *   bun run dev ios easy         -> simulador iOS + app con tier easy
 *   bun run dev android off --no-build   -> reusa la app ya instalada
 *   bun run dev ios --boot-only          -> sólo deja el dispositivo listo
 *                                           (lo usa scripts/e2e-tiers.mjs)
 *
 * Pasos: valida los argumentos, arranca el dispositivo si no hay uno corriendo,
 * lo deja en condiciones (Android: animaciones y stylus), compila e instala la
 * app y levanta Metro con `--clear`. EXPO_PUBLIC_BUGS_TIER se inlinea en el
 * bundle, así que sin `--clear` Metro puede servir el tier anterior en caché.
 *
 * Variables opcionales: E2E_ANDROID_AVD (default Pixel_8_API_36) y
 * E2E_IOS_DEVICE (nombre o UDID, default iPhone 17 Pro).
 */
import {execFileSync, spawn, spawnSync} from "node:child_process"
import {existsSync} from "node:fs"
import {homedir} from "node:os"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TIERS = ["off", "easy", "medium", "hard"]
const PLATFORMS = ["android", "ios"]

const args = process.argv.slice(2)
const flags = args.filter(arg => arg.startsWith("-"))
const [platform, tier = "off"] = args.filter(arg => !arg.startsWith("-"))
const skipBuild = flags.includes("--no-build")
const bootOnly = flags.includes("--boot-only")

if (!PLATFORMS.includes(platform) || !TIERS.includes(tier)) {
  console.error(
    `Uso: bun run dev <${PLATFORMS.join("|")}> [${TIERS.join("|")}] [--no-build]`
  )
  process.exit(1)
}

if (platform === "ios" && process.platform !== "darwin") {
  console.error("iOS sólo corre en macOS.")
  process.exit(1)
}

const sleep = ms => new Promise(done => setTimeout(done, ms))
const log = message => console.log(`[dev] ${message}`)

const run = (command, commandArgs, options = {}) =>
  execFileSync(command, commandArgs, {encoding: "utf8", ...options})

const sdkRoot =
  process.env.ANDROID_SDK_ROOT ??
  process.env.ANDROID_HOME ??
  resolve(homedir(), "Library/Android/sdk")

const sdkTool = relative => {
  const path = resolve(sdkRoot, relative)
  return existsSync(path) ? path : relative.split("/").pop()
}

// Android -------------------------------------------------------------------

const runningEmulator = () =>
  run(sdkTool("platform-tools/adb"), ["devices"])
    .split("\n")
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .find(
      ([serial, state]) => serial?.startsWith("emulator-") && state === "device"
    )?.[0]

const ensureAndroid = async () => {
  let serial = runningEmulator()

  if (!serial) {
    const avd = process.env.E2E_ANDROID_AVD ?? "Pixel_8_API_36"
    log(`Arrancando el emulador ${avd}...`)

    spawn(sdkTool("emulator/emulator"), ["-avd", avd], {
      detached: true,
      stdio: "ignore",
    }).unref()

    for (let attempt = 0; attempt < 90 && !serial; attempt++) {
      await sleep(2000)
      serial = runningEmulator()
    }

    if (!serial) {
      console.error(`El emulador ${avd} no arrancó en 3 minutos.`)
      process.exit(1)
    }
  }

  const adb = sdkTool("platform-tools/adb")

  for (let attempt = 0; attempt < 90; attempt++) {
    const booted = run(adb, [
      "-s",
      serial,
      "shell",
      "getprop",
      "sys.boot_completed",
    ])
    if (booted.trim() === "1") break
    await sleep(2000)
  }

  log(`Emulador ${serial} listo. Preparándolo...`)
  execFileSync("node", ["scripts/e2e-android-prepare.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {...process.env, E2E_ANDROID_UDID: serial},
  })
}

// iOS -----------------------------------------------------------------------

const ensureIos = async () => {
  const wanted = process.env.E2E_IOS_DEVICE ?? "iPhone 17 Pro"
  const {devices} = JSON.parse(
    run("xcrun", ["simctl", "list", "devices", "available", "--json"])
  )

  const all = Object.values(devices).flat()
  const booted = all.find(device => device.state === "Booted")
  const target =
    booted ??
    all.find(device => device.udid === wanted || device.name === wanted)

  if (!target) {
    console.error(
      `No encuentro el simulador "${wanted}". Ver: xcrun simctl list devices`
    )
    process.exit(1)
  }

  if (target.state !== "Booted") {
    log(`Arrancando el simulador ${target.name}...`)
    run("xcrun", ["simctl", "boot", target.udid])
  }

  run("xcrun", ["simctl", "bootstatus", target.udid, "-b"])
  run("open", ["-a", "Simulator"])
  log(`Simulador ${target.name} listo.`)
}

// Expo ----------------------------------------------------------------------

const expo = (expoArgs, extraEnv) =>
  spawnSync(resolve(ROOT, "node_modules/.bin/expo"), expoArgs, {
    cwd: ROOT,
    stdio: "inherit",
    env: {...process.env, ...extraEnv, EXPO_PUBLIC_BUGS_TIER: tier},
  }).status ?? 1

if (platform === "android") {
  await ensureAndroid()
} else {
  await ensureIos()
}

if (bootOnly) {
  process.exit(0)
}

if (!skipBuild) {
  log(`Compilando e instalando (${platform}, tier ${tier})...`)
  const status = expo([`run:${platform}`, "--no-bundler"], {
    LANG: "en_US.UTF-8",
    LC_ALL: "en_US.UTF-8",
  })

  if (status !== 0) process.exit(status)
}

log(`Levantando Metro con tier ${tier} (Ctrl+C para cortar)...`)

const metro = spawn(
  resolve(ROOT, "node_modules/.bin/expo"),
  ["start", "--dev-client", "--clear"],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: {...process.env, EXPO_PUBLIC_BUGS_TIER: tier},
  }
)

metro.on("exit", code => process.exit(code ?? 0))

const metroUp = async () => {
  try {
    return (await fetch("http://localhost:8081/status")).ok
  } catch {
    return false
  }
}

while (!(await metroUp())) await sleep(1000)

// La app se lanzó durante el build, antes de que Metro existiera, y quedaría
// en blanco: se relanza ahora que hay bundler al que conectarse.
const APP_ID = "com.cocos.trading"

if (platform === "android") {
  const adb = sdkTool("platform-tools/adb")
  run(adb, ["shell", "am", "force-stop", APP_ID])
  run(adb, ["shell", "am", "start", "-n", `${APP_ID}/.MainActivity`])
} else {
  run("xcrun", [
    "simctl",
    "launch",
    "--terminate-running-process",
    "booted",
    APP_ID,
  ])
}

log("App relanzada. Metro sigue corriendo.")
