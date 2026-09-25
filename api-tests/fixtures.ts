/*
 * FIXTURES: todo lo que cada test recibe ya preparado, para que los tests se
 * lean como reglas de negocio y no como llamadas HTTP.
 *
 * Mapa del archivo:
 *   1. parse         valida una respuesta contra su esquema (schemas.ts).
 *   2. CocosApi      el "control remoto" de la API: un método por operación.
 *   3. test          el test de Playwright extendido con tres herramientas:
 *                    `api`, `account` y `rawClient`.
 *   4. expectError   comprueba que un rechazo tenga el status y mensaje justos.
 *   5. helpers       tag (reporte Allure), money e INITIAL_CASH.
 *
 * Qué método de CocosApi usa cada endpoint y con qué esquema se valida:
 *   instruments()  GET  /instruments  instrumentSchema
 *   portfolio()    GET  /portfolio    portfolioSchema
 *   orders()       GET  /orders       orderSchema (lista)
 *   placeOrder()   POST /orders       sin validar: devuelve la respuesta cruda
 *   createOrder()  POST /orders       orderSchema
 *   (GET /search y GET / se llaman directo desde el test de contrato.)
 */
import {
  test as base,
  expect,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test"
import {randomUUID} from "node:crypto"

import type {z} from "zod"

import {
  errorSchema,
  instrumentSchema,
  orderSchema,
  portfolioSchema,
  type Instrument,
  type Order,
  type Portfolio,
} from "./schemas"

/**
 * Nivel de defectos que el servicio inyecta a propósito (header X-Enable-Bugs).
 * `off` es la línea base sin defectos; easy, medium y hard son cada vez más
 * difíciles de detectar.
 */
export type BugsTier = "off" | "easy" | "medium" | "hard"

/**
 * Los datos que se envían para crear una orden. `side` y `type` son texto
 * libre a propósito: los tests de validación necesitan mandar valores
 * inválidos. `price` solo se usa en órdenes LIMIT.
 */
export type OrderBody = {
  instrument_id: number
  side: string
  type: string
  quantity: number
  price?: number
}

/**
 * Valida contra el esquema y falla con el detalle de zod si el contrato cambió.
 * Ejemplo: si la API devolviera `quantity: -3`, el test se detiene acá con
 * "Contrato roto" y dice qué campo está mal.
 */
export const parse = <T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Contrato roto: ${result.error.message}`)
  }
  return result.data
}

/**
 * El "control remoto" de la API de Cocos. Cada método hace una operación de
 * negocio (ver el catálogo, crear una orden) y el test no se ocupa del HTTP.
 * Cada instancia queda atada a una cuenta, identificada por `candidateId`.
 */
export class CocosApi {
  constructor(
    readonly http: APIRequestContext,
    readonly candidateId: string
  ) {}

  /** Catálogo completo de instrumentos (GET /instruments), ya validado. */
  instruments = async (): Promise<Instrument[]> =>
    parse(
      instrumentSchema.array(),
      await (await this.http.get("/instruments")).json()
    )

  /** Efectivo y posiciones de la cuenta (GET /portfolio), ya validado. */
  portfolio = async (): Promise<Portfolio> =>
    parse(portfolioSchema, await (await this.http.get("/portfolio")).json())

  /** Todas las órdenes de la cuenta (GET /orders), ya validadas. */
  orders = async (): Promise<Order[]> =>
    parse(orderSchema.array(), await (await this.http.get("/orders")).json())

  /**
   * Envía una orden (POST /orders) y devuelve la respuesta cruda, sea éxito o
   * rechazo: los tests de validación necesitan ver el status.
   */
  placeOrder = (body: OrderBody): Promise<APIResponse> =>
    this.http.post("/orders", {data: body})

  /** Crea una orden que debe ser válida y devuelve la orden ya validada. */
  createOrder = async (body: OrderBody): Promise<Order> => {
    const response = await this.placeOrder(body)
    expect(response.status(), await response.text()).toBeLessThan(300)
    return parse(orderSchema, await response.json())
  }

  /**
   * Un instrumento operable (ACCIONES) con precio > 0, para armar órdenes. Se
   * busca en el catálogo en vez de fijar uno, así el test no depende de que un
   * ticker concreto exista.
   */
  tradable = async (): Promise<Instrument> => {
    const all = await this.instruments()
    const found = all.find(i => i.type === "ACCIONES" && i.last_price > 0)
    if (!found) throw new Error("No hay instrumentos ACCIONES operables")
    return found
  }
}

/** Ajuste de la corrida: contra qué nivel de defectos se prueba. */
type Options = {tier: BugsTier}
/** Las herramientas que un test puede pedir en su primera línea. */
type Fixtures = {
  /** La cuenta propia del test, nueva y con todos los headers ya puestos. */
  api: CocosApi
  /** Otra cuenta (otro X-Candidate-Id) contra el mismo servicio y tier. */
  account: (candidateId?: string) => Promise<CocosApi>
  /** Cliente con los headers que se le pasen, sin los obligatorios por defecto. */
  rawClient: (headers?: Record<string, string>) => Promise<APIRequestContext>
}

/**
 * Cada test recibe un X-Candidate-Id NUEVO: una cuenta virgen de 1.000.000 ARS.
 * Así no dependemos de POST /reset (que en un entorno real no existe) ni hay
 * estado compartido entre tests paralelos.
 */
export const test = base.extend<Options & Fixtures>({
  // Por defecto `off`; la configuración lo cambia según API_TIERS.
  tier: ["off", {option: true}],
  // `api` es simplemente una cuenta nueva.
  api: async ({account}, use) => {
    await use(await account())
  },
  // Crea una cuenta: un cliente HTTP con los dos headers obligatorios
  // (nivel de bugs e identificador de cuenta). Sin id, genera uno único.
  account: async ({playwright, baseURL, tier}, use) => {
    // Se guardan los clientes creados para cerrarlos al terminar el test.
    const contexts: APIRequestContext[] = []
    await use(async (candidateId = `api-${randomUUID()}`) => {
      const http = await playwright.request.newContext({
        baseURL,
        extraHTTPHeaders: {
          "X-Enable-Bugs": tier,
          "X-Candidate-Id": candidateId,
        },
      })
      contexts.push(http)
      return new CocosApi(http, candidateId)
    })
    // Limpieza: cierra los clientes al terminar el test.
    await Promise.all(contexts.map(http => http.dispose()))
  },
  // Cliente "desnudo": sirve para probar qué responde el servicio cuando
  // faltan los headers obligatorios o traen un valor inválido.
  rawClient: async ({playwright, baseURL}, use) => {
    const contexts: APIRequestContext[] = []
    await use(async (headers = {}) => {
      const http = await playwright.request.newContext({
        baseURL,
        extraHTTPHeaders: headers,
      })
      contexts.push(http)
      return http
    })
    await Promise.all(contexts.map(http => http.dispose()))
  },
})

/** Espera un rechazo del servicio: status y mensaje exactos del contrato. */
export const expectError = async (
  response: APIResponse,
  status: number,
  message: string
) => {
  expect(response.status(), await response.text()).toBe(status)
  expect(parse(errorSchema, await response.json()).error).toBe(message)
}

export {expect}

export type Severity = "blocker" | "critical" | "normal" | "minor" | "trivial"

/** Etiquetas de Allure: el reporte agrupa por feature y ordena por severidad. */
export const tag = async (feature: string, severity: Severity) => {
  const allure = await import("allure-js-commons")
  await allure.epic("Cocos API")
  await allure.feature(feature)
  await allure.severity(severity)
}

/**
 * Redondeo a centavos para comparar montos en ARS. La computadora suma
 * decimales con pequeños errores (0.1 + 0.2 da 0.30000000000000004) y este
 * redondeo evita falsos fallos.
 */
export const money = (value: number): number => Math.round(value * 100) / 100

/** Efectivo con el que arranca toda cuenta nueva: 1.000.000 de pesos. */
export const INITIAL_CASH = 1_000_000
