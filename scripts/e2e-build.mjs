#!/usr/bin/env node
/**
 * Compila el binario de RELEASE contra el que corre la suite E2E.
 *
 * Por qué release y no debug:
 *   - Release embebe el bundle JS: la suite no depende de Metro.
 *   - No hay LogBox, que en debug tapa la barra de pestañas y se traga los
 *     toques (incluido "Operar ahora").
 *   - No hay dev menu ni fetch de expo-updates compitiendo con Appium.
 *
 * Por qué el candidate id se decide acá:
 *   EXPO_PUBLIC_CANDIDATE_ID se inlinea al bundlear, así que el tenant contra
 *   el que habla la app queda congelado en el binario. Este script lo genera,
 *   VERIFICA que haya quedado adentro del bundle y lo deja escrito en
 *   e2e/.build-info.<plataforma>.json para que el proceso de test apunte al
 *   mismo lugar.
 */
import {execFileSync, spawnSync} from "node:child_process"
import {existsSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {homedir} from "node:os"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_API = "https://dummy-api-topaz.vercel.app"

const log = message => console.log(`\x1b[36m[e2e-build]\x1b[0m ${message}`)
const warn = message => console.warn(`\x1b[33m[e2e-build]\x1b[0m ${message}`)

const die = message => {
  console.error(`\x1b[31m[e2e-build] ${message}\x1b[0m`)
  process.exit(1)
}

const run = (command, args, options = {}) => {
  log(`$ ${command} ${args.join(" ")}`)

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: {...process.env, ...options.env},
    stdio: "inherit",
  })

  if (result.status !== 0) {
    die(`Falló: ${command} ${args.join(" ")}`)
  }
}

const capture = (command, args, options = {}) => {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return ""
  }
}

// ---------------------------------------------------------------- entorno ---

const readDotEnv = () => {
  const path = resolve(ROOT, ".env")

  if (!existsSync(path)) {
    return {}
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(line => {
        const index = line.indexOf("=")
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      })
  )
}

const gitSha = () =>
  capture("git", ["rev-parse", "--short=7", "HEAD"]) || "nogit"

/**
 * Un candidate id nuevo por build es una cuenta virgen: equivale a resetear
 * sin usar POST /reset, que la consigna prohíbe.
 *
 * En CI lleva run_attempt porque run_id NO cambia al re-correr un job, y un
 * re-run heredaría el tenant ya ensuciado por el intento anterior.
 */
const buildCandidateId = platform => {
  if (process.env.E2E_CANDIDATE_ID) {
    return process.env.E2E_CANDIDATE_ID
  }

  if (process.env.GITHUB_RUN_ID) {
    const attempt = process.env.GITHUB_RUN_ATTEMPT ?? "1"
    return `ci-${gitSha()}-${process.env.GITHUB_RUN_ID}-${attempt}-${platform}`
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)

  return `local-${gitSha()}-${stamp}-${platform}`
}

const reuseCandidateId = platform => {
  const path = resolve(ROOT, `e2e/.build-info.${platform}.json`)

  if (!existsSync(path)) {
    die(`Pediste --reuse pero no existe ${path}. Compilá sin --reuse primero.`)
  }

  return JSON.parse(readFileSync(path, "utf8")).candidateId
}

// -------------------------------------------------------------------- JDK ---

/**
 * `java_home -v 17` miente: en esta Mac devuelve el Java 8 del plugin de applets
 * con exit code 0. Hay que preguntarle la versión al binario, no al path.
 */
const javaMajorVersion = javaHome => {
  const binary = resolve(javaHome, "bin/java")

  if (!existsSync(binary)) {
    return 0
  }

  // `java -version` escribe en STDERR, no en stdout.
  const result = spawnSync(binary, ["-version"], {encoding: "utf8"})
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
  const match = output.match(/version "(\d+)(?:\.(\d+))?/)

  if (!match) {
    return 0
  }

  // "1.8.0_461" -> 8 · "17.0.20.1" -> 17
  return match[1] === "1" ? Number(match[2] ?? 0) : Number(match[1])
}

const resolveJavaHome = () => {
  const candidates = [
    process.env.JAVA_HOME,
    capture("/usr/libexec/java_home", ["-v", "21"]),
    capture("/usr/libexec/java_home", ["-v", "17"]),
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
  ].filter(Boolean)

  for (const candidate of candidates) {
    const major = javaMajorVersion(candidate)

    if (major >= 17) {
      return candidate
    }
  }

  die(
    "Gradle 9 necesita JDK 17 o superior y no encontré ninguno usable.\n" +
      `  Candidatos probados: ${candidates.join(", ") || "(ninguno)"}\n` +
      "  Instalalo con: brew install openjdk@17"
  )
}

// ---------------------------------------------------------------- Android ---

/** Gradle necesita ANDROID_HOME o un local.properties; acá no hay ninguno. */
const androidSdkRoot = () => {
  const candidates = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
    resolve(homedir(), "Library/Android/sdk"),
    "/usr/local/lib/android/sdk",
  ].filter(Boolean)

  const found = candidates.find(path =>
    existsSync(resolve(path, "platform-tools"))
  )

  if (!found) {
    die(
      "No encontré el SDK de Android.\n" +
        "  Definí ANDROID_HOME o instalá el SDK con Android Studio."
    )
  }

  return found
}

const adbPath = () => {
  const fromSdk = resolve(androidSdkRoot(), "platform-tools/adb")
  return existsSync(fromSdk) ? fromSdk : "adb"
}

/**
 * Compilar una sola ABI, la del emulador que va a correr los tests.
 * El proyecto pide cuatro; construir las otras tres es tiempo tirado.
 */
const androidAbi = () => {
  if (process.env.E2E_ANDROID_ABI) {
    return process.env.E2E_ANDROID_ABI
  }

  const fromDevice = capture(adbPath(), [
    "shell",
    "getprop",
    "ro.product.cpu.abi",
  ])

  if (fromDevice) {
    return fromDevice
  }

  return process.arch === "arm64" ? "arm64-v8a" : "x86_64"
}

const buildAndroid = env => {
  if (!existsSync(resolve(ROOT, "android/app/build.gradle"))) {
    log("No existe el proyecto nativo de Android: corriendo expo prebuild.")
    run("bunx", ["expo", "prebuild", "-p", "android", "--no-install"], {env})
  }

  const abi = androidAbi()
  const javaHome = resolveJavaHome()
  const sdkRoot = androidSdkRoot()

  log(`ABI: ${abi}`)
  log(`JAVA_HOME: ${javaHome}`)
  log(`ANDROID_HOME: ${sdkRoot}`)

  /*
   * Forzar el re-bundling.
   *
   * Gradle decide si :app:createBundleReleaseJsAndAssets está al día mirando
   * archivos, y las EXPO_PUBLIC_* NO son inputs declarados de la tarea. Si no
   * se borra la salida, un build con un candidate id nuevo REUSA el bundle
   * viejo y la app termina hablando con el tenant anterior: el binario y las
   * aserciones quedarían midiendo cuentas distintas.
   */
  const generatedBundle = resolve(
    ROOT,
    "android/app/build/generated/assets/react/release"
  )

  if (existsSync(generatedBundle)) {
    log("Borrando el bundle generado para forzar el re-bundling.")
    rmSync(generatedBundle, {recursive: true, force: true})
  }

  /*
   * React Native pinea un NDK exacto en libs.versions.toml. Los runners de CI
   * traen otros, y si no coincide AGP se baja ~1 GB en cada corrida. El
   * workflow pasa el que ya está instalado por E2E_ANDROID_NDK.
   */
  const ndkOverride = process.env.E2E_ANDROID_NDK
    ? [`-PndkVersion=${process.env.E2E_ANDROID_NDK}`]
    : []

  run(
    "./gradlew",
    [
      ":app:assembleRelease",
      `-PreactNativeArchitectures=${abi}`,
      ...ndkOverride,
      "--console=plain",
    ],
    {
      cwd: resolve(ROOT, "android"),
      env: {
        ...env,
        ANDROID_HOME: sdkRoot,
        ANDROID_SDK_ROOT: sdkRoot,
        JAVA_HOME: javaHome,
        PATH: `${javaHome}/bin:${process.env.PATH}`,
      },
    }
  )

  const apk = resolve(
    ROOT,
    "android/app/build/outputs/apk/release/app-release.apk"
  )

  if (!existsSync(apk)) {
    die(`Gradle terminó bien pero no encontré el APK en ${apk}`)
  }

  return apk
}

const verifyAndroidBundle = (apk, candidateId) => {
  const result = spawnSync(
    "sh",
    [
      "-c",
      `unzip -p "${apk}" assets/index.android.bundle | grep -a -q -F "${candidateId}"`,
    ],
    {cwd: ROOT}
  )

  return result.status === 0
}

// -------------------------------------------------------------------- iOS ---

const buildIos = env => {
  if (!existsSync(resolve(ROOT, "ios/Cocos.xcworkspace"))) {
    log("No existe el proyecto nativo de iOS: corriendo expo prebuild.")
    run("bunx", ["expo", "prebuild", "-p", "ios", "--no-install"], {env})
  }

  if (!existsSync(resolve(ROOT, "ios/Pods/Manifest.lock"))) {
    log("Faltan los Pods: corriendo pod install.")
    // pod install muere por locale si no se fuerza UTF-8.
    run("pod", ["install"], {
      cwd: resolve(ROOT, "ios"),
      env: {...env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8"},
    })
  }

  const derivedData = resolve(ROOT, "e2e/reports/ios-derived-data")
  const arch = process.arch === "arm64" ? "arm64" : "x86_64"

  // Misma precaución que en Android: que no sobreviva un bundle de un build
  // anterior con otro candidate id.
  const previousApp = resolve(
    derivedData,
    "Build/Products/Release-iphonesimulator/Cocos.app"
  )

  if (existsSync(previousApp)) {
    rmSync(resolve(previousApp, "main.jsbundle"), {force: true})
  }

  run(
    "xcodebuild",
    [
      "-workspace",
      "ios/Cocos.xcworkspace",
      "-scheme",
      "Cocos",
      "-configuration",
      "Release",
      "-destination",
      "generic/platform=iOS Simulator",
      "-derivedDataPath",
      derivedData,
      `ARCHS=${arch}`,
      "ONLY_ACTIVE_ARCH=NO",
      "CODE_SIGNING_ALLOWED=NO",
      "-quiet",
      "build",
    ],
    {env: {...env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8"}}
  )

  const app = resolve(
    derivedData,
    "Build/Products/Release-iphonesimulator/Cocos.app"
  )

  if (!existsSync(app)) {
    die(`xcodebuild terminó bien pero no encontré el .app en ${app}`)
  }

  return app
}

const verifyIosBundle = (app, candidateId) => {
  const bundle = resolve(app, "main.jsbundle")

  if (!existsSync(bundle)) {
    die(
      `No hay main.jsbundle dentro de ${app}.\n` +
        "Eso significa que el build NO embebió el JS: revisá que la configuración sea Release."
    )
  }

  return (
    spawnSync("grep", ["-a", "-q", "-F", candidateId, bundle], {cwd: ROOT})
      .status === 0
  )
}

// ------------------------------------------------------------------- main ---

const main = () => {
  const platform = process.argv[2]
  const reuse = process.argv.includes("--reuse")

  if (platform !== "android" && platform !== "ios") {
    die("Uso: node scripts/e2e-build.mjs <android|ios> [--reuse]")
  }

  if (platform === "ios" && process.platform !== "darwin") {
    die("El binario de iOS sólo se puede compilar en macOS.")
  }

  const dotEnv = readDotEnv()
  const candidateId = reuse
    ? reuseCandidateId(platform)
    : buildCandidateId(platform)
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ?? dotEnv.EXPO_PUBLIC_API_URL ?? DEFAULT_API
  const bugsTier = process.env.EXPO_PUBLIC_BUGS_TIER ?? "off"

  if (bugsTier !== "off") {
    warn(
      `EXPO_PUBLIC_BUGS_TIER=${bugsTier}: la suite está calibrada para el golden path ("off").`
    )
  }

  const env = {
    EXPO_PUBLIC_API_URL: apiUrl,
    EXPO_PUBLIC_CANDIDATE_ID: candidateId,
    EXPO_PUBLIC_BUGS_TIER: bugsTier,
    // Ojo: NO mandar CI="" . El `getenv` de @expo/cli lo parsea como booleano
    // y una cadena vacía lo hace tirar "GetEnv.NoBoolean: is not a boolean",
    // que Gradle reporta sólo como "command 'node' finished with exit value 1".
    ...(process.env.CI ? {CI: process.env.CI} : {}),
  }

  log(`Plataforma : ${platform}`)
  log(`Candidate  : ${candidateId}${reuse ? " (reusado)" : " (cuenta virgen)"}`)
  log(`API        : ${apiUrl}`)

  const appPath = platform === "android" ? buildAndroid(env) : buildIos(env)

  const baked =
    platform === "android"
      ? verifyAndroidBundle(appPath, candidateId)
      : verifyIosBundle(appPath, candidateId)

  if (!baked) {
    die(
      `El candidate id "${candidateId}" NO quedó dentro del bundle.\n` +
        "La app lee EXPO_PUBLIC_CANDIDATE_ID en scope de módulo y tira si falta:\n" +
        "en release no hay LogBox, así que el síntoma sería una pantalla en blanco\n" +
        "y un error genérico de Appium. Revisá que el .env no esté pisando el valor."
    )
  }

  const info = {
    platform,
    candidateId,
    apiUrl,
    bugsTier,
    appPath,
    appId: "com.cocos.trading",
    arch: platform === "android" ? androidAbi() : process.arch,
    gitSha: gitSha(),
    builtAt: new Date().toISOString(),
  }

  const infoPath = resolve(ROOT, `e2e/.build-info.${platform}.json`)
  writeFileSync(infoPath, `${JSON.stringify(info, null, 2)}\n`)

  log(`Candidate id verificado dentro del bundle.`)
  log(`Binario    : ${appPath}`)
  log(`Build info : ${infoPath}`)
  log(`Listo. Ahora: bun run e2e:${platform}`)
}

main()
