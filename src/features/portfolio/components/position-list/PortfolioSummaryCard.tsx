import {View} from "react-native"

import {Activity, BriefcaseBusiness, Sigma} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Card, CardContent} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {
  formatPortfolioPercent,
  formatPortfolioPeso,
} from "../../portfolioFormatters"
import type {PortfolioSummary} from "../../types"

type PortfolioSummaryCardProps = {
  summary: PortfolioSummary
}

export const PortfolioSummaryCard = ({summary}: PortfolioSummaryCardProps) => {
  const performanceClassName =
    summary.totalGain > 0
      ? "text-profit"
      : summary.totalGain < 0
        ? "text-loss"
        : "text-muted-foreground"

  return (
    <Card className="border-secondary/20 bg-card/95">
      <CardContent className="gap-lg">
        <Row className="gap-lg items-start justify-between">
          <View className="gap-xs min-w-0 flex-1">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
              Valor total
            </Text>
            <Text
              selectable
              className="text-foreground text-4xl font-bold tabular-nums"
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(summary.totalMarketValue)}
            </Text>
          </View>
          <View className="border-secondary/20 bg-secondary/10 h-12 w-12 items-center justify-center rounded-lg border">
            <Icon as={BriefcaseBusiness} className="text-secondary size-6" />
          </View>
        </Row>

        <Row className="gap-sm">
          <View className="border-border/70 bg-panel gap-xs p-md flex-1 rounded-lg border">
            <Icon as={Activity} className="text-primary size-4" />
            <Text className="text-muted-foreground text-xs font-medium">
              Ganancia
            </Text>
            <Text
              selectable
              className={cn(
                "text-base font-bold tabular-nums",
                performanceClassName
              )}
              adjustsFontSizeToFit
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(summary.totalGain)}
            </Text>
          </View>

          <View className="border-border/70 bg-panel gap-xs p-md flex-1 rounded-lg border">
            <Icon as={Sigma} className="text-primary size-4" />
            <Text className="text-muted-foreground text-xs font-medium">
              Retorno
            </Text>
            <Text
              selectable
              className={cn(
                "text-base font-bold tabular-nums",
                performanceClassName
              )}
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPercent(summary.totalReturnRatio)}
            </Text>
          </View>
        </Row>

        <Row className="border-border/70 bg-panel rounded-lg border">
          <View className="border-border/70 gap-xs p-md flex-1 border-r">
            <Text className="text-muted-foreground text-xs font-medium">
              Costo invertido
            </Text>
            <Text
              selectable
              adjustsFontSizeToFit
              className="text-foreground text-sm font-semibold tabular-nums"
              minimumFontScale={0.7}
              numberOfLines={1}
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(summary.totalCostBasis)}
            </Text>
          </View>
          <View className="border-border/70 gap-xs p-md flex-1 border-r">
            <Text className="text-muted-foreground text-xs font-medium">
              Efectivo
            </Text>
            <Text
              selectable
              adjustsFontSizeToFit
              className="text-foreground text-sm font-semibold tabular-nums"
              minimumFontScale={0.7}
              numberOfLines={1}
              style={{fontVariant: ["tabular-nums"]}}
            >
              {formatPortfolioPeso(summary.cash)}
            </Text>
          </View>
          <View className="gap-xs p-md flex-1">
            <Text className="text-muted-foreground text-xs font-medium">
              Posiciones
            </Text>
            <Text selectable className="text-foreground text-sm font-semibold">
              {summary.positions}
            </Text>
          </View>
        </Row>
      </CardContent>
    </Card>
  )
}
