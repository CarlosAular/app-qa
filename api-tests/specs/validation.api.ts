import {qase} from "playwright-qase-reporter"

import {expect, expectError, INITIAL_CASH, tag, test} from "../fixtures"

test(
  qase(
    24,
    "COCOS-24 · El servicio de órdenes rechaza los cuerpos inválidos con el mensaje correcto"
  ),
  async ({api}) => {
    await tag("Validación de órdenes", "critical")
    const {id} = await api.tradable()
    const base = {instrument_id: id, side: "BUY", type: "MARKET", quantity: 1}

    await test.step("POST /orders con quantity ausente, cero o negativa", async () => {
      const {quantity: _omitted, ...withoutQuantity} = base
      for (const body of [
        withoutQuantity,
        {...base, quantity: 0},
        {...base, quantity: -1},
      ]) {
        await expectError(
          await api.placeOrder(body as never),
          400,
          "quantity must be a positive number"
        )
      }
    })

    await test.step("POST /orders con quantity decimal, por ejemplo 2.5", async () => {
      await expectError(
        await api.placeOrder({...base, quantity: 2.5}),
        400,
        "quantity must be a positive integer"
      )
    })

    await test.step("POST /orders con side inválido, y con el cuerpo vacío", async () => {
      const message = "side must be BUY or SELL"
      await expectError(
        await api.placeOrder({...base, side: "HOLD"}),
        400,
        message
      )
      await expectError(await api.placeOrder({} as never), 400, message)
    })

    await test.step("POST /orders con type inválido", async () => {
      await expectError(
        await api.placeOrder({...base, type: "STOP"}),
        400,
        "type must be MARKET or LIMIT"
      )
    })

    await test.step("POST /orders con type LIMIT y sin price", async () => {
      await expectError(
        await api.placeOrder({...base, type: "LIMIT"}),
        400,
        "LIMIT orders require a numeric price"
      )
    })

    await test.step("POST /orders con un instrument_id inexistente, y con instrument_id ausente", async () => {
      const message = "Instrument not found"
      await expectError(
        await api.placeOrder({...base, instrument_id: 999_999}),
        400,
        message
      )
      const {instrument_id: _omitted, ...withoutInstrument} = base
      await expectError(
        await api.placeOrder(withoutInstrument as never),
        400,
        message
      )
    })

    await test.step("GET /orders y GET /portfolio", async () => {
      expect(await api.orders()).toEqual([])
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
    })

    await test.step("POST /orders con side y type en minúsculas, por ejemplo buy y market", async () => {
      const response = await api.placeOrder({
        ...base,
        side: "buy",
        type: "market",
      })
      expect(response.status(), await response.text()).toBe(201)
    })
  }
)
