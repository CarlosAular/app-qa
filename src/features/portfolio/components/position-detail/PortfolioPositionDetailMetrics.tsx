import {View} from "react-native"

import {Coins, Layers, WalletCards} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Card} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {
  formatPortfolioPeso,
  formatPortfolioQuantity,
} from "../../portfolioFormatters"
import type {PortfolioPosition} from "../../types"
import {PortfolioReturnBadge} from "../return-badge/PortfolioReturnBadge"

type PortfolioPositionDetailMetricsProps = {
  position: PortfolioPosition
}

export const PortfolioPositionDetailMetrics = ({
  position,
}: PortfolioPositionDetailMetricsProps) => {
  return (
    <View className="gap-md">
      <View className="gap-xs">
        <Text className="text-foreground text-lg font-bold">Detalle</Text>
        <Text className="text-muted-foreground text-xs leading-4">
          Composición de la posición y resultado acumulado.
        </Text>
      </View>

      <Row className="gap-sm">
        <Card className="gap-sm p-md py-md flex-1">
          <Icon as={Layers} className="text-secondary size-5" />
          <Text className="text-muted-foreground text-xs font-medium">
            Cantidad
          </Text>
          <Text selectable className="text-foreground text-lg font-bold">
            {formatPortfolioQuantity(position.quantity)}
          </Text>
        </Card>

        <Card className="gap-sm p-md py-md flex-1">
          <Icon as={Coins} className="text-primary size-5" />
          <Text className="text-muted-foreground text-xs font-medium">PPP</Text>
          <Text
            selectable
            className="text-foreground text-lg font-bold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {formatPortfolioPeso(position.avgCostPrice)}
          </Text>
        </Card>
      </Row>

      <Card className="gap-md py-md">
        <Row className="px-md gap-sm items-center">
          <Icon as={WalletCards} className="text-primary size-5" />
          <Text className="text-foreground text-base font-bold">
            Resultado de la posición
          </Text>
        </Row>
        <Row className="border-border/70 bg-panel mx-md rounded-lg border">
          <View className="border-border/70 gap-xs p-md flex-1 border-r">
            <Text className="text-muted-foreground text-xs font-medium">
              Costo
            </Text>
            <Text
              selectable
              className="text-foreground text-sm font-semibold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(position.costBasis)}
            </Text>
          </View>
          <View className="gap-xs p-md flex-1">
            <Text className="text-muted-foreground text-xs font-medium">
              Valor
            </Text>
            <Text
              selectable
              className="text-foreground text-sm font-semibold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(position.marketValue)}
            </Text>
          </View>
        </Row>
        <View className="px-md">
          <PortfolioReturnBadge
            direction={position.direction}
            gain={position.gain}
            layout="banner"
            returnRatio={position.returnRatio}
          />
        </View>
      </Card>
    </View>
  )
}
