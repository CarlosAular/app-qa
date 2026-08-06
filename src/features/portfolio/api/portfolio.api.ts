import {z} from "zod"

import {api} from "@/config/api.config"

import {
  getPortfolioPositionDirection,
  getPortfolioPositionMetrics,
} from "../portfolioMath"
import type {
  PortfolioHoldings,
  PortfolioPosition,
  PortfolioPositionApiItem,
} from "../types"

const portfolioPositionApiItemSchema = z.object({
  avg_cost_price: z.number(),
  close_price: z.number(),
  instrument_id: z.number(),
  last_price: z.number(),
  quantity: z.number(),
  ticker: z.string(),
})

const portfolioResponseSchema = z.object({
  cash: z.number(),
  holdings: z.array(portfolioPositionApiItemSchema),
})

const toPortfolioPosition = (
  item: PortfolioPositionApiItem,
  index: number
): PortfolioPosition => {
  const metrics = getPortfolioPositionMetrics({
    avgCostPrice: item.avg_cost_price,
    lastPrice: item.last_price,
    quantity: item.quantity,
  })

  return {
    avgCostPrice: item.avg_cost_price,
    closePrice: item.close_price,
    direction: getPortfolioPositionDirection(metrics.gain),
    instrumentId: item.instrument_id,
    lastPrice: item.last_price,
    positionId: `${item.instrument_id}-${index}`,
    quantity: item.quantity,
    ticker: item.ticker,
    ...metrics,
  }
}

export const getPortfolioHoldings = async (): Promise<PortfolioHoldings> => {
  const response = await api.get("/portfolio")
  const parsed = portfolioResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error("Invalid portfolio response")
  }

  return {
    cash: parsed.data.cash,
    positions: parsed.data.holdings.map(toPortfolioPosition),
  }
}
