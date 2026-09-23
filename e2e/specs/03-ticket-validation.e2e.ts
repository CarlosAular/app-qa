import {qase} from "wdio-qase-reporter"

import {captureAccount, expectNoNewOrders} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {TICKET, VALIDATION} from "../data/messages"
import {openTicketFromMarkets, resetUiState} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {step} from "../support/steps"

const instrument = CASE_INSTRUMENT.validation

const readOrderCountFromUi = async () => {
  await tabBar.orders()
  await ordersScreen.waitUntilLoaded()
  await ordersScreen.refresh()
  return ordersScreen.readOrderCount()
}

describe("Validaciones del ticket", () => {
  afterEach(resetUiState)

  it(
    qase(6, "COCOS-6 · No se puede enviar una orden sin una cantidad válida"),
    async () => {
      const before = await captureAccount()

      const countBefore = await step(
        "Anotar el conteo total de órdenes",
        readOrderCountFromUi
      )

      await step("Abrir el ticket en Comprar · Market · Acciones", async () => {
        await openTicketFromMarkets(instrument.ticker)
        await orderTicket.setSide("Comprar")
        await orderTicket.setType("Market")
        await orderTicket.setQuantityMode("Acciones")
      })

      await step(
        "Con el campo vacío, enviar muestra el mensaje de cantidad",
        async () => {
          await orderTicket.submit()
          await orderTicket.expectFieldError(VALIDATION.quantityRequired)
        }
      )

      await step(
        "2,5 acciones muestra el mensaje de cantidad entera",
        async () => {
          await orderTicket.enterQuantity("2,5")
          await orderTicket.submit()
          await orderTicket.expectFieldError(VALIDATION.quantityMustBeInteger)
        }
      )

      await step(
        "Limit con precio vacío muestra el mensaje de precio límite",
        async () => {
          await orderTicket.setType("Limit")
          await orderTicket.enterQuantity(10)
          await orderTicket.clearLimitPrice()
          await orderTicket.submit()
          await orderTicket.expectFieldError(VALIDATION.limitPriceRequired)
        }
      )

      await step("Ninguno de los intentos creó una orden", async () => {
        await orderTicket.close()

        expect(await readOrderCountFromUi()).toBe(countBefore)
        expectNoNewOrders(before, await captureAccount())
      })
    }
  )

  it(
    qase(
      47,
      "COCOS-47 · Un precio límite de cero o negativo no se puede enviar"
    ),
    async () => {
      const before = await captureAccount()

      const countBefore = await step(
        "Anotar el conteo total de órdenes",
        readOrderCountFromUi
      )

      await step("Abrir el ticket en Limit con 10 acciones", async () => {
        await openTicketFromMarkets(instrument.ticker)
        await orderTicket.setType("Limit")
        await orderTicket.enterQuantity(10)
      })

      await step("Un precio límite de 0 no se envía", async () => {
        await orderTicket.enterLimitPrice("0")
        await orderTicket.submit()
        await orderTicket.expectFieldError(VALIDATION.limitPriceRequired)
      })

      await step(
        "Un precio límite negativo es directamente intipeable",
        async () => {
          await orderTicket.enterLimitPrice("-5")

          /*
           * La app sanea el input en cada tecla (sanitizeOrdersEsArNumberInput
           * descarta todo lo que no sea dígito o coma), así que el signo menos
           * nunca llega al campo: un precio negativo es IRREPRESENTABLE.
           *
           * Es otra forma de cumplir lo que protege el caso. Lo que se asserta es
           * el invariante real —que no se pueda crear una orden con precio <= 0—,
           * y por eso NO se envía acá: con el signo descartado el valor quedaría
           * en 5, que es válido, y enviarlo crearía una orden límite real.
           */
          const shown = await orderTicket.readFieldValue(TICKET.limitPriceLabel)

          expect(shown.startsWith("-")).toBe(false)
          expect(shown).not.toContain("-")
        }
      )

      await step("Un precio límite vacío tampoco se envía", async () => {
        await orderTicket.clearLimitPrice()
        await orderTicket.submit()
        await orderTicket.expectFieldError(VALIDATION.limitPriceRequired)
      })

      await step("Ninguno de los intentos creó una orden", async () => {
        await orderTicket.close()

        expect(await readOrderCountFromUi()).toBe(countBefore)
        expectNoNewOrders(before, await captureAccount())
      })
    }
  )
})
