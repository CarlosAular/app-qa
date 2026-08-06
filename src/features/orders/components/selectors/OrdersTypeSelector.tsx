import {Pressable, View} from "react-native"

import {cva} from "class-variance-authority"

import {Row} from "@/components/Row"
import {Text} from "@/components/ui/text"

import type {OrderType} from "../../types"

type OrdersTypeSelectorProps = {
  disabled?: boolean
  value: OrderType
  onChange: (value: OrderType) => void
}

const ordersTypeSegmentVariants = cva(
  "min-h-9 flex-1 items-center justify-center rounded-md px-sm py-xs active:opacity-70",
  {
    variants: {
      selected: {
        false: "",
        true: "bg-accent",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

const ordersTypeTextVariants = cva("text-xs font-semibold", {
  variants: {
    selected: {
      false: "text-muted-foreground",
      true: "text-accent-foreground",
    },
  },
  defaultVariants: {
    selected: false,
  },
})

const ORDER_TYPE_OPTIONS: {label: string; value: OrderType}[] = [
  {label: "Market", value: "MARKET"},
  {label: "Limit", value: "LIMIT"},
]

export const OrdersTypeSelector = ({
  disabled = false,
  onChange,
  value,
}: OrdersTypeSelectorProps) => {
  return (
    <View className="gap-xs">
      <Text className="text-muted-foreground text-xs font-medium">Tipo</Text>
      <Row className="border-border bg-panel p-xs rounded-md border">
        {ORDER_TYPE_OPTIONS.map(option => {
          const selected = option.value === value

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled, selected}}
              className={ordersTypeSegmentVariants({selected})}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <Text className={ordersTypeTextVariants({selected})}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </Row>
    </View>
  )
}
