import {qase} from "wdio-qase-reporter"

import {
  captureAccount,
  expectCashDelta,
  ordersCreatedSince,
} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {toastBanner} from "../components/ToastBanner"
import {CASE_INSTRUMENT} from "../data/instruments"
import {TOAST} from "../data/messages"
import {openTicketFromMarkets} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {estimatedTotal, expectSameMoney, formatArs} from "../support/money"
import {step} from "../support/steps"

const INSTRUMENT = CASE_INSTRUMENT.marketBuy
const TICKER = INSTRUMENT.ticker
const QUANTITY = 21

describe("Compra a mercado", () => {
  it(
    qase(
      7,
      "COCOS-7 · Una compra a mercado se ejecuta al precio vigente y descuenta el importe del efectivo"
    ),
    async () => {
      const before = await captureAccount()

      const lastPrice = await step(
        "Abrir el ticket desde Mercados y anotar el último precio",
        async () => {
          const price = await openTicketFromMarkets(TICKER)

          expectSameMoney(
            price,
            INSTRUMENT.lastPrice,
            `El precio de ${TICKER} en la UI no coincide con el fixture`
          )

          return price
        }
      )

      const expectedTotal = estimatedTotal(QUANTITY, lastPrice)

      await step(
        `Cargar ${QUANTITY} acciones y verificar el pie del panel`,
        async () => {
          await orderTicket.setSide("Comprar")
          await orderTicket.setType("Market")
          await orderTicket.setQuantityMode("Acciones")
          await orderTicket.enterQuantity(QUANTITY)

          expect(await orderTicket.readComputedQuantity()).toBe(QUANTITY)

          const estimate = await orderTicket.readEstimate()
          expect(estimate).not.toBeNull()
          expectSameMoney(estimate!, expectedTotal, "El estimado del ticket")
        }
      )

      await step("Enviar la orden", async () => {
        await orderTicket.submit()
        await orderTicket.waitForSubmitted()

        /*
         * El toast NO es el oráculo.
         *
         * En Android el aviso "Orden ejecutada" nunca aparece (defecto
         * conocido, reportado en Qase), así que sólo se verifica donde la
         * plataforma sí lo muestra. La confirmación real es el historial.
         */
        if (driver.isIOS) {
          expect(await toastBanner.isShowing(TOAST.orderFilled)).toBe(true)
        }
      })

      const created = await step(
        "La orden existe en el servicio, ejecutada al precio vigente",
        async () => {
          const after = await captureAccount()
          const newOrders = ordersCreatedSince(before, after)

          expect(newOrders).toHaveLength(1)

          const order = newOrders[0]!
          expect(order.side).toBe("BUY")
          expect(order.type).toBe("MARKET")
          expect(order.quantity).toBe(QUANTITY)
          expect(order.status).toBe("FILLED")
          expectSameMoney(order.price, lastPrice, "El precio de ejecución")

          return order
        }
      )

      await step("La orden aparece en el historial de la app", async () => {
        await orderTicket.close()
        await tabBar.orders()
        await ordersScreen.waitUntilLoaded()
        await ordersScreen.refresh()

        expect(await ordersScreen.hasRowForId(created.id)).toBe(true)
      })

      await step(
        "El efectivo bajó exactamente en cantidad × precio de ejecución",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.waitUntilLoaded()
          await portfolioScreen.refresh()

          const after = await captureAccount()
          expectCashDelta(before, after, -expectedTotal)

          const cashOnScreen = await portfolioScreen.readCash()
          expectSameMoney(
            cashOnScreen,
            after.cash,
            "El efectivo que muestra la UI no coincide con el del servicio"
          )
        }
      )

      await step(`La posición de ${TICKER} refleja la compra`, async () => {
        const quantityBefore =
          before.holdings.find(holding => holding.ticker === TICKER)
            ?.quantity ?? 0

        const quantityOnScreen =
          await portfolioScreen.readPositionQuantity(TICKER)

        expect(quantityOnScreen).toBe(quantityBefore + QUANTITY)

        const marketValue =
          await portfolioScreen.readPositionMarketValue(TICKER)
        expectSameMoney(
          marketValue,
          estimatedTotal(quantityOnScreen, lastPrice),
          `El valor de mercado de ${TICKER}`
        )
      })

      console.log(
        `[COCOS-7] orden #${created.id} · ${QUANTITY} ${TICKER} @ ${formatArs(lastPrice)}`
      )
    }
  )
})
