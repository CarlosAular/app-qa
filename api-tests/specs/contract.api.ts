import {qase} from "playwright-qase-reporter"

import {expect, expectError, parse, tag, test} from "../fixtures"
import {instrumentSchema} from "../schemas"

const HEADER_ERROR = "X-Enable-Bugs must be off, easy, medium, or hard"

test(
  qase(
    20,
    "COCOS-20 · El servicio de instrumentos devuelve el catálogo completo y bien tipado"
  ),
  async ({api, rawClient, tier}) => {
    await tag("Instrumentos y búsqueda", "critical")

    const instruments =
      await test.step("GET /instruments con X-Enable-Bugs: off", async () => {
        const list = await api.instruments() // valida el esquema de cada elemento
        expect(list.length).toBeGreaterThan(0)
        return list
      })

    await test.step("Verificar unicidad y validez del catálogo", async () => {
      expect(new Set(instruments.map(i => i.id)).size).toBe(instruments.length)
      expect(new Set(instruments.map(i => i.ticker)).size).toBe(
        instruments.length
      )
      for (const item of instruments) {
        expect(item.last_price).toBeGreaterThanOrEqual(0)
      }
    })

    await test.step("GET /health: GET / con los headers obligatorios", async () => {
      expect((await api.http.get("/")).status()).toBe(200)
    })

    const search = async (query: string) => {
      const response = await api.http.get("/search", {params: {query}})
      expect(response.status(), await response.text()).toBe(200)
      return parse(instrumentSchema.array(), await response.json())
    }

    await test.step("GET /search?query=DYCA", async () => {
      const found = (await search("DYCA")).find(i => i.ticker === "DYCA")
      expect(found).toEqual(instruments.find(i => i.ticker === "DYCA"))
    })

    await test.step("GET /search?query=YCA", async () => {
      expect((await search("YCA")).map(i => i.ticker)).toContain("DYCA")
    })

    await test.step("GET /search?query=ga (en minúsculas)", async () => {
      const results = await search("ga")
      expect(results.length).toBeGreaterThan(0)
      for (const item of results) {
        expect(`${item.ticker} ${item.name}`.toLowerCase()).toContain("ga")
      }
    })

    await test.step("GET /search?query= (vacío) y GET /search?query=ZZZZ", async () => {
      expect(await search("")).toHaveLength(instruments.length)
      expect(await search("ZZZZ")).toEqual([])
    })

    await test.step('GET /instruments sin X-Enable-Bugs, y con el valor inválido "nope"', async () => {
      await expectError(
        await (await rawClient()).get("/instruments"),
        400,
        HEADER_ERROR
      )
      await expectError(
        await (await rawClient({"X-Enable-Bugs": "nope"})).get("/instruments"),
        400,
        HEADER_ERROR
      )
    })

    await test.step("GET /instruments con X-Enable-Bugs: OFF (mayúsculas)", async () => {
      const upper = await rawClient({"X-Enable-Bugs": tier.toUpperCase()})
      expect((await upper.get("/instruments")).status()).toBe(200)
    })
  }
)
