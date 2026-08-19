import {View} from "react-native"

import {BadgeDollarSign} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Card} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {OrdersInstrumentTickerAvatar} from "./OrdersInstrumentTickerAvatar"

import {formatOrdersPeso} from "../../orderFormatters"
import type {OrdersInstrument} from "../../types"

type OrdersInstrumentSummaryProps = {
  instrument: OrdersInstrument
}

export const OrdersInstrumentSummary = ({
  instrument,
}: OrdersInstrumentSummaryProps) => {
  return (
    <Card className="border-primary/20 bg-card/95 py-sm gap-0">
      <Row className="gap-sm px-md items-center">
        <OrdersInstrumentTickerAvatar ticker={instrument.ticker} />

        <View className="min-w-0 flex-1">
          <Text selectable className="text-foreground text-base font-bold">
            {instrument.ticker}
          </Text>
          <Text
            selectable
            className="text-muted-foreground text-xs leading-4"
            numberOfLines={1}
          >
            {instrument.name}
          </Text>
        </View>

        <View className="items-end">
          <Row className="gap-xs items-center">
            <Icon as={BadgeDollarSign} className="text-primary size-3.5" />
            <Text
              selectable
              className="text-foreground text-base font-semibold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatOrdersPeso(instrument.lastPrice)}
            </Text>
          </Row>
          <Text
            selectable
            className="text-muted-foreground text-[10px] font-medium uppercase"
          >
            {instrument.type}
          </Text>
        </View>
      </Row>
    </Card>
  )
}
