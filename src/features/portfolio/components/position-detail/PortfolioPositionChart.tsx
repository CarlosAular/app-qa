import {useMemo} from "react"
import {View} from "react-native"

import {LineChart} from "lucide-react-native"
import {CartesianChart, Line, Scatter} from "victory-native"

import {
  ChartContainer,
  getDefaultChartAxisOptions,
} from "@/components/charts/ChartContainer"
import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {
  buildPortfolioChartData,
  getPortfolioChartAccessibilityLabel,
  getPortfolioChartLineColor,
} from "../../portfolioChartData"
import {formatPortfolioPeso} from "../../portfolioFormatters"
import type {PortfolioPosition} from "../../types"

type PortfolioPositionChartProps = {
  position: PortfolioPosition
}

export const PortfolioPositionChart = ({
  position,
}: PortfolioPositionChartProps) => {
  const chartData = useMemo(
    () =>
      buildPortfolioChartData({
        avgCostPrice: position.avgCostPrice,
        closePrice: position.closePrice,
        lastPrice: position.lastPrice,
      }),
    [position.avgCostPrice, position.closePrice, position.lastPrice]
  )
  const labelByPoint = useMemo(
    () => new Map(chartData.map(point => [point.point, point.label])),
    [chartData]
  )
  const lineColor = getPortfolioChartLineColor(position.direction)
  const accessibilityLabel = getPortfolioChartAccessibilityLabel({
    avgCostPrice: position.avgCostPrice,
    closePrice: position.closePrice,
    gain: position.gain,
    lastPrice: position.lastPrice,
    ticker: position.ticker,
  })

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      className="gap-md"
    >
      <Row className="items-center justify-between">
        <View className="gap-xs">
          <Text className="text-foreground text-lg font-bold">
            Precios de referencia
          </Text>
          <Text className="text-muted-foreground text-xs leading-4">
            PPP, cierre anterior y último precio.
          </Text>
        </View>
        <View className="border-primary/20 bg-primary/10 h-10 w-10 items-center justify-center rounded-lg border">
          <Icon as={LineChart} className="text-primary size-5" />
        </View>
      </Row>
      <ChartContainer>
        {({font}) => (
          <CartesianChart
            data={chartData}
            xKey="point"
            yKeys={["price"]}
            padding={{bottom: 12, left: 12, right: 28, top: 12}}
            domainPadding={{bottom: 12, left: 24, right: 24, top: 12}}
            axisOptions={{
              ...getDefaultChartAxisOptions(font),
              formatXLabel: value => labelByPoint.get(value) ?? String(value),
              formatYLabel: value => formatPortfolioPeso(value),
              tickCount: {x: 3, y: 4},
            }}
          >
            {({points}) => (
              <>
                <Line
                  points={points.price}
                  color={lineColor}
                  strokeWidth={2}
                  curveType="linear"
                />
                <Scatter points={points.price} color={lineColor} radius={5} />
              </>
            )}
          </CartesianChart>
        )}
      </ChartContainer>
    </View>
  )
}
