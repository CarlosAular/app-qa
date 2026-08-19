const marketsPesoFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 2,
  style: "currency",
})

export const formatMarketsPeso = (amount: number) =>
  marketsPesoFormatter.format(amount)

export const formatMarketsPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
