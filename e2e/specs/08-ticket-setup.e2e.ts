import {qase} from "wdio-qase-reporter"

import {captureAccount, expectNoNewOrders, seedPosition} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {CASE_INSTRUMENT} from "../data/instruments"
import {NAV, TICKET} from "../data/messages"
import {
  openTicketFromMarkets,
  openTicketFromPosition,
  resetUiState,
} from "../flows/tradingFlows"
import {instrumentDetailScreen} from "../screens/InstrumentDetailScreen"
import {positionDetailScreen} from "../screens/PositionDetailScreen"
import {estimatedTotal, expectSameMoney} from "../support/money"
import {byText, byTextContains, inputByLabel} from "../support/selectors"
import {step} from "../support/steps"
import {isVisible} from "../support/waits"

describe("Armado del ticket", () => {
  afterEach(resetUiState)

  it(
    qase(
      4,
      "COCOS-4 · El panel de orden abre listo para comprar a precio de mercado"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.ticketDefaults
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket desde Mercados",
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

      await step(
        "Abre en Comprar · Market · Acciones sin tocar nada",
        async () => {
          expect(await isVisible(byTextContains(instrument.ticker))).toBe(true)
          // Con Market+Acciones de fábrica, el campo de cantidad ya está
          // visible y el de precio límite no existe.
          expect(await isVisible(inputByLabel(TICKET.quantityLabel))).toBe(true)
          expect(
            await isVisible(inputByLabel(TICKET.limitPriceLabel), 1_500)
          ).toBe(false)
          expect(await orderTicket.readEstimate()).toBeNull()
        }
      )

      await step(
        "Cargar una cantidad calcula el estimado a precio de mercado",
        async () => {
          await orderTicket.enterQuantity(3)

          const estimate = await orderTicket.readEstimate()
          expect(estimate).not.toBeNull()
          expectSameMoney(
            estimate!,
            estimatedTotal(3, lastPrice),
            "El estimado a precio de mercado"
          )
        }
      )

      await step("Cerrar sin enviar no crea ninguna orden", async () => {
        await orderTicket.close()
        expectNoNewOrders(before, await captureAccount())
      })
    }
  )

  it(
    qase(
      22,
      "COCOS-22 · El panel de orden abre sobre el instrumento correcto desde los tres accesos"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.threeEntryPoints

      await step("Partir de una posición ya sembrada", async () => {
        await seedPosition(instrument.id, instrument.ticker, 5)
      })

      await step("Acceso 1 · desde Mercados", async () => {
        await openTicketFromMarkets(instrument.ticker)
        expect(await isVisible(byTextContains(instrument.ticker))).toBe(true)
        await orderTicket.close()
      })

      await step(
        "Acceso 2 · desde Portafolio, vía la ficha de la posición",
        async () => {
          await openTicketFromPosition(instrument.ticker)
          expect(await isVisible(byTextContains(instrument.ticker))).toBe(true)
          await orderTicket.close()
        }
      )

      await step(
        "Acceso 3 · reabrir sin volver a tocar una pestaña",
        async () => {
          /*
           * Tras el Acceso 2, en Android el defecto conocido de "Operar esta
           * posición" (ver flows/tradingFlows.ts) ya hizo caer la navegación
           * a la ficha del INSTRUMENTO, no a la de la posición; en iOS puede
           * quedar en la ficha de la posición. Cualquiera de las dos es un
           * acceso legítimo sin volver a tocar una pestaña: se reabre desde
           * la que esté realmente en pantalla.
           */
          if (await isVisible(byText(NAV.tradeFromPosition), 1_500)) {
            await positionDetailScreen.openTicket()
          } else {
            await instrumentDetailScreen.openTicket()
          }

          await orderTicket.waitUntilOpen()
          expect(await isVisible(byTextContains(instrument.ticker))).toBe(true)
        }
      )
    }
  )
})
