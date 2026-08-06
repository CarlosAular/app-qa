import {z} from "zod"

import {api} from "@/config/api.config"

import {
  getMarketsDailyReturnPercent,
  getMarketsInstrumentDirection,
} from "../marketMath"
import type {MarketsInstrument} from "../types"

const marketsInstrumentApiItemSchema = z.object({
  close_price: z.number(),
  id: z.number(),
  last_price: z.number(),
  name: z.string(),
  ticker: z.string(),
  type: z.string(),
})

export type MarketsInstrumentApiItem = z.infer<
  typeof marketsInstrumentApiItemSchema
>

export type MarketsInstrumentsResponse = z.infer<
  typeof marketsInstrumentsResponseSchema
>

const marketsInstrumentsResponseSchema = z.array(marketsInstrumentApiItemSchema)

const toMarketsInstrument = (
  item: MarketsInstrumentApiItem
): MarketsInstrument => {
  const dailyReturnPercent = getMarketsDailyReturnPercent({
    closePrice: item.close_price,
    lastPrice: item.last_price,
  })

  return {
    closePrice: item.close_price,
    dailyReturnPercent,
    direction: getMarketsInstrumentDirection(dailyReturnPercent),
    id: item.id,
    lastPrice: item.last_price,
    name: item.name,
    ticker: item.ticker,
    type: item.type,
  }
}

export const getMarketsInstruments = async (): Promise<MarketsInstrument[]> => {
  const response = await api.get("/instruments")
  const parsed = marketsInstrumentsResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error("Invalid instruments response")
  }

  return parsed.data.map(toMarketsInstrument)
}
