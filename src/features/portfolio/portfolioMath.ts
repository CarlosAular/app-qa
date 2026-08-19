import type {
  PortfolioPosition,
  PortfolioPositionDirection,
  PortfolioSummary,
} from "./types"

type PortfolioPositionMetricInput = {
  avgCostPrice: number
  lastPrice: number
  quantity: number
}

export const getPortfolioPositionMetrics = ({
  avgCostPrice,
  lastPrice,
  quantity,
}: PortfolioPositionMetricInput) => {
  const costBasis = quantity * avgCostPrice
  const marketValue = quantity * lastPrice
  const gain = quantity * (lastPrice - avgCostPrice)

  return {
    costBasis,
    gain,
    marketValue,
    returnRatio: costBasis <= 0 ? 0 : gain / costBasis,
  }
}

export const getPortfolioPositionDirection = (
  gain: number
): PortfolioPositionDirection => {
  if (gain > 0) {
    return "up"
  }

  if (gain < 0) {
    return "down"
  }

  return "flat"
}

export const getPortfolioSummary = (
  positions: PortfolioPosition[],
  cash: number
): PortfolioSummary => {
  const totals = positions.reduce(
    (summary, position) => {
      return {
        totalCostBasis: summary.totalCostBasis + position.costBasis,
        totalGain: summary.totalGain + position.gain,
        totalMarketValue: summary.totalMarketValue + position.marketValue,
      }
    },
    {
      totalCostBasis: 0,
      totalGain: 0,
      totalMarketValue: 0,
    }
  )

  return {
    cash,
    positions: positions.length,
    ...totals,
    totalReturnRatio:
      totals.totalCostBasis <= 0 ? 0 : totals.totalGain / totals.totalCostBasis,
  }
}
