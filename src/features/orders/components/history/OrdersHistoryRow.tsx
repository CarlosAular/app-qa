import {View} from "react-native"

import {cva} from "class-variance-authority"

import {Row} from "@/components/Row"
import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {OrdersStatusBadge} from "./OrdersStatusBadge"

import {
  formatOrdersDateTime,
  formatOrdersPeso,
  formatOrdersQuantity,
  getOrdersSideLabel,
  getOrdersStatusLabel,
  getOrdersTypeLabel,
} from "../../orderFormatters"
import type {OrdersHistoryEntry} from "../../types"
import {OrdersInstrumentTickerAvatar} from "../instrument-summary/OrdersInstrumentTickerAvatar"

const ordersSideTextVariants = cva("text-xs font-semibold uppercase", {
  variants: {
    side: {
      BUY: "text-profit",
      SELL: "text-loss",
    },
  },
  defaultVariants: {
    side: "BUY",
  },
})

type OrdersHistoryRowProps = {
  order: OrdersHistoryEntry
}

export const OrdersHistoryRow = ({order}: OrdersHistoryRowProps) => {
  const quantity = formatOrdersQuantity(order.quantity)
  const price = formatOrdersPeso(order.price)
  const notional = formatOrdersPeso(order.notional)
  const sideLabel = getOrdersSideLabel(order.side)
  const typeLabel = getOrdersTypeLabel(order.type)
  const accessibilityLabel = `${sideLabel} ${typeLabel} de ${quantity} ${order.ticker} a ${price}, ${getOrdersStatusLabel(order.status)}`

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className="border-border/80 bg-card mx-street mb-sm px-md py-md min-h-[88px] rounded-lg border"
    >
      <Row className="gap-md items-center">
        <OrdersInstrumentTickerAvatar ticker={order.ticker} />

        <View className="gap-xs min-w-0 flex-1">
          <Row className="gap-sm items-center">
            <Text selectable className="text-foreground text-base font-bold">
              {order.ticker}
            </Text>
            <Text className={cn(ordersSideTextVariants({side: order.side}))}>
              {sideLabel}
            </Text>
          </Row>
          <Text
            selectable
            className="text-muted-foreground text-sm leading-5"
            numberOfLines={1}
          >
            {quantity} x {price} · {typeLabel}
          </Text>
          <Text className="text-muted-foreground text-xs leading-4">
            {formatOrdersDateTime(order.createdAt)} · #{order.id}
          </Text>
        </View>

        <View className="gap-sm shrink-0 items-end">
          <Text
            selectable
            className="text-foreground text-base font-semibold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {notional}
          </Text>
          <OrdersStatusBadge status={order.status} />
        </View>
      </Row>
    </View>
  )
}
