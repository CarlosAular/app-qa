import {resolve} from "node:path"

import {readBuildInfo} from "./buildInfo"
import {resolveIosDevice} from "./devices"
import {REPORTS_DIR, sharedConfig} from "./wdio.shared.conf"

process.env.E2E_PLATFORM = "ios"

const info = readBuildInfo("ios")
const device = resolveIosDevice()

export const config = {
  ...sharedConfig("ios"),

  capabilities: [
    {
      platformName: "iOS",
      "appium:automationName": "XCUITest",
      "appium:udid": device.udid,
      "appium:deviceName": device.name,
      "appium:app": info.appPath,
      "appium:bundleId": info.appId,

      "appium:noReset": false,
      "appium:fullReset": false,

      /** Misma razón que en Android: nunca correr contra un .app viejo. */
      "appium:enforceAppInstall": true,

      /** WebDriverAgent se compila en la primera sesión: 3-6 minutos en frío.
       *  El derivedDataPath fijo permite reutilizarlo entre corridas. */
      "appium:derivedDataPath": resolve(REPORTS_DIR, "wda-derived-data"),
      "appium:wdaLaunchTimeout": 300_000,
      "appium:wdaConnectionTimeout": 300_000,
      "appium:simulatorStartupTimeout": 300_000,
      "appium:newCommandTimeout": 300,

      /**
       * OBLIGATORIO para React Native en iOS.
       *
       * Con los valores por defecto, XCUITest devuelve el árbol TRUNCADO: 112
       * nodos, 100 de ellos `Other` anidados y CERO textos. La app se ve
       * perfecta en pantalla pero para la suite no existe nada que matchear.
       * La jerarquía de RN es muy profunda y el snapshot se corta antes de
       * llegar a las hojas. Con estos valores aparecen los textos y los labels.
       */
      "appium:snapshotMaxDepth": 120,
      "appium:customSnapshotTimeout": 60,

      /** Una app de RN con animaciones nunca queda "quieta": esperar la
       *  quiescencia agrega segundos a cada comando sin dar nada a cambio. */
      "appium:waitForQuiescence": false,
      /**
       * Lanzar WebDriverAgent con `simctl launch` en vez de con
       * `xcodebuild test-without-building`.
       *
       * En esta Mac (Xcode 26.6 / iOS 26.5) el camino de xcodebuild deja el
       * proceso de WDA corriendo en el simulador pero NUNCA abre el puerto
       * 8100: la sesión se queda esperando hasta el timeout. Con el runner ya
       * instalado, este modo lo arranca directo y evita ese camino por
       * completo. Es también más rápido en corridas repetidas.
       */
      "appium:usePreinstalledWDA": true,
      "appium:usePrebuiltWDA": false,
      "appium:shouldTerminateApp": true,
    },
  ],
}
