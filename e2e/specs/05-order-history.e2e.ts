import {qase} from "wdio-qase-reporter"

import {captureAccount, ordersCreatedSince} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {ORDER_LABELS} from "../data/messages"
import {
  openTicketFromMarkets,
  submitMarketOrder,
  resetUiState,
} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {formatArs, formatQuantity, expectSameMoney} from "../support/money"
import {byTextContains, byTextInsensitive} from "../support/selectors"
import {step} from "../support/steps"
import {isVisible} from "../support/waits"

const instrument = CASE_INSTRUMENT.history
const QUANTITY = 5

describe("Historial de órdenes", () => {
  afterEach(resetUiState)

  it(
    qase(
      10,
      "COCOS-10 · La orden recién enviada aparece primera en el historial con sus datos"
    ),
    async () => {
      const before = await captureAccount()

      const previousNewest = [...before.orders].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )[0]

      const countBefore = await step(
        "Anotar el conteo total de órdenes",
        async () => {
          await tabBar.orders()
          await ordersScreen.waitUntilLoaded()
          await ordersScreen.refresh()
          return ordersScreen.readOrderCount()
        }
      )

      const lastPrice = await step(
        `Enviar una compra a mercado de ${QUANTITY} ${instrument.ticker}`,
        async () => {
          const price = await openTicketFromMarkets(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )

          const {computedQuantity} = await submitMarketOrder({
            side: "Comprar",
            quantity: QUANTITY,
          })

          expect(computedQuantity).toBe(QUANTITY)
          await orderTicket.close()

          return price
        }
      )

      const created = await step(
        "La orden quedó registrada en el servicio",
        async () => {
          const after = await captureAccount()
          const newOrders = ordersCreatedSince(before, after)

          expect(newOrders).toHaveLength(1)

          const order = newOrders[0]!
          expect(order.status).toBe("FILLED")
          expectSameMoney(order.price, lastPrice, "El precio de ejecución")

          return order
        }
      )

      await step("El conteo total subió exactamente en uno", async () => {
        await tabBar.orders()
        await ordersScreen.waitUntilLoaded()
        await ordersScreen.refresh()

        expect(await ordersScreen.readOrderCount()).toBe(countBefore + 1)
      })

      await step("La orden nueva es la PRIMERA fila de la lista", async () => {
        const yNew = await ordersScreen.yOfRow(created.id)

        if (previousNewest) {
          // "Primera" se comprueba por posición en pantalla, no por texto:
          // la fila nueva tiene que estar por encima de la que era más reciente.
          const yPrevious = await ordersScreen.yOfRow(previousNewest.id)
          expect(yNew).toBeLessThan(yPrevious)
        }
      })

      await step(
        "La fila muestra ticker, lado, cantidad × precio y tipo",
        async () => {
          await ordersScreen.findRowById(created.id)

          expect(
            await isVisible(byTextContains(instrument.ticker), 3_000)
          ).toBe(true)

          // "COMPRA" se dibuja en mayúsculas por textTransform; el color verde no
          // es verificable desde la jerarquía de accesibilidad.
          expect(
            await isVisible(byTextInsensitive(ORDER_LABELS.sideBuy), 3_000)
          ).toBe(true)

          const detail = `${formatQuantity(QUANTITY)} x ${formatArs(lastPrice)} · ${ORDER_LABELS.typeMarket}`
          expect(await isVisible(byTextContains(detail), 3_000)).toBe(true)
        }
      )

      await step(
        "La fila muestra el importe y el estado Ejecutada",
        async () => {
          expect(
            await ordersScreen.rowShows(
              created.id,
              formatArs(QUANTITY * lastPrice)
            )
          ).toBe(true)

          expect(
            await isVisible(byTextInsensitive(ORDER_LABELS.statusFilled), 3_000)
          ).toBe(true)
        }
      )
    }
  )
})
