import {View} from "react-native"

import {Text} from "@/components/ui/text"

type SearchResultTickerAvatarProps = {
  ticker: string
}

export const SearchResultTickerAvatar = ({
  ticker,
}: SearchResultTickerAvatarProps) => {
  const initials = ticker.slice(0, 3).toUpperCase()

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="border-primary/20 bg-primary/10 h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
    >
      <Text className="text-primary text-sm font-bold">{initials}</Text>
    </View>
  )
}
