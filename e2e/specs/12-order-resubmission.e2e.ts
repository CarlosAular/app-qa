import {qase} from "wdio-qase-reporter"

import {captureAccount, ordersCreatedSince} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {CASE_INSTRUMENT} from "../data/instruments"
import {TICKET} from "../data/messages"
import {
  openTicketFromMarkets,
  resetUiState,
  submitMarketOrder,
} from "../flows/tradingFlows"
import {expectSameMoney} from "../support/money"
import {byTextContains, byTextInsensitive} from "../support/selectors"
import {step} from "../support/steps"
import {isVisible} from "../support/waits"

describe("Reenvío y arrastre de estado del ticket", () => {
  afterEach(resetUiState)

  it(
    qase(
      36,
      'COCOS-36 · Tocar "Enviar orden" dos veces seguidas crea una sola orden'
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.doubleSubmit
      const before = await captureAccount()

      await step("Abrir el ticket y completar una compra", async () => {
        const price = await openTicketFromMarkets(instrument.ticker)
        expectSameMoney(
          price,
          instrument.lastPrice,
          `El precio de ${instrument.ticker}`
        )
        await orderTicket.setSide("Comprar")
        await orderTicket.setType("Market")
        await orderTicket.setQuantityMode("Acciones")
        await orderTicket.enterQuantity(3)

        // La carrera de abajo sólo tiene sentido si la cantidad realmente
        // quedó cargada: sin esto, un tecleo perdido por carga del emulador
        // se confunde con un fallo de "no llegó a procesarse".
        expect(await orderTicket.readComputedQuantity()).toBe(3)
      })

      await step(
        'Tocar "Enviar orden" dos veces seguidas, sin esperar entre medio',
        async () => {
          // Carrera real: el MISMO elemento resuelto una sola vez, tocado dos
          // veces sin ningún wait entre medio. Llamar submit() dos veces
          // resolvería el selector de nuevo cada vez y perdería la carrera.
          const button = await $(byTextInsensitive(TICKET.submitIdle))
          await button.click()

          try {
            await button.click()
          } catch {
            // Si el segundo toque no encuentra el elemento, la app ya había
            // reaccionado al primero: es una buena señal, no un fallo.
          }
        }
      )

      await step("Se creó UNA sola orden", async () => {
        await orderTicket.waitForSubmitted()

        const after = await captureAccount()
        expect(ordersCreatedSince(before, after)).toHaveLength(1)
      })
    }
  )

  it(
    qase(
      37,
      "COCOS-37 · Después de enviar, el panel no arrastra la orden anterior"
    ),
    async () => {
      const first = CASE_INSTRUMENT.noCarryOverFirst
      const second = CASE_INSTRUMENT.noCarryOverSecond

      await step(`Enviar una compra de ${first.ticker}`, async () => {
        await openTicketFromMarkets(first.ticker)
        await submitMarketOrder({side: "Comprar", quantity: 4})
        await orderTicket.close()
      })

      await step(
        `Abrir el ticket de ${second.ticker} inmediatamente después`,
        async () => {
          await openTicketFromMarkets(second.ticker)
        }
      )

      await step(
        "El panel no arrastra el instrumento ni la cantidad anteriores",
        async () => {
          expect(await isVisible(byTextContains(first.ticker), 1_500)).toBe(
            false
          )
          expect(await isVisible(byTextContains(second.ticker))).toBe(true)

          /*
           * No se lee el campo con `readFieldValue`: en Android, un EditText
           * vacío devuelve por accesibilidad el texto del PLACEHOLDER (p.ej.
           * "123"), no una cadena vacía. La señal real de "no hay arrastre"
           * es el cálculo: cero acciones a enviar, sin estimado.
           */
          expect(await orderTicket.readComputedQuantity()).toBe(0)
          expect(await orderTicket.readEstimate()).toBeNull()
        }
      )
    }
  )

  it(
    qase(
      40,
      "COCOS-40 · Salir del panel y volver a abrirlo no reenvía la última orden"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.noResubmitOnReopen
      const before = await captureAccount()

      await step("Enviar una compra a mercado", async () => {
        await openTicketFromMarkets(instrument.ticker)
        await submitMarketOrder({side: "Comprar", quantity: 2})
      })

      const afterSubmit = await step(
        "Confirmar que se creó exactamente una orden",
        async () => {
          const snapshot = await captureAccount()
          expect(ordersCreatedSince(before, snapshot)).toHaveLength(1)
          return snapshot
        }
      )

      await step(
        "Cerrar y reabrir el panel sobre el mismo instrumento",
        async () => {
          await orderTicket.close()
          await openTicketFromMarkets(instrument.ticker)
        }
      )

      await step("Reabrir no reenvía la orden anterior", async () => {
        // Margen por si hubiera un reenvío fantasma en segundo plano.
        await browser.pause(3_000)

        const afterReopen = await captureAccount()
        expect(ordersCreatedSince(afterSubmit, afterReopen)).toHaveLength(0)
      })
    }
  )
})
