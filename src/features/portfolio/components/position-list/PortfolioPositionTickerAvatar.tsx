import {View} from "react-native"

import {Text} from "@/components/ui/text"

type PortfolioPositionTickerAvatarProps = {
  ticker: string
}

export const PortfolioPositionTickerAvatar = ({
  ticker,
}: PortfolioPositionTickerAvatarProps) => {
  const initials = ticker.slice(0, 3).toUpperCase()

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="border-secondary/20 bg-secondary/10 h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
    >
      <Text className="text-secondary text-sm font-bold">{initials}</Text>
    </View>
  )
}
