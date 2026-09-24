import {qase} from "playwright-qase-reporter"

import {expect, expectError, INITIAL_CASH, money, tag, test} from "../fixtures"

test(
  qase(
    32,
    "COCOS-32 · El servicio de portafolio cuadra con las órdenes ejecutadas"
  ),
  async ({api, rawClient, tier}) => {
    await tag("Portafolio", "blocker")
    const instrument = await api.tradable()
    const held = async () =>
      (await api.portfolio()).holdings.find(
        h => h.instrument_id === instrument.id
      )

    await test.step("GET /portfolio sobre la cuenta nueva", async () => {
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
    })

    const price =
      await test.step("POST /orders BUY MARKET quantity 10", async () => {
        const order = await api.createOrder({
          instrument_id: instrument.id,
          side: "BUY",
          type: "MARKET",
          quantity: 10,
        })
        expect(order.status).toBe("FILLED")
        return order.price
      })

    await test.step("GET /portfolio", async () => {
      expect((await api.portfolio()).cash).toBeCloseTo(
        INITIAL_CASH - 10 * price,
        2
      )
      expect((await held())?.quantity).toBe(10)
    })

    await test.step("Revisar el precio promedio de compra (avg_cost_price)", async () => {
      expect((await held())?.avg_cost_price).toBeCloseTo(price, 2)
    })

    await test.step("POST /orders SELL MARKET quantity 4 y GET /portfolio", async () => {
      const sell = await api.createOrder({
        instrument_id: instrument.id,
        side: "SELL",
        type: "MARKET",
        quantity: 4,
      })
      expect(sell.status).toBe("FILLED")
      expect((await held())?.quantity).toBe(6)
      expect((await api.portfolio()).cash).toBeCloseTo(
        INITIAL_CASH - 6 * price,
        2
      )
    })

    await test.step("POST /orders BUY LIMIT quantity 10 bajo el mercado y GET /portfolio", async () => {
      const cashBefore = (await api.portfolio()).cash
      const limit = money(price * 0.5)
      await api.createOrder({
        instrument_id: instrument.id,
        side: "BUY",
        type: "LIMIT",
        quantity: 10,
        price: limit,
      })

      const portfolio = await api.portfolio()
      // Reservado (10 x precio límite) o ya liberado; nunca otro valor.
      expect([money(cashBefore - 10 * limit), money(cashBefore)]).toContain(
        money(portfolio.cash)
      )
      // La reserva no crea acciones.
      expect((await held())?.quantity).toBe(6)
    })

    await test.step("GET /portfolio sin el header X-Candidate-Id", async () => {
      const anonymous = await rawClient({"X-Enable-Bugs": tier})
      await expectError(
        await anonymous.get("/portfolio"),
        400,
        "Missing X-Candidate-Id header"
      )
    })
  }
)
