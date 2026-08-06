import {Pressable, View} from "react-native"

import {ChevronRight} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {PortfolioPositionTickerAvatar} from "./PortfolioPositionTickerAvatar"

import {
  formatPortfolioPeso,
  formatPortfolioQuantity,
  formatPortfolioSignedPeso,
} from "../../portfolioFormatters"
import type {PortfolioPosition} from "../../types"
import {PortfolioReturnBadge} from "../return-badge/PortfolioReturnBadge"

type PortfolioPositionRowProps = {
  position: PortfolioPosition
  onPress: (position: PortfolioPosition) => void
}

export const PortfolioPositionRow = ({
  position,
  onPress,
}: PortfolioPositionRowProps) => {
  const marketValue = formatPortfolioPeso(position.marketValue)
  const gain = formatPortfolioSignedPeso(position.gain)
  const quantity = formatPortfolioQuantity(position.quantity)
  const accessibilityLabel = `${position.ticker}, cantidad ${quantity}, valor de mercado ${marketValue}, ganancia ${gain}`

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="border-border/80 bg-card mx-street mb-sm px-md py-md active:bg-muted/70 min-h-[88px] rounded-lg border"
      onPress={() => onPress(position)}
    >
      <Row className="gap-md items-center">
        <PortfolioPositionTickerAvatar ticker={position.ticker} />

        <View className="gap-xs min-w-0 flex-1">
          <Text selectable className="text-foreground text-base font-bold">
            {position.ticker}
          </Text>
          <Text
            selectable
            className="text-muted-foreground text-sm leading-5"
            numberOfLines={1}
          >
            {quantity} acciones
          </Text>
        </View>

        <View className="gap-sm shrink-0 items-end">
          <Text
            selectable
            className="text-foreground text-base font-semibold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {marketValue}
          </Text>
          <PortfolioReturnBadge
            direction={position.direction}
            gain={position.gain}
            returnRatio={position.returnRatio}
          />
        </View>

        <Icon
          accessibilityElementsHidden
          as={ChevronRight}
          className="text-muted-foreground size-4 shrink-0"
        />
      </Row>
    </Pressable>
  )
}
