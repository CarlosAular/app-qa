import {qase} from "wdio-qase-reporter"

import {tabBar} from "../components/TabBar"
import {INSTRUMENTS} from "../data/instruments"
import {PORTFOLIO} from "../data/messages"
import {marketsScreen} from "../screens/MarketsScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {readTextNodes, valueUnderLabel} from "../support/pageMap"
import {byLabelContains} from "../support/selectors"
import {step} from "../support/steps"
import {isVisible} from "../support/waits"

describe("Comportamiento transversal de la cuenta", () => {
  it(
    qase(
      34,
      "COCOS-34 · Cambiar entre las pestañas conserva el estado de cada una"
    ),
    async () => {
      const marker = INSTRUMENTS.SAMI.ticker

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
        await portfolioScreen.waitUntilLoaded()
        await tabBar.markets()
      })

      await step(
        "El scroll de Mercados se conservó: el instrumento sigue visible sin volver a scrollear",
        async () => {
          expect(await isVisible(byLabelContains(`${marker}, `), 2_000)).toBe(
            true
          )
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
