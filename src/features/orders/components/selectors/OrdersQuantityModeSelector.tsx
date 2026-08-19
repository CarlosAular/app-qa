import {Pressable, View} from "react-native"

import {cva} from "class-variance-authority"

import {Row} from "@/components/Row"
import {Text} from "@/components/ui/text"

import type {OrderQuantityMode} from "../../types"

type OrdersQuantityModeSelectorProps = {
  disabled?: boolean
  value: OrderQuantityMode
  onChange: (value: OrderQuantityMode) => void
}

const ordersQuantityModeSegmentVariants = cva(
  "min-h-9 flex-1 items-center justify-center rounded-md px-sm py-xs active:opacity-70",
  {
    variants: {
      selected: {
        false: "",
        true: "bg-primary",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
)

const ordersQuantityModeTextVariants = cva("text-xs font-semibold", {
  variants: {
    selected: {
      false: "text-muted-foreground",
      true: "text-primary-foreground",
    },
  },
  defaultVariants: {
    selected: false,
  },
})

const ORDER_QUANTITY_MODE_OPTIONS: {
  label: string
  value: OrderQuantityMode
}[] = [
  {label: "Acciones", value: "SHARES"},
  {label: "Pesos", value: "ARS"},
]

export const OrdersQuantityModeSelector = ({
  disabled = false,
  onChange,
  value,
}: OrdersQuantityModeSelectorProps) => {
  return (
    <View className="gap-xs">
      <Text className="text-muted-foreground text-xs font-medium">
        Cantidad por
      </Text>
      <Row className="border-border bg-panel p-xs rounded-md border">
        {ORDER_QUANTITY_MODE_OPTIONS.map(option => {
          const selected = option.value === value

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled, selected}}
              className={ordersQuantityModeSegmentVariants({selected})}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <Text className={ordersQuantityModeTextVariants({selected})}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </Row>
    </View>
  )
}
