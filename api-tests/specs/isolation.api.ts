import {qase} from "playwright-qase-reporter"

import {expect, expectError, INITIAL_CASH, tag, test} from "../fixtures"

test(
  qase(35, "COCOS-35 · El servicio aísla cada cuenta por su X-Candidate-Id"),
  async ({api, account, rawClient, tier}) => {
    await tag("Aislamiento de cuentas", "critical")
    const instrument = await api.tradable()

    await test.step("GET /portfolio y GET /orders con un identificador que nunca se usó", async () => {
      const portfolio = await api.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
      expect(await api.orders()).toEqual([])
    })

    await test.step("Con esa cuenta (A), POST /orders BUY MARKET quantity 1", async () => {
      const order = await api.createOrder({
        instrument_id: instrument.id,
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
      expect(order.status).toBe("FILLED")
    })

    await test.step("Leer portfolio y orders de la cuenta A", async () => {
      expect(await api.orders()).toHaveLength(1)
      expect((await api.portfolio()).holdings).toHaveLength(1)
    })

    await test.step("Leer portfolio y orders con un segundo identificador (cuenta B)", async () => {
      const other = await account()
      expect(other.candidateId).not.toBe(api.candidateId)
      expect(await other.orders()).toEqual([])
      const portfolio = await other.portfolio()
      expect(portfolio.cash).toBe(INITIAL_CASH)
      expect(portfolio.holdings).toEqual([])
    })

    await test.step("Repetir la lectura de A con el mismo identificador en mayúsculas", async () => {
      const upper = await account(api.candidateId.toUpperCase())
      expect(upper.candidateId).not.toBe(api.candidateId)
      expect(await upper.orders()).toEqual([])
    })

    await test.step("GET /portfolio y GET /orders sin el header X-Candidate-Id", async () => {
      const anonymous = await rawClient({"X-Enable-Bugs": tier})
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
