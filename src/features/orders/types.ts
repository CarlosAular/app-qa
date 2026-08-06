export type OrderSide = "BUY" | "SELL"

export type OrderType = "MARKET" | "LIMIT"

export type OrderQuantityMode = "SHARES" | "ARS"

export type OrderStatus = "PENDING" | "REJECTED" | "FILLED"

export type OrdersInstrument = {
  id: number
  ticker: string
  name: string
  type: string
  lastPrice: number
}

export type CreateOrderPayload = {
  instrument_id: number
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
}

export type CreateOrderResponse = {
  id: string
  status: OrderStatus
}

export type OrdersHistoryOrder = {
  id: string
  instrumentId: number
  side: OrderSide
  type: OrderType
  quantity: number
  price: number
  status: OrderStatus
  createdAt: string
}

/** A history order joined with its instrument, ready for display. */
export type OrdersHistoryEntry = OrdersHistoryOrder & {
  notional: number
  ticker: string
}
