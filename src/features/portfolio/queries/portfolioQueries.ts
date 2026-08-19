import {queryOptions} from "@tanstack/react-query"

import {getPortfolioHoldings} from "../api/portfolio.api"

const PORTFOLIO_BASE_QUERY_KEY = "portfolio"

export const portfolioQueries = {
  all: [PORTFOLIO_BASE_QUERY_KEY] as const,
  positionById: (positionId: string) =>
    queryOptions({
      gcTime: 5 * 60_000,
      queryFn: getPortfolioHoldings,
      queryKey: [PORTFOLIO_BASE_QUERY_KEY, "positions", positionId] as const,
      select: data =>
        data.positions.find(item => item.positionId === positionId),
      staleTime: 30_000,
    }),
  positions: () =>
    queryOptions({
      gcTime: 5 * 60_000,
      queryFn: getPortfolioHoldings,
      queryKey: [PORTFOLIO_BASE_QUERY_KEY, "positions"] as const,
      staleTime: 30_000,
    }),
} as const
