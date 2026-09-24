import {qase} from "wdio-qase-reporter"

import {tabBar} from "../components/TabBar"
import {INSTRUMENTS} from "../data/instruments"
import {PORTFOLIO} from "../data/messages"
import {marketsScreen} from "../screens/MarketsScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {readTextNodes, valueUnderLabel} from "../support/pageMap"
import {byLabelContains, byTextContains} from "../support/selectors"
import {step} from "../support/steps"
import {isVisible, waitForVisible} from "../support/waits"

describe("Comportamiento transversal de la cuenta", () => {
  it(
    qase(
      34,
      "COCOS-34 · Cambiar entre las pestañas conserva el estado de cada una"
    ),
    async () => {
      const marker = INSTRUMENTS.LEDE.ticker

      await step(
        "Ir a Mercados y bajar hasta un instrumento al final de la lista",
        async () => {
          await tabBar.markets()
          await marketsScreen.waitUntilLoaded()
          // scrollToLabelContains (dentro de readLastPrice) baja hasta
          // encontrarlo: el scroll queda posicionado ahí.
          await marketsScreen.readLastPrice(marker)
        }
      )

      await step("Cambiar a Portafolio y volver a Mercados", async () => {
        await tabBar.portfolio()

        /*
         * No se usa `portfolioScreen.waitUntilLoaded()`: hace `scrollToTop()`, y
         * en iOS ese toque en la barra de estado también sube la lista de la
         * pestaña que quedó atrás. Destruiría justo el estado que este caso
         * verifica. Alcanza con esperar el encabezado, sin scrollear.
         */
        await waitForVisible(byTextContains("Tenencias valorizadas en pesos"), {
          message: "No cargó el listado del Portafolio.",
        })

        await tabBar.markets()
      })

      /*
       * Prueba de que el estado se conservó: la lista NO volvió al tope, o sea
       * que el primer instrumento sigue fuera de pantalla. No se pide que el
       * marcador siga exactamente en el mismo lugar: en iOS 26 la barra se
       * colapsa al scrollear (`minimizeBehavior="onScrollDown"`) y para tocar
       * otra pestaña hay que expandirla con un flick hacia arriba, que corre la
       * lista unos renglones.
       */
      await step(
        "El scroll de Mercados se conservó: la lista no volvió al tope",
        async () => {
          expect(
            await isVisible(
              byLabelContains(`${INSTRUMENTS.DYCA.ticker}, `),
              1_500
            )
          ).toBe(false)
        }
      )

      await marketsScreen.backToTop()
    }
  )

  it(
    qase(
      15,
      "COCOS-15 · Los importes y porcentajes se muestran en formato argentino"
    ),
    async () => {
      await step("Los importes del Portafolio usan coma decimal", async () => {
        await tabBar.portfolio()
        await portfolioScreen.waitUntilLoaded()
        await portfolioScreen.refresh()

        const cashRaw = valueUnderLabel(await readTextNodes(), PORTFOLIO.cash)
        expect(cashRaw).toContain(",")
      })

      /*
       * HALLAZGO O4 (ya documentado en docs/qase.html): el porcentaje de
       * retorno se arma con `toFixed(2)` (punto decimal), no con
       * Intl.NumberFormat("es-AR") como el resto de la app. Este caso
       * automatiza el formato ESPERADO a propósito: mientras el defecto siga
       * abierto, esta mitad del caso es roja, y eso es lo correcto.
       */
      await step(
        "El retorno diario en Mercados usa coma decimal, no punto",
        async () => {
          await tabBar.markets()
          await marketsScreen.waitUntilLoaded()

          const returnLabel = await marketsScreen.readDailyReturnLabel(
            INSTRUMENTS.DYCA.ticker
          )

          expect(returnLabel).toContain(",")
          expect(returnLabel).not.toContain(".")
        }
      )
    }
  )
})
