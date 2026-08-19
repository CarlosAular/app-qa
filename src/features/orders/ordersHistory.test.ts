// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  getOrdersHistoryEntries,
  sortOrdersHistoryByNewest,
} from "./ordersHistory"
import type {OrdersHistoryOrder} from "./types"

const buildOrder = (
  overrides: Partial<OrdersHistoryOrder> = {}
): OrdersHistoryOrder => ({
  createdAt: "2026-08-05T10:00:00.000Z",
  id: "1",
  instrumentId: 1,
  price: 45.72,
  quantity: 10,
  side: "BUY",
  status: "FILLED",
  type: "MARKET",
  ...overrides,
})

const instruments = [
  {id: 1, ticker: "DYCA"},
  {id: 5, ticker: "MIRG"},
]

describe("ordersHistory", () => {
  it("sorts orders newest first regardless of api order", () => {
    const sorted = sortOrdersHistoryByNewest([
      buildOrder({createdAt: "2026-08-05T10:00:00.000Z", id: "1"}),
      buildOrder({createdAt: "2026-08-05T12:00:00.000Z", id: "3"}),
      buildOrder({createdAt: "2026-08-05T11:00:00.000Z", id: "2"}),
    ])

    expect(sorted.map(order => order.id)).toEqual(["3", "2", "1"])
  })

  it("breaks created_at ties by id so the order stays stable", () => {
    const sorted = sortOrdersHistoryByNewest([
      buildOrder({createdAt: "2026-08-05T10:00:00.000Z", id: "1"}),
      buildOrder({createdAt: "2026-08-05T10:00:00.000Z", id: "2"}),
    ])

    expect(sorted.map(order => order.id)).toEqual(["2", "1"])
  })

  it("does not mutate the input array", () => {
    const orders = [
      buildOrder({createdAt: "2026-08-05T10:00:00.000Z", id: "1"}),
      buildOrder({createdAt: "2026-08-05T12:00:00.000Z", id: "2"}),
    ]

    sortOrdersHistoryByNewest(orders)

    expect(orders.map(order => order.id)).toEqual(["1", "2"])
  })

  it("joins each order with its instrument ticker and notional", () => {
    const entries = getOrdersHistoryEntries(
      [buildOrder({instrumentId: 5, price: 40.88, quantity: 3})],
      instruments
    )

    expect(entries[0]?.ticker).toBe("MIRG")
    expect(entries[0]?.notional).toBeCloseTo(122.64)
  })

  it("falls back to a placeholder ticker for an unknown instrument", () => {
    const entries = getOrdersHistoryEntries(
      [buildOrder({instrumentId: 999})],
      instruments
    )

    expect(entries[0]?.ticker).toBe("N/D")
  })

  it("returns an empty list when there are no orders", () => {
    expect(getOrdersHistoryEntries([], instruments)).toEqual([])
  })
})
