import {Pressable, View} from "react-native"

import {ChevronRight} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {formatMarketsPeso} from "../../marketFormatters"
import type {MarketsInstrument} from "../../types"
import {MarketsInstrumentReturnBadge} from "../instrument-pricing/MarketsInstrumentReturnBadge"

type MarketsInstrumentRowProps = {
  instrument: MarketsInstrument
  onPress: (instrument: MarketsInstrument) => void
}

export const MarketsInstrumentRow = ({
  instrument,
  onPress,
}: MarketsInstrumentRowProps) => {
  const price = formatMarketsPeso(instrument.lastPrice)
  const accessibilityLabel = `${instrument.ticker}, ${instrument.name}, ultimo precio ${price}, retorno diario ${instrument.dailyReturnPercent.toFixed(2)} por ciento`

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="border-border/80 bg-card mx-street mb-sm px-md py-md active:bg-muted/70 min-h-[88px] rounded-lg border"
      onPress={() => onPress(instrument)}
    >
      <Row className="gap-md items-center">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="border-primary/20 bg-primary/10 h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
        >
          <Text className="text-primary text-sm font-bold">
            {instrument.ticker.slice(0, 3).toUpperCase()}
          </Text>
        </View>

        <View className="gap-xs min-w-0 flex-1">
          <Text selectable className="text-foreground text-base font-bold">
            {instrument.ticker}
          </Text>
          <Text
            selectable
            className="text-muted-foreground text-sm leading-5"
            numberOfLines={1}
          >
            {instrument.name}
          </Text>
        </View>

        <View className="gap-xs shrink-0 items-end">
          <Text
            selectable
            className="text-foreground text-base font-semibold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {price}
          </Text>
          <MarketsInstrumentReturnBadge
            direction={instrument.direction}
            value={instrument.dailyReturnPercent}
          />
        </View>

        <Icon
          accessibilityElementsHidden
          as={ChevronRight}
          className="text-muted-foreground size-4 shrink-0"
        />
      </Row>
    </Pressable>
  )
}
