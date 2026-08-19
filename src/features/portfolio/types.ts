export type PortfolioPositionDirection = "up" | "down" | "flat"

export type PortfolioPositionApiItem = {
  instrument_id: number
  ticker: string
  quantity: number
  last_price: number
  close_price: number
  avg_cost_price: number
}

export type PortfolioPosition = {
  positionId: string
  instrumentId: number
  ticker: string
  quantity: number
  lastPrice: number
  closePrice: number
  avgCostPrice: number
  costBasis: number
  marketValue: number
  gain: number
  returnRatio: number
  direction: PortfolioPositionDirection
}

export type PortfolioHoldings = {
  cash: number
  positions: PortfolioPosition[]
}

export type PortfolioSummary = {
  cash: number
  positions: number
  totalCostBasis: number
  totalMarketValue: number
  totalGain: number
  totalReturnRatio: number
}
