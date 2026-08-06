import {View} from "react-native"

import {Text} from "@/components/ui/text"

type OrdersInstrumentTickerAvatarProps = {
  ticker: string
}

export const OrdersInstrumentTickerAvatar = ({
  ticker,
}: OrdersInstrumentTickerAvatarProps) => {
  const initials = ticker.slice(0, 3).toUpperCase()

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="border-primary/20 bg-primary/10 h-9 w-9 shrink-0 items-center justify-center rounded-md border"
    >
      <Text className="text-primary text-xs font-bold">{initials}</Text>
    </View>
  )
}
