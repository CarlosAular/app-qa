import {readBuildInfo} from "./buildInfo"
import {exportAndroidSdkEnv, resolveAndroidUdid} from "./devices"
import {sharedConfig} from "./wdio.shared.conf"

process.env.E2E_PLATFORM = "android"
exportAndroidSdkEnv()

const info = readBuildInfo("android")
const udid = resolveAndroidUdid()

export const config = {
  ...sharedConfig("android"),

  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:udid": udid,
      "appium:app": info.appPath,
      "appium:appPackage": info.appId,
      "appium:appActivity": ".MainActivity",
      "appium:appWaitActivity": "*",

      /** Cuenta limpia del lado de la app en cada sesión. El estado del
       *  servidor no se toca: de eso se ocupan las aserciones por delta. */
      "appium:noReset": false,
      "appium:fullReset": false,

      /**
       * OBLIGATORIO. Sin esto, si el emulador ya tiene com.cocos.trading
       * instalado (por ejemplo de un `bun run android`), Appium NO reinstala y
       * la suite corre contra el binario viejo: una build de debug sin Metro
       * que muestra una pantalla en blanco, o peor, un release con OTRO
       * candidate id horneado.
       */
      "appium:enforceAppInstall": true,

      "appium:autoGrantPermissions": true,
      "appium:disableWindowAnimation": true,
      "appium:newCommandTimeout": 300,
      "appium:androidInstallTimeout": 180_000,
      "appium:uiautomator2ServerInstallTimeout": 120_000,
      "appium:adbExecTimeout": 120_000,
      "appium:ignoreHiddenApiPolicyError": true,
    },
  ],
}
