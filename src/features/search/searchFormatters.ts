const searchPesoFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 2,
  style: "currency",
})

export const formatSearchPeso = (amount: number) =>
  searchPesoFormatter.format(amount)
