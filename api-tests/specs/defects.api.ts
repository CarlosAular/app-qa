// Endpoints: POST /orders, GET /orders, GET /portfolio, GET /instruments
// Documenta bugs conocidos del servicio (tier off). Cada test afirma el comportamiento ESPERADO,
// por eso falla hoy. Se corren con `bun run test:api:defectos` (API_DEFECTS=1).

import {qase} from "playwright-qase-reporter"

import {expect, money, tag, test} from "../fixtures"

/*
 * Defectos conocidos del servicio, en tier `off`. Cada test afirma el
 * comportamiento ESPERADO, así que hoy FALLA porque el servicio no lo cumple. Están etiquetados
 * @defecto y quedan fuera de la corrida base: se ejecutan con
 * `bun run test:api:defectos`, donde su resultado en Qase es "failed" hasta que
 * el servicio se corrija.
 */

// POST /orders — el servicio acepta quantity como string/boolean y price <= 0 en LIMIT; debería responder 400
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

// POST /orders + GET /instruments + GET /portfolio — el servicio permite operar con ARS (no es una acción); debería responder 400
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

// POST /orders SELL LIMIT + GET /portfolio — con una venta pendiente que reserva todas las acciones,
// el servicio omite la tenencia en GET /portfolio; debería seguir mostrándola
test(
  qase(
    53,
    "COCOS-53 · La posición sigue visible mientras una venta límite reserva todas sus acciones @defecto"
  ),
  async ({api}) => {
    await tag("Defectos conocidos", "normal")
    const instrument = await api.tradable()
    const quantity = 10
    const held = async () =>
      (await api.portfolio()).holdings.find(h => h.ticker === instrument.ticker)

    await test.step(`POST /orders BUY MARKET quantity ${quantity} y GET /portfolio`, async () => {
      const buy = await api.createOrder({
        instrument_id: instrument.id,
        side: "BUY",
        type: "MARKET",
        quantity,
      })
      expect(buy.status).toBe("FILLED")
      expect((await held())?.quantity).toBe(quantity)
    })

    /*
     * La orden límite se resuelve al LEER la cuenta, con un factor aleatorio: si
     * para cuando se lee el portafolio ya se resolvió, la lectura no dice nada
     * de la reserva. Solo cuenta si GET /orders la sigue mostrando PENDING, y
     * como una orden nunca vuelve a PENDING, entonces también lo estaba cuando
     * se leyó el portafolio. Si no, se repite con una orden nueva.
     */
    let orderId: number | undefined
    let observed: string[] = []

    for (let attempt = 1; attempt <= 5 && orderId === undefined; attempt += 1) {
      await test.step(`Intento ${attempt}: POST /orders SELL LIMIT quantity ${quantity} muy por encima del mercado`, async () => {
        const sell = await api.createOrder({
          instrument_id: instrument.id,
          side: "SELL",
          type: "LIMIT",
          quantity,
          price: money(instrument.last_price * 3),
        })
        expect(sell.status).toBe("PENDING")

        observed = (await api.portfolio()).holdings.map(h => h.ticker)

        const current = (await api.orders()).find(o => o.id === sell.id)
        if (current?.status === "PENDING") {
          orderId = sell.id
        }
      })
    }

    test.skip(
      orderId === undefined,
      "No se llegó a observar el portafolio con la venta pendiente en cinco intentos: resultado no concluyente"
    )

    await test.step("Con la venta pendiente, GET /portfolio sigue incluyendo el instrumento", async () => {
      expect
        .soft(
          observed,
          "el servicio omite la tenencia cuando la reserva iguala a las acciones que hay"
        )
        .toContain(instrument.ticker)
    })

    await test.step("Al resolverse la orden, la posición vuelve con todas las acciones", async () => {
      let status = "PENDING"
      for (let read = 0; read < 40 && status === "PENDING"; read += 1) {
        status = (await api.orders()).find(o => o.id === orderId)!.status
      }
      expect(status).toBe("REJECTED")
      expect((await held())?.quantity).toBe(quantity)
    })
  }
)
