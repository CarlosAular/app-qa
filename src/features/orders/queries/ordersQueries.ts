import {queryOptions} from "@tanstack/react-query"

import {getOrdersHistory} from "../api/orders.api"

const ORDERS_BASE_QUERY_KEY = "orders"

export const ordersQueries = {
  all: [ORDERS_BASE_QUERY_KEY] as const,
  history: () =>
    queryOptions({
      gcTime: 5 * 60_000,
      queryFn: getOrdersHistory,
      queryKey: [ORDERS_BASE_QUERY_KEY, "history"] as const,
      staleTime: 30_000,
    }),
} as const
