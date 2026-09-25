// Endpoints: GET /instruments, GET /search, GET /
// Verifica el contrato del catálogo: forma, tipos, unicidad y búsqueda por texto.

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
        // GET /instruments — valida el esquema de cada elemento con Zod
        const list = await api.instruments() // valida el esquema de cada elemento
        // verifica que el catálogo no esté vacío
        expect(list.length).toBeGreaterThan(0)
        return list
      })

    // GET /instruments — ids y tickers únicos, last_price >= 0 en todos los items
    await test.step("Verificar unicidad y validez del catálogo", async () => {
      // no deben existir dos instrumentos con el mismo id
      expect(new Set(instruments.map(i => i.id)).size).toBe(instruments.length)
      // no deben existir dos instrumentos con el mismo ticker
      expect(new Set(instruments.map(i => i.ticker)).size).toBe(
        instruments.length
      )
      // ningún instrumento puede tener precio negativo
      for (const item of instruments) {
        expect(item.last_price).toBeGreaterThanOrEqual(0)
      }
    })

    await test.step("GET /health: GET / con los headers obligatorios", async () => {
      // GET / — health check: el servicio responde 200 con los headers correctos
      expect((await api.http.get("/")).status()).toBe(200)
    })

    // GET /search — búsqueda exacta, substring y case-insensitive; query vacío devuelve todo
    const search = async (query: string) => {
      const response = await api.http.get("/search", {params: {query}})
      expect(response.status(), await response.text()).toBe(200)
      return parse(instrumentSchema.array(), await response.json())
    }

    await test.step("GET /search?query=DYCA", async () => {
      // GET /search — búsqueda exacta: debe retornar el mismo objeto que /instruments para DYCA
      const found = (await search("DYCA")).find(i => i.ticker === "DYCA")
      expect(found).toEqual(instruments.find(i => i.ticker === "DYCA"))
    })

    await test.step("GET /search?query=YCA", async () => {
      // GET /search — búsqueda por substring: "YCA" debe incluir DYCA en los resultados
      expect((await search("YCA")).map(i => i.ticker)).toContain("DYCA")
    })

    await test.step("GET /search?query=ga (en minúsculas)", async () => {
      // GET /search — búsqueda case-insensitive: "ga" debe encontrar resultados en ticker o name
      const results = await search("ga")
      expect(results.length).toBeGreaterThan(0)
      for (const item of results) {
        expect(`${item.ticker} ${item.name}`.toLowerCase()).toContain("ga")
      }
    })

    await test.step("GET /search?query= (vacío) y GET /search?query=ZZZZ", async () => {
      // GET /search — query vacío devuelve el catálogo completo
      expect(await search("")).toHaveLength(instruments.length)
      // GET /search — query sin coincidencias devuelve array vacío
      expect(await search("ZZZZ")).toEqual([])
    })

    await test.step('GET /instruments sin X-Enable-Bugs, y con el valor inválido "nope"', async () => {
      // GET /instruments sin header — debe rechazar con 400
      await expectError(
        await (await rawClient()).get("/instruments"),
        400,
        HEADER_ERROR
      )
      // GET /instruments con tier inválido — debe rechazar con 400
      await expectError(
        await (await rawClient({"X-Enable-Bugs": "nope"})).get("/instruments"),
        400,
        HEADER_ERROR
      )
    })

    await test.step("GET /instruments con X-Enable-Bugs: OFF (mayúsculas)", async () => {
      // GET /instruments — el header es case-insensitive en su valor: OFF == off
      const upper = await rawClient({"X-Enable-Bugs": tier.toUpperCase()})
      expect((await upper.get("/instruments")).status()).toBe(200)
    })
  }
)
