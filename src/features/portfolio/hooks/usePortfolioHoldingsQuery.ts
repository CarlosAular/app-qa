import {useQuery} from "@tanstack/react-query"

import {portfolioQueries} from "../queries/portfolioQueries"

export const usePortfolioHoldingsQuery = () => {
  return useQuery(portfolioQueries.positions())
}
