import {Pressable, View} from "react-native"

import {cva} from "class-variance-authority"

import {Row} from "@/components/Row"
import {Text} from "@/components/ui/text"

import type {OrderSide} from "../../types"

type OrdersSideSelectorProps = {
  disabled?: boolean
  value: OrderSide
  onChange: (value: OrderSide) => void
}

type OrdersSideSegmentTone = "default" | "buy" | "sell"

const ordersSideSegmentVariants = cva(
  "min-h-9 flex-1 items-center justify-center rounded-md px-sm py-xs active:opacity-70",
  {
    variants: {
      tone: {
        buy: "bg-success",
        default: "",
        sell: "bg-destructive",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

const ordersSideTextVariants = cva("text-xs font-semibold", {
  variants: {
    tone: {
      buy: "text-success-foreground",
      default: "text-muted-foreground",
      sell: "text-destructive-foreground",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

const ORDER_SIDE_OPTIONS: {label: string; value: OrderSide}[] = [
  {label: "Comprar", value: "BUY"},
  {label: "Vender", value: "SELL"},
]

const getOrdersSideSegmentTone = (
  selected: boolean,
  value: OrderSide
): OrdersSideSegmentTone => {
  if (!selected) {
    return "default"
  }

  return value === "BUY" ? "buy" : "sell"
}

export const OrdersSideSelector = ({
  disabled = false,
  onChange,
  value,
}: OrdersSideSelectorProps) => {
  return (
    <View className="gap-xs">
      <Text className="text-muted-foreground text-xs font-medium">Lado</Text>
      <Row className="border-border bg-panel p-xs rounded-md border">
        {ORDER_SIDE_OPTIONS.map(option => {
          const selected = option.value === value
          const tone = getOrdersSideSegmentTone(selected, option.value)

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled, selected}}
              className={ordersSideSegmentVariants({tone})}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <Text className={ordersSideTextVariants({tone})}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </Row>
    </View>
  )
}
