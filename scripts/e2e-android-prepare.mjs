#!/usr/bin/env node
/**
 * Deja el emulador Android en condiciones para Appium.
 *
 * Todas estas trampas están verificadas en este proyecto:
 *   - El diálogo "Try out your stylus" se come el PRIMER texto que se tipea.
 *   - El teclado por hardware deja el IME visible y tapa el botón de enviar.
 *   - Las animaciones hacen fallar los waits por elementos a medio dibujar.
 */
import {execFileSync} from "node:child_process"
import {existsSync} from "node:fs"
import {homedir} from "node:os"
import {resolve} from "node:path"

const adb = () => {
  const sdk =
    process.env.ANDROID_SDK_ROOT ??
    process.env.ANDROID_HOME ??
    resolve(homedir(), "Library/Android/sdk")

  const fromSdk = resolve(sdk, "platform-tools/adb")
  return existsSync(fromSdk) ? fromSdk : "adb"
}

const serial = () => {
  if (process.env.E2E_ANDROID_UDID) {
    return process.env.E2E_ANDROID_UDID
  }

  const output = execFileSync(adb(), ["devices"], {encoding: "utf8"})

  const found = output
    .split("\n")
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .find(([, state]) => state === "device")?.[0]

  if (!found) {
    console.error(
      "No hay ningún emulador corriendo. Arrancá uno:\n" +
        "  ~/Library/Android/sdk/emulator/emulator -avd Pixel_8_API_36"
    )
    process.exit(1)
  }

  return found
}

const device = serial()

const settings = [
  ["secure", "stylus_handwriting_enabled", "0"],
  ["secure", "show_ime_with_hard_keyboard", "0"],
  ["global", "window_animation_scale", "0"],
  ["global", "transition_animation_scale", "0"],
  ["global", "animator_duration_scale", "0"],
]

for (const [namespace, key, value] of settings) {
  execFileSync(
    adb(),
    ["-s", device, "shell", "settings", "put", namespace, key, value],
    {
      stdio: "inherit",
    }
  )
}

// Despierta la pantalla y saca el keyguard, que se traga el primer tap.
execFileSync(adb(), ["-s", device, "shell", "input", "keyevent", "82"], {
  stdio: "inherit",
})

console.log(`[e2e] Emulador ${device} preparado.`)
