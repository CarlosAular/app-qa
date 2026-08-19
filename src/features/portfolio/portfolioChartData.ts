import type {PortfolioPositionDirection} from "./types"

/** Mirrors dark theme tokens in src/global.css */
const PORTFOLIO_CHART_PROFIT_COLOR = "#34d399"
const PORTFOLIO_CHART_LOSS_COLOR = "#fb7185"
const PORTFOLIO_CHART_NEUTRAL_COLOR = "#38bdf8"

export type PortfolioChartPoint = {
  label: string
  point: number
  price: number
}

type BuildPortfolioChartDataArgs = {
  avgCostPrice: number
  closePrice: number
  lastPrice: number
}

export const buildPortfolioChartData = ({
  avgCostPrice,
  closePrice,
  lastPrice,
}: BuildPortfolioChartDataArgs): PortfolioChartPoint[] => [
  {point: 0, price: avgCostPrice, label: "PPP"},
  {point: 1, price: closePrice, label: "Cierre"},
  {point: 2, price: lastPrice, label: "Último"},
]

export const getPortfolioChartLineColor = (
  direction: PortfolioPositionDirection
) => {
  if (direction === "up") {
    return PORTFOLIO_CHART_PROFIT_COLOR
  }

  if (direction === "down") {
    return PORTFOLIO_CHART_LOSS_COLOR
  }

  return PORTFOLIO_CHART_NEUTRAL_COLOR
}

export const getPortfolioChartAccessibilityLabel = ({
  avgCostPrice,
  closePrice,
  gain,
  lastPrice,
  ticker,
}: {
  avgCostPrice: number
  closePrice: number
  gain: number
  lastPrice: number
  ticker: string
}) =>
  `${ticker}: precio promedio ${avgCostPrice}, cierre ${closePrice}, último ${lastPrice}, ganancia ${gain}`
