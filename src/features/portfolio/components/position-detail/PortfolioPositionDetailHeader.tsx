import {Pressable, View} from "react-native"

import {ChevronLeft, ShieldCheck} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Card, CardContent} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {
  formatPortfolioPeso,
  formatPortfolioQuantity,
} from "../../portfolioFormatters"
import type {PortfolioPosition} from "../../types"
import {PortfolioReturnBadge} from "../return-badge/PortfolioReturnBadge"

type PortfolioPositionDetailHeaderProps = {
  onBackPress: () => void
  position: PortfolioPosition
}

export const PortfolioPositionDetailHeader = ({
  onBackPress,
  position,
}: PortfolioPositionDetailHeaderProps) => {
  return (
    <Card className="border-secondary/20 bg-card/95">
      <CardContent className="gap-lg">
        <Row className="items-center justify-between">
          <Pressable
            accessibilityLabel="Volver al portafolio"
            accessibilityRole="button"
            className="border-border bg-panel active:bg-muted h-11 w-11 items-center justify-center rounded-lg border"
            hitSlop={8}
            onPress={onBackPress}
          >
            <Icon as={ChevronLeft} className="text-foreground size-5" />
          </Pressable>

          <Row className="border-secondary/20 bg-secondary/10 gap-xs px-md min-h-9 items-center rounded-full border">
            <Icon as={ShieldCheck} className="text-secondary size-4" />
            <Text className="text-secondary text-xs font-semibold">
              Posición activa
            </Text>
          </Row>
        </Row>

        <View className="gap-sm">
          <Text selectable className="text-foreground text-4xl font-bold">
            {position.ticker}
          </Text>
          <Text className="text-muted-foreground text-sm leading-5">
            {formatPortfolioQuantity(position.quantity)} acciones en cartera
          </Text>
        </View>

        <View className="gap-md">
          <Text
            selectable
            className="text-foreground text-4xl font-bold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {formatPortfolioPeso(position.marketValue)}
          </Text>
          <PortfolioReturnBadge
            direction={position.direction}
            gain={position.gain}
            layout="banner"
            returnRatio={position.returnRatio}
          />
        </View>
      </CardContent>
    </Card>
  )
}
