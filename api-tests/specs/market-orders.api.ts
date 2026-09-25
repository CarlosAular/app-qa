// Endpoints: POST /orders, GET /orders, GET /portfolio
// Verifica el ciclo de vida de órdenes MARKET y LIMIT: ejecución, estados y no-idempotencia.

import {qase} from "playwright-qase-reporter"

import {expect, INITIAL_CASH, money, tag, test} from "../fixtures"

type Side = "BUY" | "SELL"

test(
  qase(
    27,
    "COCOS-27 · El servicio ejecuta las órdenes a mercado al instante y devuelve el precio real"
  ),
  async ({api}) => {
    await tag("Órdenes MARKET y LIMIT", "blocker")
    const instrument = await api.tradable()
    const price = instrument.last_price
    const order = (
      side: Side,
      type: "MARKET" | "LIMIT",
      quantity: number,
      limit?: number
    ) =>
      api.createOrder({
        instrument_id: instrument.id,
        side,
        type,
        quantity,
        ...(limit === undefined ? {} : {price: limit}),
      })
    const holdingQuantity = async () =>
      (await api.portfolio()).holdings.find(
        h => h.instrument_id === instrument.id
      )?.quantity
    /** La orden límite se resuelve al leer la cuenta: se relee hasta que deje de estar PENDING. */
    const settle = (orderId: number) =>
      expect
        .poll(
          async () => (await api.orders()).find(o => o.id === orderId)?.status,
          {timeout: 20_000, intervals: [400]}
        )
        .not.toBe("PENDING")
    const statusOf = async (orderId: number) =>
      (await api.orders()).find(o => o.id === orderId)?.status

    await test.step("POST /orders BUY MARKET quantity 10", async () => {
      const first = await order("BUY", "MARKET", 10)
      expect(first.status).toBe("FILLED")
      expect(first.candidate_id).toBe(api.candidateId)
      expect(first.id).toBeGreaterThan(0)
      // Paso 2, con la misma respuesta: el price es el vigente.
      expect(first.price).toBe(price)
    })

    // POST /orders MARKET — el price del body se ignora; siempre se usa el precio vigente
    await test.step("Repetir el POST enviando además un price arbitrario (1)", async () => {
      const second = await order("BUY", "MARKET", 10, 1)
      expect(second.status).toBe("FILLED")
      expect(second.price).toBe(price)
    })

    const cashBeforeLimit =
      await test.step("GET /portfolio y GET /orders", async () => {
        const portfolio = await api.portfolio()
        expect(portfolio.cash).toBeCloseTo(INITIAL_CASH - 20 * price, 2)
        expect(await holdingQuantity()).toBe(20)
        const orders = await api.orders()
        expect(orders).toHaveLength(2)
        expect(orders.every(o => o.status === "FILLED")).toBe(true)
        return portfolio.cash
      })

    const buyLimit =
      await test.step("POST /orders BUY LIMIT quantity 10 con price muy por debajo del mercado", async () => {
        const created = await order("BUY", "LIMIT", 10, 1)
        expect(created.status).toBe("PENDING")
        // Reservado (10 x 1) o ya liberado si se resolvió entre lecturas.
        expect([money(cashBeforeLimit - 10), money(cashBeforeLimit)]).toContain(
          money((await api.portfolio()).cash)
        )
        return created
      })

    await test.step("GET /orders una vez y revisar esa orden", async () => {
      expect(["PENDING", "REJECTED"]).toContain(await statusOf(buyLimit.id))
    })

    await test.step("GET /orders otra vez, con reintentos, hasta que deje de estar PENDING", async () => {
      await settle(buyLimit.id)
      expect(await statusOf(buyLimit.id)).toBe("REJECTED")
      // Y ya no cambia.
      expect(await statusOf(buyLimit.id)).toBe("REJECTED")
    })

    await test.step("GET /portfolio", async () => {
      expect(money((await api.portfolio()).cash)).toBe(money(cashBeforeLimit))
    })

    await test.step("POST /orders SELL LIMIT quantity 5 con price muy por encima del mercado", async () => {
      const sell = await order("SELL", "LIMIT", 5, money(price * 10))
      expect(sell.status).toBe("PENDING")
      expect([15, 20]).toContain(await holdingQuantity())

      await settle(sell.id)
      expect(await statusOf(sell.id)).toBe("REJECTED")
      expect(await holdingQuantity()).toBe(20)
    })
  }
)

test(
  qase(
    39,
    "COCOS-39 · El servicio no distingue dos envíos idénticos consecutivos"
  ),
  async ({api}) => {
    await tag("Órdenes MARKET y LIMIT", "normal")
    const instrument = await api.tradable()
    const body = {
      instrument_id: instrument.id,
      side: "BUY",
      type: "MARKET",
      quantity: 5,
    }

    const first =
      await test.step("POST /orders BUY MARKET quantity 5", async () => {
        const created = await api.createOrder(body)
        expect(created.status).toBe("FILLED")
        return created
      })

    const second =
      await test.step("Repetir exactamente el mismo POST", async () => {
        const created = await api.createOrder(body)
        expect(created.id).not.toBe(first.id)
        return created
      })

    await test.step("GET /orders", async () => {
      const orders = await api.orders()
      expect(orders.map(o => o.id).sort()).toEqual([first.id, second.id].sort())
      expect(orders.every(o => o.quantity === 5)).toBe(true)
    })

    await test.step("GET /portfolio", async () => {
      const portfolio = await api.portfolio()
      expect(portfolio.holdings[0]?.quantity).toBe(10)
      expect(portfolio.cash).toBeCloseTo(
        INITIAL_CASH - 10 * instrument.last_price,
        2
      )
    })

    // POST /orders — dos requests idénticos generan dos órdenes con distinto id: no hay idempotencia
    await test.step("Registrar la conclusión: no hay idempotencia del lado del servicio", async () => {
      expect(new Set([first.id, second.id]).size).toBe(2)
    })
  }
)
