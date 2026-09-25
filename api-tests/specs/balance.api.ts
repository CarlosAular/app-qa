// Endpoints: POST /orders, GET /orders, GET /portfolio
// Verifica que el servicio rechace operaciones sin fondos o tenencias suficientes sin alterar el estado.

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
      // calcula la quantity mínima que supera el efectivo disponible
      const quantity = Math.ceil(INITIAL_CASH / instrument.last_price) + 1
      // POST /orders — debe rechazar con 400 y mensaje "Insufficient cash"
      await expectError(
        await api.placeOrder(order("BUY", quantity)),
        400,
        "Insufficient cash"
      )
    })

    await test.step("GET /portfolio y GET /orders", async () => {
      // GET /portfolio — el cash no se movió: la orden rechazada no alteró el estado
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
      // GET /orders — ninguna orden quedó registrada
      expect(await api.orders()).toEqual([])
    })

    await test.step("POST /orders SELL MARKET quantity 1 sin posición", async () => {
      // POST /orders — debe rechazar con 400 porque no hay tenencias
      await expectError(
        await api.placeOrder(order("SELL", 1)),
        400,
        "Insufficient shares"
      )
    })

    await test.step("Comprar 2 acciones y luego intentar vender 3", async () => {
      // POST /orders BUY MARKET — establece posición de 2 acciones
      await api.createOrder(order("BUY", 2))
      // POST /orders SELL MARKET — debe fallar con 400 porque solo hay 2
      await expectError(
        await api.placeOrder(order("SELL", 3)),
        400,
        "Insufficient shares"
      )
      // GET /portfolio — la posición no cambió pese al intento fallido
      const holding = (await api.portfolio()).holdings.find(
        h => h.instrument_id === instrument.id
      )
      expect(holding?.quantity).toBe(2)
    })

    await test.step("Agotar el efectivo y intentar comprar 1 más", async () => {
      // cuenta nueva para no mezclar estado con la cuenta principal
      const rest = await account()
      const affordable = Math.floor(INITIAL_CASH / instrument.last_price)
      // POST /orders BUY MARKET — compra la máxima cantidad posible con el saldo inicial
      await rest.createOrder(order("BUY", affordable))
      // POST /orders BUY MARKET — debe fallar con 400: el saldo residual no alcanza para 1 más
      await expectError(
        await rest.placeOrder(order("BUY", 1)),
        400,
        "Insufficient cash"
      )
      // GET /portfolio — el cash restante es >= 0 (puede haber sobrado algo por redondeo)
      expect((await rest.portfolio()).cash).toBeGreaterThanOrEqual(0)
    })
  }
)
