export type MarketsInstrumentDirection = "up" | "down" | "flat"

export type MarketsInstrumentApiItem = {
  id: number
  ticker: string
  name: string
  type: string
  last_price: number
  close_price: number
}

export type MarketsInstrument = {
  id: number
  ticker: string
  name: string
  type: string
  lastPrice: number
  closePrice: number
  dailyReturnPercent: number
  direction: MarketsInstrumentDirection
}

export type MarketsSummary = {
  total: number
  up: number
  down: number
}
