import {useLocalSearchParams, useRouter} from "expo-router"
import {StatusBar} from "expo-status-bar"
import {TrendingUp} from "lucide-react-native"

import {Container} from "@/components/Container"
import {ScrollView} from "@/components/ScrollView"
import {Button} from "@/components/ui/button"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"
import {MarketsInstrumentDetailHeader} from "@/features/markets/components/instrument-detail/MarketsInstrumentDetailHeader"
import {MarketsPriceChart} from "@/features/markets/components/instrument-pricing/MarketsPriceChart"
import {MarketsErrorState} from "@/features/markets/components/states/MarketsErrorState"
import {MarketsInstrumentNotFound} from "@/features/markets/components/states/MarketsInstrumentNotFound"
import {MarketsLoadingState} from "@/features/markets/components/states/MarketsLoadingState"
import {useMarketInstrumentByIdQuery} from "@/features/markets/hooks/useMarketInstrumentByIdQuery"
import {OrdersTicketSheet} from "@/features/orders/components/ticket/OrdersTicketSheet"
import {toOrdersInstrument} from "@/features/orders/orderValidation"
import {useModal} from "@/hooks/useModal"

const getMarketsErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intentá nuevamente en unos segundos."
}

export default function MarketsInstrumentDetailRoute() {
  const router = useRouter()
  const showOrdersTicket = useModal(OrdersTicketSheet)
  const {instrumentId: instrumentIdParam} = useLocalSearchParams<{
    instrumentId: string
  }>()
  const instrumentByIdQuery = useMarketInstrumentByIdQuery(
    Number(instrumentIdParam)
  )

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/(tabs)/markets")
  }

  const handleRefresh = () => instrumentByIdQuery.refetch()

  const handleTradePress = () => {
    if (!instrumentByIdQuery.data) {
      return
    }

    showOrdersTicket({
      instrument: toOrdersInstrument(instrumentByIdQuery.data),
    })
  }

  if (instrumentByIdQuery.isPending) {
    return (
      <>
        <StatusBar style="light" />
        <MarketsLoadingState />
      </>
    )
  }

  if (instrumentByIdQuery.isError) {
    return (
      <Container expanded>
        <StatusBar style="light" />
        <MarketsErrorState
          message={getMarketsErrorMessage(instrumentByIdQuery.error)}
          onRetry={handleRefresh}
        />
      </Container>
    )
  }

  if (instrumentByIdQuery.isSuccess && !instrumentByIdQuery.data) {
    return (
      <Container expanded>
        <StatusBar style="light" />
        <MarketsInstrumentNotFound onGoBack={handleGoBack} />
      </Container>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      {instrumentByIdQuery.isSuccess && instrumentByIdQuery.data && (
        <ScrollView
          expanded
          contentContainerClassName="gap-xl px-street pb-safe pt-safe"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MarketsInstrumentDetailHeader
            instrument={instrumentByIdQuery.data}
            onBackPress={handleGoBack}
          />
          <MarketsPriceChart instrument={instrumentByIdQuery.data} />
          <Button
            className="min-h-12 w-full"
            onPress={handleTradePress}
            size="lg"
            variant="accent"
          >
            <Icon as={TrendingUp} />
            <Text>Operar ahora</Text>
          </Button>
        </ScrollView>
      )}
    </>
  )
}
