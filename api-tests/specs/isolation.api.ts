// Endpoints: POST /orders, GET /orders, GET /portfolio
// Verifica el aislamiento por X-Candidate-Id: cada cuenta es independiente y el header es obligatorio y case-sensitive.

import {qase} from "playwright-qase-reporter"

import {expect, expectError, INITIAL_CASH, tag, test} from "../fixtures"

test(
  qase(35, "COCOS-35 · El servicio aísla cada cuenta por su X-Candidate-Id"),
  async ({api, account, rawClient, tier}) => {
    await tag("Aislamiento de cuentas", "critical")
    const instrument = await api.tradable()

    await test.step("GET /portfolio y GET /orders con un identificador que nunca se usó", async () => {
      // GET /portfolio — cuenta nueva: cash igual al saldo inicial, sin tenencias
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
      // GET /orders — cuenta nueva: historial de órdenes vacío
      expect(await api.orders()).toEqual([])
    })

    await test.step("Con esa cuenta (A), POST /orders BUY MARKET quantity 1", async () => {
      // POST /orders — crea una orden válida que debe ejecutarse al instante
      const order = await api.createOrder({
        instrument_id: instrument.id,
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
      // la orden de mercado se completa de inmediato
      expect(order.status).toBe("FILLED")
    })

    await test.step("Leer portfolio y orders de la cuenta A", async () => {
      // GET /orders — la orden de compra queda registrada en el historial
      expect(await api.orders()).toHaveLength(1)
      // GET /portfolio — la compra generó una tenencia
      expect((await api.portfolio()).holdings).toHaveLength(1)
    })

    await test.step("Leer portfolio y orders con un segundo identificador (cuenta B)", async () => {
      // cuenta B: distinto X-Candidate-Id → no debe ver nada de lo que hizo A
      const other = await account()
      expect(other.candidateId).not.toBe(api.candidateId)
      // GET /orders — cuenta B sin operaciones
      expect(await other.orders()).toEqual([])
      // GET /portfolio — cuenta B con saldo inicial intacto
      const portfolio = await other.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
    })

    // GET /orders + GET /portfolio — X-Candidate-Id es case-sensitive: mayúsculas = cuenta distinta
    await test.step("Repetir la lectura de A con el mismo identificador en mayúsculas", async () => {
      // el header X-Candidate-Id distingue mayúsculas: "ABC" y "abc" son cuentas distintas
      const upper = await account(api.candidateId.toUpperCase())
      expect(upper.candidateId).not.toBe(api.candidateId)
      // GET /orders — la cuenta con el id en mayúsculas no tiene órdenes
      expect(await upper.orders()).toEqual([])
    })

    await test.step("GET /portfolio y GET /orders sin el header X-Candidate-Id", async () => {
      const anonymous = await rawClient({"X-Enable-Bugs": tier})
      // GET /portfolio y GET /orders — sin el header debe responder 400
      for (const path of ["/portfolio", "/orders"]) {
        await expectError(
          await anonymous.get(path),
          400,
          "Missing X-Candidate-Id header"
        )
      }
    })
  }
)
