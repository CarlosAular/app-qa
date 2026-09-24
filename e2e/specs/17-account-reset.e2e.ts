import {qase} from "wdio-qase-reporter"

import {createOrder} from "../api/cocosApi"
import {captureAccount, seedPosition} from "../api/snapshot"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT, INITIAL_CASH} from "../data/instruments"
import {resetUiState} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {expectSameMoney} from "../support/money"
import {step} from "../support/steps"

/**
 * ÚLTIMO archivo de la corrida, a propósito: el reinicio borra la cuenta
 * COMPARTIDA por todos los specs anteriores. Debe ser la última entrada del
 * array `SPECS` en e2e/config/wdio.shared.conf.ts, sin excepción.
 */
describe("Reinicio de la cuenta", () => {
  afterEach(resetUiState)

  it(
    qase(
      13,
      "COCOS-13 · Reiniciar la cuenta deja el saldo inicial, sin posiciones ni historial"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.resetBaseline

      await step(
        "Partir de una cuenta con al menos una posición y una orden",
        async () => {
          await seedPosition(instrument.id, instrument.ticker, 4)
        }
      )

      await step("Disparar el reinicio desde Órdenes", async () => {
        await tabBar.orders()
        await ordersScreen.waitUntilLoaded()
        await ordersScreen.tapReset()
        await ordersScreen.waitForResetConfirmDialog()
        await ordersScreen.confirmReset()
        await ordersScreen.waitForResetComplete()
      })

      await step("El servicio queda en el estado inicial", async () => {
        const after = await captureAccount()

        expect(after.cash).toBe(INITIAL_CASH)
        expect(after.holdings).toHaveLength(0)
        expect(after.orders).toHaveLength(0)
      })

      await step(
        "La app muestra el saldo inicial, sin posiciones ni historial",
        async () => {
          await ordersScreen.refresh()
          expect(await ordersScreen.isEmpty()).toBe(true)

          await tabBar.portfolio()
          await portfolioScreen.waitUntilLoaded()
          await portfolioScreen.refresh()

          expectSameMoney(
            await portfolioScreen.readCash(),
            INITIAL_CASH,
            "El efectivo tras el reinicio"
          )
          expect(await portfolioScreen.isEmpty()).toBe(true)
        }
      )
    }
  )

  it(
    qase(
      50,
      "COCOS-50 · Reiniciar la cuenta también borra las órdenes límite pendientes"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.resetClearsLimit

      const pendingOrder = await step(
        "Crear una orden límite muy por debajo del mercado, que queda pendiente",
        async () => {
          const order = await createOrder({
            instrument_id: instrument.id,
            price: Number((instrument.lastPrice * 0.5).toFixed(2)),
            quantity: 1,
            side: "BUY",
            type: "LIMIT",
          })

          expect(order.status).toBe("PENDING")
          return order
        }
      )

      await step("Disparar el reinicio desde Órdenes", async () => {
        await tabBar.orders()
        await ordersScreen.waitUntilLoaded()
        await ordersScreen.refresh()
        await ordersScreen.tapReset()
        await ordersScreen.waitForResetConfirmDialog()
        await ordersScreen.confirmReset()
        await ordersScreen.waitForResetComplete()
      })

      await step(
        "La orden límite pendiente ya no existe, y la cuenta vuelve al inicial",
        async () => {
          const after = await captureAccount()

          expect(
            after.orders.find(order => order.id === pendingOrder.id)
          ).toBeUndefined()
          expect(after.orders).toHaveLength(0)
          expect(after.cash).toBe(INITIAL_CASH)
        }
      )
    }
  )
})
