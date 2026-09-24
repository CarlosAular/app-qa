import {qase} from "wdio-qase-reporter"

import {createOrder} from "../api/cocosApi"
import {captureAccount} from "../api/snapshot"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {resetUiState} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {step} from "../support/steps"

const instrument = CASE_INSTRUMENT.historyOrder
const ORDERS = 12

describe("Orden del historial con más de nueve órdenes", () => {
  afterEach(resetUiState)

  it(
    qase(
      48,
      "COCOS-48 · Con más de nueve órdenes el historial mantiene el orden cronológico"
    ),
    async () => {
      const before = await captureAccount()

      /*
       * Las doce órdenes se crean por API, no por el ticket: son de mercado
       * (determinísticas), y el caso mira el HISTORIAL, no el armado del ticket.
       * Se anota el id de cada una en el orden en que se envió.
       */
      const created = await step(
        `Crear ${ORDERS} órdenes a mercado seguidas, de 1 acción cada una`,
        async () => {
          const ids: number[] = []

          for (let index = 0; index < ORDERS; index += 1) {
            const order = await createOrder({
              instrument_id: instrument.id,
              quantity: 1,
              side: "BUY",
              type: "MARKET",
            })

            expect(order.status).toBe("FILLED")
            ids.push(order.id)
          }

          return ids
        }
      )

      await step("El conteo total de Órdenes subió en 12", async () => {
        await tabBar.orders()
        await ordersScreen.waitUntilLoaded()
        await ordersScreen.refresh()

        expect(await ordersScreen.readOrderCount()).toBe(
          before.orderCount + ORDERS
        )
      })

      /*
       * Las doce son las más nuevas: tienen que ser las doce primeras filas, en
       * orden inverso al de envío. Con más de nueve, es el tramo donde el
       * desempate por número de orden (que compara texto) podría desarmar la
       * secuencia; `created_at` trae milisegundos y las órdenes seguidas nunca
       * empatan, así que hoy el desempate no llega a intervenir.
       */
      await step(
        "Las doce aparecen de arriba hacia abajo en orden inverso al de envío",
        async () => {
          const shown = await ordersScreen.readOrderIdsTopToBottom(ORDERS)

          expect(shown.slice(0, ORDERS)).toEqual(
            [...created].reverse().map(String)
          )
          expect(new Set(shown).size).toBe(shown.length)
        }
      )
    }
  )
})
