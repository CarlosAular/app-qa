import {StatusBar} from "expo-status-bar"

import {useMarketsInstrumentsQuery} from "@/features/markets/hooks/useMarketsInstrumentsQuery"
import {OrdersHistoryList} from "@/features/orders/components/history/OrdersHistoryList"
import {OrdersErrorState} from "@/features/orders/components/states/OrdersErrorState"
import {OrdersLoadingState} from "@/features/orders/components/states/OrdersLoadingState"
import {useOrdersHistoryQuery} from "@/features/orders/hooks/useOrdersHistoryQuery"
import {useOrdersResetMutation} from "@/features/orders/hooks/useOrdersResetMutation"
import {getOrdersHistoryEntries} from "@/features/orders/ordersHistory"
import {
  showOrdersResetErrorToast,
  showOrdersResetSuccessToast,
} from "@/features/orders/orderToasts"
import {useRefreshing} from "@/hooks/useRefreshing"

const getOrdersErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intentá nuevamente en unos segundos."
}

export default function OrdersRoute() {
  const historyQuery = useOrdersHistoryQuery()
  const instrumentsQuery = useMarketsInstrumentsQuery()
  const resetMutation = useOrdersResetMutation()
  const {isRefreshing, refresh} = useRefreshing(historyQuery, instrumentsQuery)

  // Tickers live on the instruments feed, so a history row needs both queries.
  const orders = getOrdersHistoryEntries(
    historyQuery.data ?? [],
    instrumentsQuery.data ?? []
  )

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onError: error => showOrdersResetErrorToast(error),
      onSuccess: () => showOrdersResetSuccessToast(),
    })
  }

  if (historyQuery.isPending || instrumentsQuery.isPending) {
    return (
      <>
        <StatusBar style="light" />
        <OrdersLoadingState />
      </>
    )
  }

  if (historyQuery.isError) {
    return (
      <OrdersErrorState
        message={getOrdersErrorMessage(historyQuery.error)}
        onRetry={refresh}
      />
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <OrdersHistoryList
        onRefresh={refresh}
        onReset={handleReset}
        orders={orders}
        refreshing={isRefreshing}
        resetting={resetMutation.isPending}
      />
    </>
  )
}
