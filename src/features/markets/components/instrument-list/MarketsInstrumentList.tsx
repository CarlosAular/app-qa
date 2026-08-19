import {FlashList} from "@shopify/flash-list"
import {Clock3, ShieldCheck} from "lucide-react-native"

import {Column} from "@/components/Column"
import {Container} from "@/components/Container"
import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {MarketsInstrumentRow} from "./MarketsInstrumentRow"
import {MarketsSummaryStrip} from "./MarketsSummaryStrip"

import type {MarketsInstrument} from "../../types"
import {MarketsEmptyState} from "../states/MarketsEmptyState"

type MarketsInstrumentListProps = {
  instruments: MarketsInstrument[]
  onInstrumentPress: (instrument: MarketsInstrument) => void
  onRefresh: () => void
  refreshing: boolean
  summary: {
    down: number
    total: number
    up: number
  }
}

const MarketsInstrumentListHeader = ({
  summary,
}: Pick<MarketsInstrumentListProps, "summary">) => {
  return (
    <Container className="pb-sm">
      <Column gap="l" className="pt-lg">
        <Column gap="l">
          <Row className="gap-lg items-start justify-between">
            <Column gap="xs" expanded>
              <Text className="text-muted-foreground text-xs font-semibold uppercase">
                Trading desk
              </Text>
              <Text selectable className="text-foreground text-3xl font-bold">
                Mercados
              </Text>
              <Text
                selectable
                className="text-muted-foreground text-sm leading-5"
              >
                Acciones argentinas en pesos, listas para operar.
              </Text>
            </Column>

            <Row className="border-success/20 bg-success/10 gap-xs px-md min-h-11 items-center rounded-full border">
              <Icon as={Clock3} className="text-profit size-4" />
              <Text className="text-profit text-xs font-semibold">En vivo</Text>
            </Row>
          </Row>

          <Row className="border-border/70 bg-panel gap-sm px-md min-h-12 items-center rounded-lg border">
            <Icon as={ShieldCheck} className="text-secondary size-5" />
            <Column expanded>
              <Text className="text-foreground text-sm font-semibold">
                Mercado argentino
              </Text>
              <Text className="text-muted-foreground text-xs leading-4">
                Cotizaciones normalizadas por ticker y último precio.
              </Text>
            </Column>
          </Row>
        </Column>
        <MarketsSummaryStrip summary={summary} />
      </Column>
    </Container>
  )
}

export const MarketsInstrumentList = ({
  instruments,
  onInstrumentPress,
  onRefresh,
  refreshing,
  summary,
}: MarketsInstrumentListProps) => {
  return (
    <FlashList
      contentInsetAdjustmentBehavior="never"
      contentContainerClassName="pb-safe pt-safe"
      data={instruments}
      ListEmptyComponent={<MarketsEmptyState />}
      keyExtractor={instrument => `${instrument.id}`}
      ListHeaderComponent={<MarketsInstrumentListHeader summary={summary} />}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={({item}) => (
        <MarketsInstrumentRow instrument={item} onPress={onInstrumentPress} />
      )}
      showsVerticalScrollIndicator={false}
    />
  )
}
