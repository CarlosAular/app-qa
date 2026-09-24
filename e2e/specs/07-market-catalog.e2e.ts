import {qase} from "wdio-qase-reporter"

import {tabBar} from "../components/TabBar"
import {INSTRUMENTS} from "../data/instruments"
import {resetUiState} from "../flows/tradingFlows"
import {instrumentDetailScreen} from "../screens/InstrumentDetailScreen"
import {marketsScreen} from "../screens/MarketsScreen"
import {expectSameMoney} from "../support/money"
import {step} from "../support/steps"

/** "+8.69%" / "-8.69%" -> 8.69 / -8.69. Sólo para comparar el NÚMERO. */
const parsePercentText = (text: string): number => {
  const match = text.match(/-?[\d.]+/)

  if (!match) {
    throw new Error(`No pude leer un porcentaje de ${JSON.stringify(text)}`)
  }

  return Number(match[0])
}

describe("Panel de mercados", () => {
  afterEach(resetUiState)

  it(
    qase(
      3,
      "COCOS-3 · Abrir un instrumento desde el panel muestra su ficha completa"
    ),
    async () => {
      const instrument = INSTRUMENTS.DYCA

      const lastPrice = await step(
        "Anotar el último precio en el panel y abrir la ficha",
        async () => {
          await tabBar.markets()
          await marketsScreen.waitUntilLoaded()

          const price = await marketsScreen.readLastPrice(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker} en el panel`
          )

          await marketsScreen.openInstrument(instrument.ticker)
          await instrumentDetailScreen.waitUntilLoaded()

          return price
        }
      )

      await step(
        "La ficha muestra el cierre anterior y el spread correctos",
        async () => {
          expectSameMoney(
            await instrumentDetailScreen.readPreviousClose(),
            instrument.closePrice,
            "El cierre anterior de la ficha"
          )

          expectSameMoney(
            await instrumentDetailScreen.readSpread(),
            lastPrice - instrument.closePrice,
            "El spread diario de la ficha"
          )
        }
      )

      await step("Volver al panel deja la misma pantalla", async () => {
        await instrumentDetailScreen.goBack()
        await marketsScreen.waitUntilLoaded()
      })
    }
  )

  it(
    qase(
      2,
      "COCOS-2 · El panel muestra el precio y la variación del día de cada instrumento"
    ),
    async () => {
      const instrument = INSTRUMENTS.CAPX
      const expectedReturn =
        ((instrument.lastPrice - instrument.closePrice) /
          instrument.closePrice) *
        100

      await step("El panel muestra precio y retorno diario", async () => {
        await tabBar.markets()
        await marketsScreen.waitUntilLoaded()

        expectSameMoney(
          await marketsScreen.readLastPrice(instrument.ticker),
          instrument.lastPrice,
          `El precio de ${instrument.ticker} en el panel`
        )

        const returnLabel = await marketsScreen.readDailyReturnLabel(
          instrument.ticker
        )

        expect(Number(returnLabel)).toBeCloseTo(expectedReturn, 1)
      })

      await step(
        "La ficha del instrumento muestra el mismo retorno diario",
        async () => {
          await marketsScreen.openInstrument(instrument.ticker)
          await instrumentDetailScreen.waitUntilLoaded()

          const badgeText = await instrumentDetailScreen.readDailyReturnText()
          expect(parsePercentText(badgeText)).toBeCloseTo(expectedReturn, 1)
        }
      )
    }
  )
})
