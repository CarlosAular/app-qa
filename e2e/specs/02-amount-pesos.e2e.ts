import {qase} from "wdio-qase-reporter"

import {
  captureAccount,
  expectCashDelta,
  expectNoNewOrders,
} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {CASE_INSTRUMENT} from "../data/instruments"
import {VALIDATION} from "../data/messages"
import {openTicketFromMarkets, resetUiState} from "../flows/tradingFlows"
import {
  estimatedTotal,
  expectSameMoney,
  sharesForAmount,
  toEsArInput,
} from "../support/money"
import {step} from "../support/steps"

describe("Conversión de pesos a acciones", () => {
  afterEach(resetUiState)

  it(
    qase(
      5,
      "COCOS-5 · Comprar indicando un importe en pesos calcula cuántas acciones enteras entran"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.amountToShares
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket y anotar el último precio",
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)

          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker} en la UI no coincide con el fixture`
          )

          return price
        }
      )

      await step('Cambiar "Cantidad por" de Acciones a Pesos', async () => {
        await orderTicket.setQuantityMode("Pesos")
      })

      await step(
        "Con $ 1.000, la cantidad es entera y nunca redondea hacia arriba",
        async () => {
          await orderTicket.enterAmount("1000")

          const expected = sharesForAmount(1_000, lastPrice)
          const shown = await orderTicket.readComputedQuantity()

          expect(shown).toBe(expected)
          expect(Number.isInteger(shown)).toBe(true)

          const estimate = await orderTicket.readEstimate()
          expect(estimate).not.toBeNull()
          expectSameMoney(
            estimate!,
            estimatedTotal(expected, lastPrice),
            "El estimado"
          )

          // La regla del caso: el estimado nunca puede superar lo ingresado.
          expect(estimate!).toBeLessThanOrEqual(1_000)
        }
      )

      await step(
        "Un importe menor al precio de una acción no se puede enviar",
        async () => {
          await orderTicket.enterAmount(toEsArInput(lastPrice - 1))
          await orderTicket.submit()
          await orderTicket.expectFieldError(VALIDATION.amountBelowOneShare)
        }
      )

      await step("Ningún intento creó una orden", async () => {
        expectNoNewOrders(before, await captureAccount())
        await orderTicket.close()
      })
    }
  )

  it(
    qase(
      49,
      "COCOS-49 · Un importe en pesos con coma decimal se interpreta correctamente"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.decimalAmount
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket en modo Pesos",
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)

          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )
          await orderTicket.setQuantityMode("Pesos")

          return price
        }
      )

      await step(
        "1500,50 se lee como mil quinientos con cincuenta, no mil veces más ni menos",
        async () => {
          await orderTicket.enterAmount("1500,50")

          const shown = await orderTicket.readComputedQuantity()

          expect(shown).toBe(sharesForAmount(1_500.5, lastPrice))
          expect(shown).not.toBe(sharesForAmount(150_050, lastPrice))
          expect(shown).not.toBe(sharesForAmount(1.5005, lastPrice))

          const estimate = await orderTicket.readEstimate()
          expectSameMoney(
            estimate!,
            estimatedTotal(shown, lastPrice),
            "El estimado"
          )
        }
      )

      await step(
        "Un importe igual al precio compra exactamente 1 acción",
        async () => {
          await orderTicket.enterAmount(toEsArInput(lastPrice))
          expect(await orderTicket.readComputedQuantity()).toBe(1)
        }
      )

      await step(
        "Un centavo menos no alcanza para ninguna acción",
        async () => {
          await orderTicket.enterAmount(toEsArInput(lastPrice - 0.01))

          expect(await orderTicket.readComputedQuantity()).toBe(0)

          await orderTicket.submit()
          await orderTicket.expectFieldError(VALIDATION.amountBelowOneShare)
        }
      )

      const target = Number((lastPrice * 2 - 0.01).toFixed(2))

      await step(
        "Dos veces el precio menos un centavo da 1 acción, no 2: nunca redondea hacia arriba",
        async () => {
          await orderTicket.enterAmount(toEsArInput(target))

          expect(await orderTicket.readComputedQuantity()).toBe(1)

          const estimate = await orderTicket.readEstimate()
          expectSameMoney(
            estimate!,
            lastPrice,
            "El estimado de una sola acción"
          )
          expect(estimate!).toBeLessThan(target)
        }
      )

      await step(
        "Al enviar, el efectivo baja por el estimado y no por el importe escrito",
        async () => {
          await orderTicket.submit()
          await orderTicket.waitForSubmitted()

          const after = await captureAccount()

          expectCashDelta(before, after, -lastPrice)

          // La prueba de fuego: el descuento NO es el importe tipeado.
          expect(Math.abs(after.cash - before.cash)).not.toBeCloseTo(target, 2)

          await orderTicket.close()
        }
      )
    }
  )
})
