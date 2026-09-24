import {qase} from "wdio-qase-reporter"

import {captureAccount, expectNoNewOrders} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {CASE_INSTRUMENT} from "../data/instruments"
import {openTicketFromMarkets, resetUiState} from "../flows/tradingFlows"
import {estimatedTotal, expectSameMoney, toEsArInput} from "../support/money"
import {step} from "../support/steps"

describe("Precio límite en el ticket", () => {
  afterEach(resetUiState)

  it(
    qase(
      21,
      "COCOS-21 · El importe estimado de una orden límite usa el precio límite ingresado"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.limitEstimate
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket y cambiar a Limit",
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )

          await orderTicket.setType("Limit")
          return price
        }
      )

      // A propósito, bien distinto del último precio: si el estimado
      // usara el precio de mercado en vez del límite, esta diferencia lo
      // delataría de inmediato.
      const limitPrice = Number((lastPrice * 0.8).toFixed(2))

      await step(
        "El estimado usa el precio límite, no el último precio",
        async () => {
          await orderTicket.enterQuantity(10)
          await orderTicket.enterLimitPrice(toEsArInput(limitPrice))

          const estimate = await orderTicket.readEstimate()
          expect(estimate).not.toBeNull()

          expectSameMoney(
            estimate!,
            estimatedTotal(10, limitPrice),
            "El estimado con precio límite"
          )

          expect(estimate!).not.toBeCloseTo(estimatedTotal(10, lastPrice), 0)
        }
      )

      await step(
        "Cambiar el precio límite recalcula el estimado en el acto",
        async () => {
          const higherLimitPrice = Number((lastPrice * 1.2).toFixed(2))
          await orderTicket.enterLimitPrice(toEsArInput(higherLimitPrice))

          const estimate = await orderTicket.readEstimate()
          expectSameMoney(
            estimate!,
            estimatedTotal(10, higherLimitPrice),
            "El estimado tras subir el precio límite"
          )
        }
      )

      await step("Cerrar sin enviar no crea ninguna orden", async () => {
        await orderTicket.close()
        expectNoNewOrders(before, await captureAccount())
      })
    }
  )
})
