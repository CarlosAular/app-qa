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

export type BugsTier = "off" | "easy" | "medium" | "hard"

export type OrderBody = {
  instrument_id: number
  side: string
  type: string
  quantity: number
  price?: number
}

/** Valida contra el esquema y falla con el detalle de zod si el contrato cambió. */
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

export class CocosApi {
  constructor(
    readonly http: APIRequestContext,
    readonly candidateId: string
  ) {}

  instruments = async (): Promise<Instrument[]> =>
    parse(
      instrumentSchema.array(),
      await (await this.http.get("/instruments")).json()
    )

  portfolio = async (): Promise<Portfolio> =>
    parse(portfolioSchema, await (await this.http.get("/portfolio")).json())

  orders = async (): Promise<Order[]> =>
    parse(orderSchema.array(), await (await this.http.get("/orders")).json())

  /** Devuelve la respuesta cruda: los tests de validación necesitan el status. */
  placeOrder = (body: OrderBody): Promise<APIResponse> =>
    this.http.post("/orders", {data: body})

  /** Crea una orden que debe ser válida y devuelve la orden ya validada. */
  createOrder = async (body: OrderBody): Promise<Order> => {
    const response = await this.placeOrder(body)
    expect(response.status(), await response.text()).toBeLessThan(300)
    return parse(orderSchema, await response.json())
  }

  /** Un instrumento operable (ACCIONES) con precio > 0, para armar órdenes. */
  tradable = async (): Promise<Instrument> => {
    const all = await this.instruments()
    const found = all.find(i => i.type === "ACCIONES" && i.last_price > 0)
    if (!found) throw new Error("No hay instrumentos ACCIONES operables")
    return found
  }
}

type Options = {tier: BugsTier}
type Fixtures = {
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
  tier: ["off", {option: true}],
  api: async ({account}, use) => {
    await use(await account())
  },
  account: async ({playwright, baseURL, tier}, use) => {
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
    await Promise.all(contexts.map(http => http.dispose()))
  },
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

/** Redondeo a centavos para comparar montos en ARS sin ruido de coma flotante. */
export const money = (value: number): number => Math.round(value * 100) / 100

export const INITIAL_CASH = 1_000_000
