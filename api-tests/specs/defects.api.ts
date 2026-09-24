import {qase} from "playwright-qase-reporter"

import {expect, tag, test} from "../fixtures"

/*
 * Defectos conocidos del servicio, en tier `off`. Cada test afirma el
 * comportamiento ESPERADO, así que hoy FALLA porque el servicio no lo cumple. Están etiquetados
 * @defecto y quedan fuera de la corrida base: se ejecutan con
 * `bun run test:api:defectos`, donde su resultado en Qase es "failed" hasta que
 * el servicio se corrija.
 */

test(
  qase(
    24,
    "COCOS-24 · El servicio rechaza cantidades no enteras y precios límite no positivos @defecto"
  ),
  async ({api}) => {
    await tag("Defectos conocidos", "normal")
    const {id} = await api.tradable()
    const body = {instrument_id: id, side: "BUY", type: "MARKET"}

    await test.step('POST /orders con quantity como texto "1e3" y luego como true', async () => {
      for (const quantity of ["1e3", true]) {
        const response = await api.placeOrder({...body, quantity} as never)
        expect(response.status(), await response.text()).toBe(400)
      }
    })

    await test.step("POST /orders con type LIMIT y price 0 o negativo", async () => {
      for (const price of [0, -5]) {
        const response = await api.placeOrder({
          ...body,
          type: "LIMIT",
          quantity: 1,
          price,
        })
        expect(response.status(), await response.text()).toBe(400)
      }
    })
  }
)

test(
  qase(
    42,
    "COCOS-42 · El servicio rechaza órdenes sobre instrumentos que no son acciones @defecto"
  ),
  async ({api}) => {
    await tag("Defectos conocidos", "normal")
    const instruments = await api.instruments()
    const ars = instruments.find(i => i.ticker === "ARS")
    const stock = await api.tradable()

    await test.step("GET /instruments y localizar ARS", async () => {
      expect(ars).toBeDefined()
      expect(ars?.type).not.toBe(stock.type)
    })

    await test.step("POST /orders BUY MARKET quantity 1 sobre ARS", async () => {
      const response = await api.placeOrder({
        instrument_id: ars!.id,
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
      expect(response.status(), await response.text()).toBe(400)
    })

    await test.step("GET /portfolio", async () => {
      const portfolio = await api.portfolio()
      expect(portfolio.holdings.find(h => h.ticker === "ARS")).toBeUndefined()
    })

    await test.step("Repetir el POST con una acción normal, para contraste", async () => {
      const order = await api.createOrder({
        instrument_id: stock.id,
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
      expect(order.status).toBe("FILLED")
    })
  }
)
