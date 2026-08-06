import {Pressable, View} from "react-native"

import {ChevronLeft, ShieldCheck} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Card, CardContent} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {formatMarketsPeso} from "../../marketFormatters"
import type {MarketsInstrument} from "../../types"
import {MarketsInstrumentReturnBadge} from "../instrument-pricing/MarketsInstrumentReturnBadge"

type MarketsInstrumentDetailHeaderProps = {
  instrument: MarketsInstrument
  onBackPress: () => void
}

export const MarketsInstrumentDetailHeader = ({
  instrument,
  onBackPress,
}: MarketsInstrumentDetailHeaderProps) => {
  return (
    <Card className="border-primary/15 bg-card/95">
      <CardContent className="gap-lg">
        <Row className="items-center justify-between">
          <Pressable
            accessibilityLabel="Volver a mercados"
            accessibilityRole="button"
            className="border-border bg-panel active:bg-muted h-11 w-11 items-center justify-center rounded-lg border"
            hitSlop={8}
            onPress={onBackPress}
          >
            <Icon as={ChevronLeft} className="text-foreground size-5" />
          </Pressable>

          <Row className="border-border bg-panel gap-xs px-md min-h-9 items-center rounded-full border">
            <Icon as={ShieldCheck} className="text-secondary size-4" />
            <Text className="text-secondary text-xs font-semibold">
              Activo local
            </Text>
          </Row>
        </Row>

        <View className="gap-lg">
          <View className="min-w-0 flex-1">
            <Text selectable className="text-foreground text-4xl font-bold">
              {instrument.ticker}
            </Text>
            <Text
              selectable
              className="text-muted-foreground text-base leading-6"
              numberOfLines={2}
            >
              {instrument.name}
            </Text>
            <Text
              selectable
              className="text-muted-foreground mt-xs text-xs font-semibold uppercase"
            >
              {instrument.type}
            </Text>
          </View>

          <View className="gap-sm">
            <Text
              selectable
              className="text-foreground text-4xl font-bold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatMarketsPeso(instrument.lastPrice)}
            </Text>
            <MarketsInstrumentReturnBadge
              direction={instrument.direction}
              value={instrument.dailyReturnPercent}
            />
          </View>
        </View>

        <Row className="border-border/70 bg-panel rounded-lg border">
          <View className="border-border/70 gap-xs p-md flex-1 border-r">
            <Text className="text-muted-foreground text-xs font-medium">
              Cierre anterior
            </Text>
            <Text
              selectable
              className="text-foreground text-base font-semibold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatMarketsPeso(instrument.closePrice)}
            </Text>
          </View>
          <View className="gap-xs p-md flex-1">
            <Text className="text-muted-foreground text-xs font-medium">
              Spread diario
            </Text>
            <Text
              selectable
              className="text-foreground text-base font-semibold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatMarketsPeso(instrument.lastPrice - instrument.closePrice)}
            </Text>
          </View>
        </Row>
      </CardContent>
    </Card>
  )
}
