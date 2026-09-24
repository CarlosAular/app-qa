import {qase} from "playwright-qase-reporter"

import {expect, expectError, INITIAL_CASH, tag, test} from "../fixtures"

test(
  qase(
    51,
    "COCOS-51 · El servicio rechaza las órdenes sin efectivo o sin tenencias suficientes y no mueve nada"
  ),
  async ({api, account}) => {
    await tag("Saldo", "blocker")
    const instrument = await api.tradable()
    const order = (side: string, quantity: number) => ({
      instrument_id: instrument.id,
      side,
      type: "MARKET",
      quantity,
    })

    await test.step("POST /orders BUY MARKET por más de lo que alcanza el efectivo", async () => {
      const quantity = Math.ceil(INITIAL_CASH / instrument.last_price) + 1
      await expectError(
        await api.placeOrder(order("BUY", quantity)),
        400,
        "Insufficient cash"
      )
    })

    await test.step("GET /portfolio y GET /orders", async () => {
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
      expect(await api.orders()).toEqual([])
    })

    await test.step("POST /orders SELL MARKET quantity 1 sin posición", async () => {
      await expectError(
        await api.placeOrder(order("SELL", 1)),
        400,
        "Insufficient shares"
      )
    })

    await test.step("Comprar 2 acciones y luego intentar vender 3", async () => {
      await api.createOrder(order("BUY", 2))
      await expectError(
        await api.placeOrder(order("SELL", 3)),
        400,
        "Insufficient shares"
      )
      const holding = (await api.portfolio()).holdings.find(
        h => h.instrument_id === instrument.id
      )
      expect(holding?.quantity).toBe(2)
    })

    await test.step("Agotar el efectivo y intentar comprar 1 más", async () => {
      const rest = await account()
      const affordable = Math.floor(INITIAL_CASH / instrument.last_price)
      await rest.createOrder(order("BUY", affordable))
      await expectError(
        await rest.placeOrder(order("BUY", 1)),
        400,
        "Insufficient cash"
      )
      expect((await rest.portfolio()).cash).toBeGreaterThanOrEqual(0)
    })
  }
)
