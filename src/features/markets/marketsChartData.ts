export type MarketsChartPoint = {
  label: string
  point: number
  price: number
}

type BuildMarketsChartDataArgs = {
  closePrice: number
  lastPrice: number
}

export const buildMarketsChartData = ({
  closePrice,
  lastPrice,
}: BuildMarketsChartDataArgs): MarketsChartPoint[] => [
  {point: 0, price: closePrice, label: "Cierre"},
  {point: 1, price: lastPrice, label: "Último"},
]

export const getMarketsChartAccessibilityLabel = ({
  closePrice,
  dailyReturnPercent,
  lastPrice,
  ticker,
}: {
  closePrice: number
  dailyReturnPercent: number
  lastPrice: number
  ticker: string
}) =>
  `${ticker}: cierre ${closePrice}, último ${lastPrice}, variación del día ${dailyReturnPercent.toFixed(2)} por ciento`
