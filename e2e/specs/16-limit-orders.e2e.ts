import {qase} from "wdio-qase-reporter"

import {
  captureAccount,
  ordersCreatedSince,
  quantityOf,
  seedPosition,
} from "../api/snapshot"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {
  pollUntilResolved,
  submitLimitOrderFromMarkets,
} from "../flows/limitFlows"
import {resetUiState} from "../flows/tradingFlows"
import {ordersScreen} from "../screens/OrdersScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {expectSameMoney, formatArs, toCents} from "../support/money"
import {step} from "../support/steps"

/*
 * Órdenes límite NO ejecutables (compra por debajo del mercado, venta por
 * encima).
 *
 * La API resuelve las límite con un factor aleatorio al leer la cuenta, así que
 * un estado puntual no se puede afirmar. Lo que sí es un invariante medido (0
 * ejecutadas en 30 no ejecutables, 0 en 10 más al preparar este spec): una
 * orden no ejecutable NUNCA se ejecuta y termina rechazada. Por eso los pasos
 * intermedios afirman pertenencia a un conjunto ("reservado O ya liberado") y
 * los finales afirman el estado terminal. Ningún paso depende de cuál de las dos
 * variantes toque, así que el spec no es flaky aunque el servicio sí lo sea.
 */

const expectOneOf = (actual: number, allowed: number[], what: string) => {
  if (!allowed.map(toCents).includes(toCents(actual))) {
    throw new Error(
      `${what}: obtuve ${formatArs(actual)} y esperaba ${allowed.map(formatArs).join(" o ")}`
    )
  }
}

describe("Órdenes límite no ejecutables", function () {
  /*
   * Cada caso reproduce un flujo manual de seis pasos con refrescos de pantalla
   * y un sondeo hasta que la API resuelve la orden: ~4 a 6 minutos, más que los
   * 300s por defecto. Un test que se pasa de tiempo NO se corta: sigue
   * ejecutando comandos y ensucia al siguiente, así que el tope se sube en vez
   * de dejar que expire.
   */
  this.timeout(600_000)

  afterEach(resetUiState)

  it(
    qase(
      8,
      "COCOS-8 · Una orden límite por debajo del precio de mercado nunca se ejecuta"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.limitBelowMarket
      const quantity = 10
      const limitPrice = Number((instrument.lastPrice * 0.5).toFixed(2))
      const before = await captureAccount()

      await step(
        "Enviar una compra límite de 10 acciones a la mitad del precio de mercado",
        async () => {
          const {lastPrice, estimate} = await submitLimitOrderFromMarkets({
            ticker: instrument.ticker,
            side: "Comprar",
            quantity,
            limitPrice,
          })

          expectSameMoney(
            lastPrice,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )

          // El pie del panel calcula con el precio límite, no con el de mercado.
          expect(estimate).not.toBeNull()
          expectSameMoney(
            estimate!,
            quantity * limitPrice,
            "El estimado con precio límite"
          )
        }
      )

      const order = await step(
        "La orden existe en el servicio como límite pendiente o rechazada",
        async () => {
          const [created, ...extra] = ordersCreatedSince(
            before,
            await captureAccount()
          )

          expect(extra).toHaveLength(0)
          expect(created).toBeDefined()
          expect(created!.side).toBe("BUY")
          expect(created!.type).toBe("LIMIT")
          expectSameMoney(created!.price, limitPrice, "El precio límite")
          expect(["PENDING", "REJECTED"]).toContain(created!.status)

          return created!
        }
      )

      await step(
        "Órdenes la muestra pendiente o rechazada, nunca ejecutada",
        async () => {
          await tabBar.orders()
          await ordersScreen.refresh()

          expect(["Pendiente", "Rechazada"]).toContain(
            await ordersScreen.readRowStatus(order.id)
          )
        }
      )

      await step(
        "Al resolverse termina rechazada: en ninguna lectura pasó a ejecutada",
        async () => {
          const statuses = await pollUntilResolved(order.id)

          qase.comment(`Estados observados por API: ${statuses.join(" > ")}`)
          expect(statuses).not.toContain("FILLED")
          expect(statuses.at(-1)).toBe("REJECTED")

          await ordersScreen.refresh()
          expect(await ordersScreen.readRowStatus(order.id)).toBe("Rechazada")
        }
      )

      await step(
        "El efectivo volvió exactamente al inicial y no se creó ninguna posición",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.refresh()

          // Una sola lectura del resumen (efectivo y contador). El contador de
          // posiciones alcanza para probar que no se creó ninguna: buscar una
          // fila ausente scrollea la lista entera (~20s).
          const {cash, positions} = await portfolioScreen.readSummary()

          expectSameMoney(
            cash,
            before.cash,
            "El efectivo tras liberarse la reserva"
          )
          expect(positions).toBe(before.holdings.length)
        }
      )
    }
  )

  it(
    qase(
      29,
      "COCOS-29 · Una orden límite pendiente descuenta el efectivo sin crear ninguna posición"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.limitReservesCash
      const quantity = 10
      const limitPrice = Number((instrument.lastPrice * 0.2).toFixed(2))
      const reserve = quantity * limitPrice
      const before = await captureAccount()

      await step(
        "Enviar una compra límite de 10 acciones muy por debajo del mercado",
        async () => {
          await submitLimitOrderFromMarkets({
            ticker: instrument.ticker,
            side: "Comprar",
            quantity,
            limitPrice,
          })
        }
      )

      /*
       * Primera lectura después de crear la orden, y la única antes de sondear:
       * es la que mejor puede ver la reserva. Aun así puede llegar ya resuelta,
       * así que se acepta "reservado" o "ya liberado", y se deja constancia de
       * cuál de las dos se vio.
       */
      await step(
        "Portafolio: el efectivo bajó por la reserva (o ya se liberó) y no hay posición",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.refresh()

          const {cash, positions} = await portfolioScreen.readSummary()

          expectOneOf(
            cash,
            [before.cash, before.cash - reserve],
            "El efectivo con la orden pendiente o ya rechazada"
          )

          qase.comment(
            toCents(cash) === toCents(before.cash - reserve)
              ? "Se observó la reserva: la orden seguía pendiente."
              : "La orden ya estaba resuelta al leer: no se llegó a ver la reserva."
          )

          expect(positions).toBe(before.holdings.length)
        }
      )

      const order = await step(
        "La orden se resuelve rechazada y nunca aparece como ejecutada",
        async () => {
          const [created] = ordersCreatedSince(before, await captureAccount())

          expect(created).toBeDefined()

          const statuses = await pollUntilResolved(created!.id)

          qase.comment(`Estados observados por API: ${statuses.join(" > ")}`)
          expect(statuses).not.toContain("FILLED")
          expect(statuses.at(-1)).toBe("REJECTED")

          await tabBar.orders()
          await ordersScreen.refresh()
          expect(await ordersScreen.readRowStatus(created!.id)).toBe(
            "Rechazada"
          )

          return created!
        }
      )

      await step(
        "El efectivo volvió exactamente al inicial: la reserva se liberó por completo",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.refresh()

          const {cash, positions} = await portfolioScreen.readSummary()

          expectSameMoney(
            cash,
            before.cash,
            `El efectivo tras rechazarse la orden #${order.id}`
          )
          expect(positions).toBe(before.holdings.length)
        }
      )
    }
  )

  it(
    qase(
      46,
      "COCOS-46 · Una venta límite pendiente reduce la cantidad visible de la posición"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.limitReservesShares
      const sold = 5
      const limitPrice = Number((instrument.lastPrice * 3).toFixed(2))

      await step("Partir de una posición de al menos 10 acciones", async () => {
        await seedPosition(instrument.id, instrument.ticker, 10)
      })

      const before = await captureAccount()
      const held = quantityOf(before, instrument.ticker)

      await step(
        "Enviar una venta límite de 5 acciones muy por encima del mercado",
        async () => {
          await submitLimitOrderFromMarkets({
            ticker: instrument.ticker,
            side: "Vender",
            quantity: sold,
            limitPrice,
          })
        }
      )

      /*
       * Una venta reserva ACCIONES, no dinero: el efectivo no cambia en ninguna
       * de las dos variantes, y la cantidad visible es la total o la neta de la
       * reserva.
       */
      await step(
        "Portafolio: la cantidad visible bajó por la reserva (o ya se liberó) y el efectivo no cambió",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.refresh()

          const shown = await portfolioScreen.readPositionQuantity(
            instrument.ticker
          )

          expect([held, held - sold]).toContain(shown)
          qase.comment(
            shown === held - sold
              ? "Se observó la reserva: la venta seguía pendiente."
              : "La orden ya estaba resuelta al leer: no se llegó a ver la reserva."
          )

          expectSameMoney(
            await portfolioScreen.readCash(),
            before.cash,
            "El efectivo, que una venta límite no toca"
          )
        }
      )

      await step(
        "La venta se resuelve rechazada, porque el precio pedido no se alcanzó",
        async () => {
          const [created] = ordersCreatedSince(before, await captureAccount())

          expect(created).toBeDefined()
          expect(created!.side).toBe("SELL")

          const statuses = await pollUntilResolved(created!.id)

          qase.comment(`Estados observados por API: ${statuses.join(" > ")}`)
          expect(statuses).not.toContain("FILLED")
          expect(statuses.at(-1)).toBe("REJECTED")

          await tabBar.orders()
          await ordersScreen.refresh()
          expect(await ordersScreen.readRowStatus(created!.id)).toBe(
            "Rechazada"
          )
        }
      )

      await step(
        "La cantidad volvió a la original: la reserva se liberó por completo",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.refresh()

          expect(
            await portfolioScreen.readPositionQuantity(instrument.ticker)
          ).toBe(held)
          expectSameMoney(
            await portfolioScreen.readCash(),
            before.cash,
            "El efectivo al final"
          )
        }
      )
    }
  )
})
