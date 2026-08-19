import {useQueryClient} from "@tanstack/react-query"
import {type Href, useRouter} from "expo-router"
import {StatusBar} from "expo-status-bar"

import {PortfolioPositionList} from "@/features/portfolio/components/position-list/PortfolioPositionList"
import {PortfolioErrorState} from "@/features/portfolio/components/states/PortfolioErrorState"
import {PortfolioLoadingState} from "@/features/portfolio/components/states/PortfolioLoadingState"
import {usePortfolioHoldingsQuery} from "@/features/portfolio/hooks/usePortfolioHoldingsQuery"
import {getPortfolioSummary} from "@/features/portfolio/portfolioMath"
import {portfolioQueries} from "@/features/portfolio/queries/portfolioQueries"
import type {
  PortfolioHoldings,
  PortfolioPosition,
} from "@/features/portfolio/types"
import {useRefreshing} from "@/hooks/useRefreshing"

const getPortfolioErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intentá nuevamente en unos segundos."
}

export default function PortfolioRoute() {
  const router = useRouter()
  const holdingsQuery = usePortfolioHoldingsQuery()
  const queryClient = useQueryClient()
  const holdings = holdingsQuery.data
  const summary = getPortfolioSummary(
    holdings?.positions ?? [],
    holdings?.cash ?? 0
  )
  const {isRefreshing, refresh} = useRefreshing(holdingsQuery)

  const handlePositionPress = (position: PortfolioPosition) => {
    queryClient.setQueryData(
      portfolioQueries.positionById(position.positionId).queryKey,
      (old: PortfolioHoldings | undefined) =>
        old ?? holdings ?? {cash: 0, positions: [position]}
    )
    router.push({
      pathname: "/(tabs)/portfolio/[positionId]",
      params: {positionId: position.positionId},
    } satisfies Href)
  }

  if (holdingsQuery.isPending) {
    return (
      <>
        <StatusBar style="light" />
        <PortfolioLoadingState />
      </>
    )
  }

  if (holdingsQuery.isError) {
    return (
      <PortfolioErrorState
        message={getPortfolioErrorMessage(holdingsQuery.error)}
        onRetry={refresh}
      />
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <PortfolioPositionList
        onPositionPress={handlePositionPress}
        onRefresh={refresh}
        positions={holdingsQuery.data.positions}
        refreshing={isRefreshing}
        summary={summary}
      />
    </>
  )
}
