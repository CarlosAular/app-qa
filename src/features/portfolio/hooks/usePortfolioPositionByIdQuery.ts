import {useQuery} from "@tanstack/react-query"

import {portfolioQueries} from "../queries/portfolioQueries"

export const usePortfolioPositionByIdQuery = (positionId: string) => {
  return useQuery(portfolioQueries.positionById(positionId))
}
