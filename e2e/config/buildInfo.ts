import {readFileSync, existsSync} from "node:fs"
import {resolve} from "node:path"

import {E2E_ROOT} from "./paths"

export type E2ePlatform = "android" | "ios"

/**
 * Written by scripts/e2e-build.mjs at build time.
 *
 * EXPO_PUBLIC_CANDIDATE_ID is inlined into the JS bundle, so the tenant the app
 * talks to is frozen when the binary is produced. This file is how the test
 * process learns which tenant that was: it is never recomputed on the test side,
 * because the binary could not follow.
 */
export type BuildInfo = {
  platform: E2ePlatform
  candidateId: string
  apiUrl: string
  bugsTier: string
  appPath: string
  appId: string
  arch: string
  gitSha: string
  builtAt: string
}

export const buildInfoPath = (platform: E2ePlatform) =>
  resolve(E2E_ROOT, `.build-info.${platform}.json`)

export const readBuildInfo = (platform: E2ePlatform): BuildInfo => {
  const path = buildInfoPath(platform)

  if (!existsSync(path)) {
    throw new Error(
      [
        `No encontré ${path}.`,
        `Compilá el binario primero: bun run e2e:build:${platform}`,
      ].join("\n")
    )
  }

  const info = JSON.parse(readFileSync(path, "utf8")) as BuildInfo

  if (!info.candidateId || !info.apiUrl || !info.appPath) {
    throw new Error(
      `${path} está incompleto. Volvé a correr e2e:build:${platform}.`
    )
  }

  if (!existsSync(info.appPath)) {
    throw new Error(
      [
        `El build-info apunta a ${info.appPath}, que ya no existe.`,
        `Volvé a correr: bun run e2e:build:${platform}`,
      ].join("\n")
    )
  }

  return info
}
