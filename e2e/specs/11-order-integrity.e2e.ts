import {qase} from "wdio-qase-reporter"

import {
  captureAccount,
  expectCashDelta,
  expectNoNewOrders,
  ordersCreatedSince,
  quantityOf,
} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {CASE_INSTRUMENT} from "../data/instruments"
import {
  openTicketFromMarkets,
  resetUiState,
  submitMarketOrder,
} from "../flows/tradingFlows"
import {expectSameMoney} from "../support/money"
import {step} from "../support/steps"

describe("Integridad de la orden", () => {
  afterEach(resetUiState)

  it(
    qase(9, "COCOS-9 · No se puede comprar por más dinero del disponible"),
    async () => {
      const instrument = CASE_INSTRUMENT.insufficientCash
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket y anotar el último precio",
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )
          return price
        }
      )

      /*
       * Se calcula sobre el efectivo EN VIVO, no sobre el millón inicial: para
       * cuando corre este spec, specs anteriores ya gastaron parte de la
       * cuenta compartida. El margen de 1000 acciones de más hace el caso
       * robusto sin importar cuánto quede.
       */
      const unaffordableQuantity = Math.floor(before.cash / lastPrice) + 1_000

      await step(
        "Pedir muchas más acciones de las que el efectivo permite",
        async () => {
          await orderTicket.setSide("Comprar")
          await orderTicket.setType("Market")
          await orderTicket.setQuantityMode("Acciones")
          await orderTicket.enterQuantity(unaffordableQuantity)
          await orderTicket.submit()

          // Sin feedback visual a propósito: el oráculo es el estado del
          // servicio (ver 04-sell-partial.e2e.ts).
          await browser.pause(4_000)
        }
      )

      await step(
        "Se rechaza: no crea orden, no mueve efectivo ni tenencia",
        async () => {
          const after = await captureAccount()

          expectNoNewOrders(before, after)
          expectCashDelta(before, after, 0, "El efectivo tras el rechazo")
          expect(quantityOf(after, instrument.ticker)).toBe(
            quantityOf(before, instrument.ticker)
          )
        }
      )

      await orderTicket.close()
    }
  )

  it(
    qase(
      44,
      "COCOS-44 · El precio confirmado en el panel es el precio al que se ejecuta"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.confirmedPrice
      const before = await captureAccount()

      const confirmedPrice = await step(
        "Abrir el ticket y anotar el precio confirmado en el panel",
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio confirmado de ${instrument.ticker}`
          )
          return price
        }
      )

      await step("Comprar 2 acciones a mercado", async () => {
        await submitMarketOrder({side: "Comprar", quantity: 2})
      })

      await step(
        "El precio de ejecución coincide con el precio confirmado",
        async () => {
          const after = await captureAccount()
          const created = ordersCreatedSince(before, after)

          expect(created).toHaveLength(1)
          expectSameMoney(
            created[0]!.price,
            confirmedPrice,
            "El precio de ejecución vs. el confirmado en el panel"
          )
        }
      )
    }
  )
})
