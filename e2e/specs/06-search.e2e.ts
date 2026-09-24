import {qase} from "wdio-qase-reporter"

import {getInstruments} from "../api/cocosApi"
import {orderTicket} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {INSTRUMENTS} from "../data/instruments"
import {resetUiState} from "../flows/tradingFlows"
import {searchScreen} from "../screens/SearchScreen"
import {expectSameMoney} from "../support/money"
import {step} from "../support/steps"

/** Espeja getMarketsDailyReturnPercent de src/features/markets/marketMath.ts. */
const dailyReturnPercent = ({
  lastPrice,
  closePrice,
}: {
  lastPrice: number
  closePrice: number
}) => (closePrice <= 0 ? 0 : ((lastPrice - closePrice) / closePrice) * 100)

describe("Buscar activos", () => {
  afterEach(resetUiState)

  it(
    qase(1, "COCOS-1 · Buscar un instrumento por ticker muestra el resultado"),
    async () => {
      const instrument = INSTRUMENTS.DYCA

      await step("Ir a Buscar y tipear el ticker", async () => {
        await tabBar.search()
        await searchScreen.waitUntilLoaded()
        await searchScreen.typeQuery(instrument.ticker)
      })

      await step("El resultado aparece con el precio correcto", async () => {
        expect(await searchScreen.hasResult(instrument.ticker)).toBe(true)
        expectSameMoney(
          await searchScreen.readLastPrice(instrument.ticker),
          instrument.lastPrice,
          `El precio de ${instrument.ticker} en el resultado`
        )
      })

      await step("Tocar el resultado abre el ticket directo", async () => {
        await searchScreen.openResult(instrument.ticker)
        await orderTicket.waitUntilOpen()
      })
    }
  )

  it(
    qase(
      17,
      'COCOS-17 · Tocar una sugerencia de "Más movidos" completa la búsqueda'
    ),
    async () => {
      const topMover = await step(
        "Calcular el mayor movimiento del día contra la API (mismo criterio que la app)",
        async () => {
          const instruments = await getInstruments()

          const [first] = [...instruments].sort(
            (left, right) =>
              Math.abs(
                dailyReturnPercent({
                  closePrice: right.close_price,
                  lastPrice: right.last_price,
                })
              ) -
              Math.abs(
                dailyReturnPercent({
                  closePrice: left.close_price,
                  lastPrice: left.last_price,
                })
              )
          )

          if (!first) {
            throw new Error("La API no devolvió ningún instrumento.")
          }

          return first
        }
      )

      await step("Ir a Buscar con el campo vacío", async () => {
        await tabBar.search()
        await searchScreen.waitUntilLoaded()
        // El campo conserva lo tipeado en el test anterior al cambiar de
        // pestaña (COCOS-34): hay que vaciarlo para llegar al estado "idle"
        // donde se muestran las sugerencias.
        await searchScreen.ensureEmpty()
      })

      await step(
        `Tocar la sugerencia de ${topMover.ticker} completa la búsqueda`,
        async () => {
          await searchScreen.tapSuggestion(topMover.ticker)
          expect(await searchScreen.hasResult(topMover.ticker)).toBe(true)
        }
      )
    }
  )

  it(
    qase(
      18,
      "COCOS-18 · Buscar por el nombre de la empresa encuentra el instrumento"
    ),
    async () => {
      const instrument = INSTRUMENTS.TECO2
      // El nombre real del instrumento, no el ticker: es lo que documenta el
      // hallazgo O3. Se busca EXACTAMENTE lo que un usuario tipearía.
      const companyName = instrument.name

      await step("Ir a Buscar y tipear el nombre de la empresa", async () => {
        await tabBar.search()
        await searchScreen.waitUntilLoaded()
        await searchScreen.typeQuery(companyName)
      })

      /*
       * HALLAZGO O3 (ya documentado en docs/producto-y-qa.html): el campo dice
       * "Ticker o empresa" pero buscar por el nombre real no devuelve nada.
       * Este caso automatiza el comportamiento ESPERADO a propósito: mientras
       * el defecto siga abierto, el resultado es rojo, y eso es lo correcto.
       */
      await step(
        `Encuentra ${instrument.ticker} buscando "${companyName}"`,
        async () => {
          expect(await searchScreen.hasResult(instrument.ticker)).toBe(true)
        }
      )
    }
  )

  it(
    qase(
      43,
      "COCOS-43 · Los instrumentos que no son acciones se distinguen en los listados"
    ),
    async () => {
      const stock = INSTRUMENTS.DYCA
      const currency = INSTRUMENTS.ARS

      await step(`Buscar ${stock.ticker}, una ACCIONES`, async () => {
        await tabBar.search()
        await searchScreen.waitUntilLoaded()
        await searchScreen.typeQuery(stock.ticker)

        expect(await searchScreen.readResultType(stock.ticker)).toBe("ACCIONES")
      })

      await step(`Buscar ${currency.ticker}, una MONEDA`, async () => {
        await searchScreen.clearQuery()
        await searchScreen.typeQuery(currency.ticker)

        expect(await searchScreen.readResultType(currency.ticker)).toBe(
          "MONEDA"
        )
      })
    }
  )
})
