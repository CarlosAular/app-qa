import {qase} from "wdio-qase-reporter"

import {captureAccount, expectNoNewOrders} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {INSTRUMENTS} from "../data/instruments"
import {openTicketFromSearch, resetUiState} from "../flows/tradingFlows"
import {expectSameMoney} from "../support/money"
import {step} from "../support/steps"

describe("Instrumentos que no son acciones", () => {
  afterEach(resetUiState)

  it(
    qase(
      41,
      "COCOS-41 · La moneda ARS no se ofrece como instrumento comprable"
    ),
    async () => {
      const instrument = INSTRUMENTS.ARS
      const before = await captureAccount()

      await step("Abrir el ticket de ARS desde Buscar", async () => {
        const price = await openTicketFromSearch(instrument.ticker)
        expectSameMoney(price, instrument.lastPrice, "El precio de ARS")
      })

      await step("Intentar comprar 1 peso de ARS", async () => {
        await orderTicket.setSide("Comprar")
        await orderTicket.setType("Market")
        await orderTicket.setQuantityMode("Acciones")
        await orderTicket.enterQuantity(1)
        await orderTicket.submit()

        // No se espera feedback visual a propósito: el oráculo es el estado
        // del servicio, no el toast (ver 04-sell-partial.e2e.ts).
        await browser.pause(4_000)
      })

      /*
       * HALLAZGO O8 (ya documentado en docs/qase.html): el servicio ejecuta
       * hoy la compra de ARS igual que cualquier acción (201 FILLED), en vez
       * de rechazarla. Este caso automatiza el comportamiento ESPERADO a
       * propósito: mientras el defecto siga abierto, el resultado es rojo, y
       * eso es lo correcto.
       */
      await step(
        "ARS no debería poder comprarse: no debería crearse ninguna orden",
        async () => {
          expectNoNewOrders(before, await captureAccount())
        }
      )

      await orderTicket.close()
    }
  )
})
