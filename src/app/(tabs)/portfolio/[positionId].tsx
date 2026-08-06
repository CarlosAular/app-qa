import {useMemo} from "react"

import {useLocalSearchParams, useRouter} from "expo-router"
import {StatusBar} from "expo-status-bar"
import {TrendingUp} from "lucide-react-native"

import {Container} from "@/components/Container"
import {ScrollView} from "@/components/ScrollView"
import {Button} from "@/components/ui/button"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"
import {useMarketsInstrumentsQuery} from "@/features/markets/hooks/useMarketsInstrumentsQuery"
import {OrdersTicketSheet} from "@/features/orders/components/ticket/OrdersTicketSheet"
import {toOrdersInstrument} from "@/features/orders/orderValidation"
import {PortfolioPositionChart} from "@/features/portfolio/components/position-detail/PortfolioPositionChart"
import {PortfolioPositionDetailHeader} from "@/features/portfolio/components/position-detail/PortfolioPositionDetailHeader"
import {PortfolioPositionDetailMetrics} from "@/features/portfolio/components/position-detail/PortfolioPositionDetailMetrics"
import {PortfolioErrorState} from "@/features/portfolio/components/states/PortfolioErrorState"
import {PortfolioLoadingState} from "@/features/portfolio/components/states/PortfolioLoadingState"
import {PortfolioPositionNotFound} from "@/features/portfolio/components/states/PortfolioPositionNotFound"
import {usePortfolioPositionByIdQuery} from "@/features/portfolio/hooks/usePortfolioPositionByIdQuery"
import {useModal} from "@/hooks/useModal"

const getPortfolioErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intentá nuevamente en unos segundos."
}

export default function PortfolioPositionDetailRoute() {
  const router = useRouter()
  const showOrdersTicket = useModal(OrdersTicketSheet)
  const {positionId: positionIdParam} = useLocalSearchParams<{
    positionId: string
  }>()
  const positionByIdQuery = usePortfolioPositionByIdQuery(positionIdParam)
  const position = positionByIdQuery.data
  const marketsQuery = useMarketsInstrumentsQuery()

  const tradableInstrument = useMemo(() => {
    if (!position) {
      return undefined
    }

    return marketsQuery.data?.find(
      instrument => instrument.id === position.instrumentId
    )
  }, [marketsQuery.data, position])

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/(tabs)/portfolio")
  }

  const handleRefresh = () => {
    void positionByIdQuery.refetch()
    void marketsQuery.refetch()
  }

  const handleTradePress = () => {
    if (!tradableInstrument) {
      return
    }

    showOrdersTicket({
      instrument: toOrdersInstrument(tradableInstrument),
    })
  }

  if (positionByIdQuery.isPending) {
    return (
      <>
        <StatusBar style="light" />
        <PortfolioLoadingState />
      </>
    )
  }

  if (positionByIdQuery.isError) {
    return (
      <Container expanded>
        <StatusBar style="light" />
        <PortfolioErrorState
          message={getPortfolioErrorMessage(positionByIdQuery.error)}
          onRetry={handleRefresh}
        />
      </Container>
    )
  }

  if (!position) {
    return (
      <Container expanded>
        <StatusBar style="light" />
        <PortfolioPositionNotFound onGoBack={handleGoBack} />
      </Container>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        expanded
        contentContainerClassName="gap-xl px-street pb-safe pt-safe"
        showsVerticalScrollIndicator={false}
      >
        <PortfolioPositionDetailHeader
          onBackPress={handleGoBack}
          position={position}
        />
        <PortfolioPositionChart position={position} />
        <PortfolioPositionDetailMetrics position={position} />
        <Button
          className="min-h-12"
          disabled={!tradableInstrument}
          onPress={handleTradePress}
          size="lg"
          variant="accent"
        >
          <Icon as={TrendingUp} />
          <Text>Operar esta posición</Text>
        </Button>
        {!tradableInstrument ? (
          <Text className="text-muted-foreground text-sm leading-5">
            Este instrumento no está disponible en Mercados en este momento.
          </Text>
        ) : null}
      </ScrollView>
    </>
  )
}
