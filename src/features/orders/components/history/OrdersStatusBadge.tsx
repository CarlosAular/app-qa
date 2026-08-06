import {View} from "react-native"

import {cva} from "class-variance-authority"

import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {getOrdersStatusLabel} from "../../orderFormatters"
import type {OrderStatus} from "../../types"

const ordersStatusBadgeVariants = cva("px-sm py-xs rounded-lg border", {
  variants: {
    status: {
      FILLED: "border-success/25 bg-success/15",
      PENDING: "border-secondary/25 bg-secondary/15",
      REJECTED: "border-destructive/25 bg-destructive/15",
    },
  },
  defaultVariants: {
    status: "PENDING",
  },
})

const ordersStatusTextVariants = cva("text-xs font-semibold", {
  variants: {
    status: {
      FILLED: "text-profit",
      PENDING: "text-secondary",
      REJECTED: "text-loss",
    },
  },
  defaultVariants: {
    status: "PENDING",
  },
})

type OrdersStatusBadgeProps = {
  status: OrderStatus
}

export const OrdersStatusBadge = ({status}: OrdersStatusBadgeProps) => {
  return (
    <View className={ordersStatusBadgeVariants({status})}>
      <Text className={cn(ordersStatusTextVariants({status}))}>
        {getOrdersStatusLabel(status)}
      </Text>
    </View>
  )
}
