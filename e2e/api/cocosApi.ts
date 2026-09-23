import axios, {type AxiosInstance} from "axios"

import {readBuildInfo, type E2ePlatform} from "../config/buildInfo"

export type ApiOrder = {
  id: number
  candidate_id: string
  instrument_id: number
  side: "BUY" | "SELL"
  type: "MARKET" | "LIMIT"
  quantity: number
  price: number
  status: "FILLED" | "PENDING" | "REJECTED"
  created_at: string
}

export type ApiHolding = {
  instrument_id: number
  ticker: string
  quantity: number
  last_price: number
  close_price: number
  avg_cost_price: number
}

export type ApiPortfolio = {cash: number; holdings: ApiHolding[]}

export type ApiInstrument = {
  id: number
  ticker: string
  name: string
  type: string
  last_price: number
  close_price: number
}

export type CreateOrderBody = {
  instrument_id: number
  side: "BUY" | "SELL"
  type: "MARKET" | "LIMIT"
  quantity: number
  price?: number
}

let client: AxiosInstance | null = null
let tenant = ""

const platform = () => (process.env.E2E_PLATFORM ?? "android") as E2ePlatform

/**
 * Cliente HTTP del PROCESO DE TEST, no de la app.
 *
 * Apunta al MISMO tenant que quedó horneado en el binario (lo lee del
 * build-info que escribió el script de build). Nunca se recalcula acá: si el
 * candidate id del test no coincide con el del binario, las aserciones miden
 * una cuenta y la app mueve otra.
 */
export const cocosApi = (): AxiosInstance => {
  if (client) {
    return client
  }

  const info = readBuildInfo(platform())
  tenant = info.candidateId

  client = axios.create({
    baseURL: info.apiUrl,
    timeout: 20_000,
    headers: {
      "Content-Type": "application/json",
      "X-Candidate-Id": info.candidateId,
      "X-Enable-Bugs": info.bugsTier,
    },
  })

  return client
}

export const candidateId = (): string => {
  cocosApi()
  return tenant
}

export const getInstruments = async (): Promise<ApiInstrument[]> =>
  (await cocosApi().get<ApiInstrument[]>("/instruments")).data

export const getPortfolio = async (): Promise<ApiPortfolio> =>
  (await cocosApi().get<ApiPortfolio>("/portfolio")).data

export const getOrders = async (): Promise<ApiOrder[]> =>
  (await cocosApi().get<ApiOrder[]>("/orders")).data

export const createOrder = async (body: CreateOrderBody): Promise<ApiOrder> =>
  (await cocosApi().post<ApiOrder>("/orders", body)).data

/*
 * NO hay wrapper de POST /reset, a propósito.
 *
 * La consigna del challenge lo prohíbe explícitamente. El aislamiento se
 * consigue con un X-Candidate-Id nuevo por build (cada id es una cuenta
 * virgen) y con aserciones por delta en vez de absolutas.
 */
