import {View} from "react-native"

import {FlashList} from "@shopify/flash-list"
import {PieChart, ShieldCheck} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {PortfolioPositionRow} from "./PortfolioPositionRow"
import {PortfolioSummaryCard} from "./PortfolioSummaryCard"

import type {PortfolioPosition, PortfolioSummary} from "../../types"
import {PortfolioEmptyState} from "../states/PortfolioEmptyState"

type PortfolioPositionListProps = {
  onPositionPress: (position: PortfolioPosition) => void
  onRefresh: () => void
  positions: PortfolioPosition[]
  refreshing: boolean
  summary: PortfolioSummary
}

const PortfolioPositionListHeader = ({
  positionsCount,
  summary,
}: Pick<PortfolioPositionListProps, "summary"> & {
  positionsCount: number
}) => {
  const positionsLabel =
    positionsCount === 1 ? "1 posición" : `${positionsCount} posiciones`

  return (
    <View className="gap-lg px-street">
      <View className="gap-lg pt-lg">
        <Row className="gap-lg items-start justify-between">
          <View className="gap-xs min-w-0 flex-1">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
              Cuenta inversión
            </Text>
            <Text selectable className="text-foreground text-3xl font-bold">
              Portafolio
            </Text>
            <Text
              selectable
              className="text-muted-foreground text-sm leading-5"
            >
              Tenencias valorizadas en pesos y resultado actualizado.
            </Text>
          </View>

          <View className="border-secondary/20 bg-secondary/10 h-12 w-12 items-center justify-center rounded-lg border">
            <Icon as={PieChart} className="text-secondary size-6" />
          </View>
        </Row>

        <Row className="border-border/70 bg-panel gap-sm px-md min-h-12 items-center rounded-lg border">
          <Icon as={ShieldCheck} className="text-primary size-5" />
          <View className="min-w-0 flex-1">
            <Text className="text-foreground text-sm font-semibold">
              Valuación consolidada
            </Text>
            <Text className="text-muted-foreground text-xs leading-4">
              Costo, valor de mercado y retorno por posición.
            </Text>
          </View>
        </Row>
      </View>
      <PortfolioSummaryCard summary={summary} />
      {positionsCount > 0 ? (
        <View className="gap-xs pt-sm">
          <Text className="text-foreground text-lg font-semibold">
            Posiciones
          </Text>
          <Text className="text-muted-foreground text-sm">
            {positionsLabel}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export const PortfolioPositionList = ({
  onPositionPress,
  onRefresh,
  positions,
  refreshing,
  summary,
}: PortfolioPositionListProps) => {
  return (
    <FlashList
      contentInsetAdjustmentBehavior="never"
      contentContainerClassName="pb-safe pt-safe"
      data={positions}
      keyExtractor={position => position.positionId}
      ListEmptyComponent={<PortfolioEmptyState />}
      ListHeaderComponent={
        <PortfolioPositionListHeader
          positionsCount={positions.length}
          summary={summary}
        />
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={({item}) => (
        <PortfolioPositionRow onPress={onPositionPress} position={item} />
      )}
      showsVerticalScrollIndicator={false}
    />
  )
}
