import type {
  OrdersHistoryEntry,
  OrdersHistoryOrder,
  OrdersInstrument,
} from "./types"

type OrdersInstrumentRef = Pick<OrdersInstrument, "id" | "ticker">

/**
 * Newest first. The API returns orders in creation order, but the list is not
 * guaranteed to stay sorted, so the UI sorts explicitly. `created_at` can tie
 * when several orders land in the same millisecond, so id breaks the tie to
 * keep the order stable across renders.
 */
export const sortOrdersHistoryByNewest = <T extends OrdersHistoryOrder>(
  orders: T[]
): T[] =>
  [...orders].sort((left, right) => {
    const byCreatedAt = right.createdAt.localeCompare(left.createdAt)

    return byCreatedAt === 0 ? right.id.localeCompare(left.id) : byCreatedAt
  })

export const getOrdersHistoryEntries = (
  orders: OrdersHistoryOrder[],
  instruments: OrdersInstrumentRef[]
): OrdersHistoryEntry[] => {
  const tickersByInstrumentId = new Map(
    instruments.map(instrument => [instrument.id, instrument.ticker])
  )

  return sortOrdersHistoryByNewest(orders).map(order => ({
    ...order,
    notional: order.price * order.quantity,
    ticker: tickersByInstrumentId.get(order.instrumentId) ?? "N/D",
  }))
}
