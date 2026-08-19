import {useQueryClient} from "@tanstack/react-query"
import {type Href, useRouter} from "expo-router"
import {StatusBar} from "expo-status-bar"

import {MarketsInstrumentList} from "@/features/markets/components/instrument-list/MarketsInstrumentList"
import {MarketsErrorState} from "@/features/markets/components/states/MarketsErrorState"
import {MarketsLoadingState} from "@/features/markets/components/states/MarketsLoadingState"
import {useMarketsInstrumentsQuery} from "@/features/markets/hooks/useMarketsInstrumentsQuery"
import {getMarketsSummary} from "@/features/markets/marketMath"
import {marketsQueries} from "@/features/markets/queries/marketsQueries"
import type {MarketsInstrument} from "@/features/markets/types"
import {useRefreshing} from "@/hooks/useRefreshing"

const getMarketsErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intentá nuevamente en unos segundos."
}

export default function MarketsRoute() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const instrumentsQuery = useMarketsInstrumentsQuery()
  const summary = getMarketsSummary(instrumentsQuery.data ?? [])
  const {isRefreshing, refresh} = useRefreshing(instrumentsQuery)

  const handleInstrumentPress = (instrument: MarketsInstrument) => {
    queryClient.setQueryData(
      marketsQueries.instrumentById(instrument.id).queryKey,
      (old: MarketsInstrument[] | undefined) =>
        old ?? instrumentsQuery.data ?? [instrument]
    )
    router.push({
      pathname: "/instrument/[instrumentId]",
      params: {instrumentId: String(instrument.id)},
    } satisfies Href)
  }

  if (instrumentsQuery.isPending) {
    return (
      <>
        <StatusBar style="light" />
        <MarketsLoadingState />
      </>
    )
  }

  if (instrumentsQuery.isError) {
    return (
      <MarketsErrorState
        message={getMarketsErrorMessage(instrumentsQuery.error)}
        onRetry={refresh}
      />
    )
  }

  return (
    <>
      <StatusBar style="light" />

      <MarketsInstrumentList
        instruments={instrumentsQuery.data}
        onInstrumentPress={handleInstrumentPress}
        onRefresh={refresh}
        refreshing={isRefreshing}
        summary={summary}
      />
    </>
  )
}
