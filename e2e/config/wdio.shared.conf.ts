import allureReporter from "@wdio/allure-reporter"
import {resolve} from "node:path"

import WDIOQaseReporter, {
  afterRunHook,
  beforeRunHook,
  qase,
} from "wdio-qase-reporter"

import type {E2ePlatform} from "./buildInfo"
import {
  E2E_ROOT,
  REPORTS_DIR,
  clearPreviousResults,
  ensureReportsDir,
} from "./paths"

export {E2E_ROOT, REPORTS_DIR}

/**
 * Orden explícito, no glob.
 *
 * Todos los specs de una corrida comparten el MISMO tenant (el candidate id
 * queda horneado en el binario), así que el orden es parte del contrato y no
 * puede quedar a merced de cómo ordene el sistema de archivos.
 */
export const SPECS = [
  resolve(E2E_ROOT, "specs/01-market-buy.e2e.ts"),
  resolve(E2E_ROOT, "specs/02-amount-pesos.e2e.ts"),
  resolve(E2E_ROOT, "specs/03-ticket-validation.e2e.ts"),
  resolve(E2E_ROOT, "specs/04-sell-partial.e2e.ts"),
  resolve(E2E_ROOT, "specs/05-order-history.e2e.ts"),
  resolve(E2E_ROOT, "specs/06-search.e2e.ts"),
  resolve(E2E_ROOT, "specs/07-market-catalog.e2e.ts"),
  resolve(E2E_ROOT, "specs/08-ticket-setup.e2e.ts"),
  resolve(E2E_ROOT, "specs/09-ticket-limit-pricing.e2e.ts"),
  resolve(E2E_ROOT, "specs/10-ticket-non-stock.e2e.ts"),
  resolve(E2E_ROOT, "specs/11-order-integrity.e2e.ts"),
  resolve(E2E_ROOT, "specs/12-order-resubmission.e2e.ts"),
  resolve(E2E_ROOT, "specs/13-portfolio-derived.e2e.ts"),
  resolve(E2E_ROOT, "specs/14-account-behavior.e2e.ts"),
  // Último, a propósito: reinicia la cuenta compartida por toda la corrida.
  resolve(E2E_ROOT, "specs/15-account-reset.e2e.ts"),
]

export const sharedConfig = (platform: E2ePlatform) => {
  ensureReportsDir()

  /*
   * Qase.
   *
   * Local queda en "off" salvo que se exporte QASE_MODE=testops con su token.
   * La ruta del reporte local se fija por env porque tiene precedencia sobre
   * qase.config.json, que el reporter pisa con su default (build/qase-report).
   */
  process.env.QASE_MODE ??= "off"
  process.env.QASE_REPORT_CONNECTION_PATH ??= resolve(
    REPORTS_DIR,
    "qase-report"
  )
  process.env.QASE_REPORT_CONNECTION_FORMAT ??= "json"

  return {
    runner: "local" as const,
    specs: SPECS,
    tsConfigPath: resolve(E2E_ROOT, "tsconfig.json"),

    /**
     * Serial, a propósito. Los specs comparten tenant: paralelizar haría que
     * los deltas de efectivo y tenencias de un worker midan los movimientos de
     * otro.
     */
    maxInstances: 1,

    /**
     * Sin reintentos, también a propósito. Un spec que falla a mitad de camino
     * ya movió plata en el servidor; reintentarlo mediría deltas sobre una
     * cuenta distinta de la que fotografió.
     */
    specFileRetries: 0,

    logLevel: (process.env.E2E_LOG_LEVEL ?? "warn") as "warn",
    outputDir: REPORTS_DIR,
    bail: 0,
    waitforTimeout: 15_000,

    /*
     * Presupuesto para CREAR la sesión, no para los tests.
     *
     * En iOS la primera sesión compila WebDriverAgent desde cero, y cuando el
     * driver detecta un upgrade de módulo lo limpia y vuelve a empezar: medido
     * acá, 13 minutos entre el intento fallido y el bueno. Con 5 minutos WDIO
     * mataba la sesión justo cuando WDA estaba por levantar. Las corridas
     * siguientes reusan el derivedDataPath fijo y arrancan en ~30s.
     */
    connectionRetryTimeout: platform === "ios" ? 1_200_000 : 300_000,
    connectionRetryCount: 2,

    port: 4723,
    path: "/",

    services: [
      [
        "appium",
        {
          args: {
            address: "127.0.0.1",
            port: 4723,
            log: resolve(REPORTS_DIR, `appium-${platform}.log`),
            logTimestamp: true,
            logLevel: "info",
          },
        },
      ],
    ] as any,

    framework: "mocha" as const,
    mochaOpts: {
      ui: "bdd" as const,
      timeout: 300_000,
    },

    reporters: [
      "spec",
      [
        "junit",
        {
          outputDir: resolve(REPORTS_DIR, "junit"),
          outputFileFormat: () => `results-${platform}.xml`,
        },
      ],
      [
        "allure",
        {
          outputDir: resolve(REPORTS_DIR, "allure-results"),
          disableWebdriverStepsReporting: true,
          disableWebdriverScreenshotsReporting: false,
        },
      ],
      [
        WDIOQaseReporter,
        {
          disableWebdriverStepsReporting: true,
          disableWebdriverScreenshotsReporting: true,
          useCucumber: false,
        },
      ],
    ] as any,

    onPrepare: async () => {
      clearPreviousResults()
      await beforeRunHook()
    },

    onComplete: async () => {
      await afterRunHook()
    },

    /**
     * Ajustes del snapshot de XCUITest, aplicados en runtime.
     *
     * Con los valores por defecto el árbol de iOS vuelve TRUNCADO: la jerarquía
     * de React Native es muy profunda y el contenido del bottom sheet queda
     * fuera —se ve "Bottom Sheet" pero ninguno de sus textos—, así que la suite
     * no tiene nada que matchear aunque el ticket esté abierto en pantalla.
     *
     * Se hace por updateSettings y no sólo por capability porque acá es donde
     * está verificado que surte efecto.
     */
    before: async () => {
      if (driver.isIOS) {
        await driver.updateSettings({
          snapshotMaxDepth: 120,
          customSnapshotTimeout: 60,
        })
      }
    },

    /** Evidencia de la falla en Allure y en Qase, no sólo el stack. */
    afterTest: async (
      _test: unknown,
      _context: unknown,
      {error}: {error?: Error}
    ) => {
      if (!error) {
        return
      }

      try {
        const screenshot = await browser.takeScreenshot()

        allureReporter.addAttachment(
          "Pantalla al fallar",
          Buffer.from(screenshot, "base64"),
          "image/png"
        )

        qase.attach({
          content: screenshot,
          name: "pantalla-al-fallar.png",
          type: "image/png",
        })

        /*
         * El árbol de accesibilidad al momento del fallo.
         *
         * Una captura muestra que el elemento ESTÁ en pantalla; sólo el árbol
         * explica por qué el selector no lo encontró. Sin esto, un fallo de
         * selector obliga a reproducir a mano.
         */
        const source = await driver.getPageSource()

        allureReporter.addAttachment(
          "Árbol de accesibilidad al fallar",
          source,
          "text/plain"
        )
      } catch {
        // Si la sesión ya murió no hay captura posible; no tapar el error real.
      }
    },
  } as const
}
