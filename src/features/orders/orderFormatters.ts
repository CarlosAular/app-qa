import type {OrderSide, OrderStatus, OrderType} from "./types"

const ordersDateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
})

const ordersPesoFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 2,
  style: "currency",
})

const ordersQuantityFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
})

export const formatOrdersPeso = (amount: number) =>
  ordersPesoFormatter.format(amount)

export const formatOrdersQuantity = (quantity: number) =>
  ordersQuantityFormatter.format(quantity)

export const getOrdersStatusLabel = (status: OrderStatus) => {
  if (status === "FILLED") {
    return "Ejecutada"
  }

  if (status === "PENDING") {
    return "Pendiente"
  }

  return "Rechazada"
}

export const getOrdersSideLabel = (side: OrderSide) =>
  side === "BUY" ? "Compra" : "Venta"

export const getOrdersTypeLabel = (type: OrderType) =>
  type === "MARKET" ? "Market" : "Límite"

export const formatOrdersDateTime = (isoDate: string) => {
  const date = new Date(isoDate)

  return Number.isNaN(date.getTime())
    ? "—"
    : ordersDateTimeFormatter.format(date)
}
