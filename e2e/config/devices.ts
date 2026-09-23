import {execFileSync} from "node:child_process"
import {existsSync} from "node:fs"
import {homedir} from "node:os"
import {resolve} from "node:path"

export const androidSdkRoot = (): string => {
  const candidates = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
    resolve(homedir(), "Library/Android/sdk"),
    "/usr/local/lib/android/sdk",
  ].filter((path): path is string => Boolean(path))

  const found = candidates.find(path =>
    existsSync(resolve(path, "platform-tools"))
  )

  if (!found) {
    throw new Error(
      "No encontré el SDK de Android. Definí ANDROID_HOME o instalalo con Android Studio."
    )
  }

  return found
}

/**
 * El driver UiAutomator2 lee ANDROID_HOME del entorno del PROCESO DE APPIUM,
 * que hereda el del launcher de WDIO. En esta Mac no está exportado, así que la
 * config lo pone antes de que el servicio arranque.
 */
export const exportAndroidSdkEnv = () => {
  const sdkRoot = androidSdkRoot()

  process.env.ANDROID_HOME = sdkRoot
  process.env.ANDROID_SDK_ROOT = sdkRoot
  process.env.PATH = `${resolve(sdkRoot, "platform-tools")}:${process.env.PATH ?? ""}`

  return sdkRoot
}

/** `adb` no está en el PATH en esta Mac: se resuelve desde el SDK. */
export const adbPath = (): string => {
  if (process.env.ANDROID_ADB) {
    return process.env.ANDROID_ADB
  }

  const fromSdk = resolve(androidSdkRoot(), "platform-tools/adb")

  return existsSync(fromSdk) ? fromSdk : "adb"
}

/** Primer emulador o dispositivo Android en estado `device`. */
export const resolveAndroidUdid = (): string => {
  if (process.env.E2E_ANDROID_UDID) {
    return process.env.E2E_ANDROID_UDID
  }

  const output = execFileSync(adbPath(), ["devices"], {encoding: "utf8"})

  const serial = output
    .split("\n")
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .find(([, state]) => state === "device")?.[0]

  if (!serial) {
    throw new Error(
      "No hay ningún emulador Android corriendo. Arrancá uno:\n" +
        "  ~/Library/Android/sdk/emulator/emulator -avd Pixel_8_API_36"
    )
  }

  return serial
}

type SimctlDevice = {
  udid: string
  name: string
  state: string
  isAvailable?: boolean
}

/**
 * Elige el simulador de iOS en runtime.
 *
 * Nunca se hardcodea "iPhone 17 Pro / iOS 26.5": existe en esta Mac y hoy en
 * el runner macos-26, pero los runtimes rotan. Prefiere uno ya booteado y, si
 * no hay, el iPhone más nuevo disponible.
 */
export const resolveIosDevice = (): {
  udid: string
  name: string
  runtime: string
} => {
  if (process.env.E2E_IOS_UDID) {
    return {
      udid: process.env.E2E_IOS_UDID,
      name: process.env.E2E_IOS_DEVICE_NAME ?? "iPhone",
      runtime: process.env.E2E_IOS_RUNTIME ?? "",
    }
  }

  const raw = execFileSync(
    "xcrun",
    ["simctl", "list", "devices", "available", "--json"],
    {encoding: "utf8"}
  )

  const parsed = JSON.parse(raw) as {devices: Record<string, SimctlDevice[]>}

  const candidates = Object.entries(parsed.devices)
    .filter(([runtime]) => runtime.includes("SimRuntime.iOS-"))
    .flatMap(([runtime, devices]) =>
      devices
        .filter(
          device =>
            device.name.startsWith("iPhone") && device.isAvailable !== false
        )
        .map(device => ({
          udid: device.udid,
          name: device.name,
          state: device.state,
          runtime: runtime.replace(/.*SimRuntime\.iOS-/, "").replace(/-/g, "."),
        }))
    )

  if (candidates.length === 0) {
    throw new Error(
      "No hay ningún simulador de iPhone disponible en esta máquina."
    )
  }

  const booted = candidates.find(device => device.state === "Booted")

  if (booted) {
    return booted
  }

  const sortByRuntimeThenName = (
    a: (typeof candidates)[number],
    b: (typeof candidates)[number]
  ) =>
    a.runtime === b.runtime
      ? a.name.localeCompare(b.name)
      : a.runtime.localeCompare(b.runtime, undefined, {numeric: true})

  return [...candidates].sort(sortByRuntimeThenName).at(-1)!
}
