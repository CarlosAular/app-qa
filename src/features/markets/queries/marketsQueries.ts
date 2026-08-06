import {queryOptions} from "@tanstack/react-query"

import {getMarketsInstruments} from "../api/markets.api"

const MARKETS_BASE_QUERY_KEY = "markets"

export const marketsQueries = {
  instruments: () =>
    queryOptions({
      gcTime: 5 * 60_000,
      queryFn: getMarketsInstruments,
      queryKey: [MARKETS_BASE_QUERY_KEY, "instruments"] as const,
      staleTime: 30_000,
    }),
  instrumentById: (instrumentId: number) =>
    queryOptions({
      queryKey: [MARKETS_BASE_QUERY_KEY, "instruments", instrumentId],
      queryFn: getMarketsInstruments,
      select: data => data.find(item => item.id === instrumentId),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    }),
} as const
