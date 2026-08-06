import {useMemo} from "react"
import {View} from "react-native"

import {LineChart} from "lucide-react-native"
import {CartesianChart, Line, Scatter} from "victory-native"

import {
  ChartContainer,
  getDefaultChartAxisOptions,
} from "@/components/charts/ChartContainer"
import {getChartPrimaryColor} from "@/components/charts/chartTheme"
import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {formatMarketsPeso} from "../../marketFormatters"
import {
  buildMarketsChartData,
  getMarketsChartAccessibilityLabel,
} from "../../marketsChartData"
import type {MarketsInstrument} from "../../types"

type MarketsPriceChartProps = {
  instrument: MarketsInstrument
}

export const MarketsPriceChart = ({instrument}: MarketsPriceChartProps) => {
  const chartData = useMemo(
    () =>
      buildMarketsChartData({
        closePrice: instrument.closePrice,
        lastPrice: instrument.lastPrice,
      }),
    [instrument.closePrice, instrument.lastPrice]
  )
  const labelByPoint = useMemo(
    () => new Map(chartData.map(point => [point.point, point.label])),
    [chartData]
  )
  const accessibilityLabel = getMarketsChartAccessibilityLabel({
    closePrice: instrument.closePrice,
    dailyReturnPercent: instrument.dailyReturnPercent,
    lastPrice: instrument.lastPrice,
    ticker: instrument.ticker,
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
            Variación del día
          </Text>
          <Text className="text-muted-foreground text-xs leading-4">
            Cierre anterior contra último precio.
          </Text>
        </View>
        <View className="border-primary/20 bg-primary/10 h-10 w-10 items-center justify-center rounded-lg border">
          <Icon as={LineChart} className="text-primary size-5" />
        </View>
      </Row>
      <ChartContainer>
        {({font}) => {
          const lineColor = getChartPrimaryColor()

          return (
            <CartesianChart
              data={chartData}
              xKey="point"
              yKeys={["price"]}
              padding={12}
              domainPadding={12}
              axisOptions={{
                ...getDefaultChartAxisOptions(font),
                tickCount: {x: 2, y: 4},
                formatXLabel: value => labelByPoint.get(value) ?? "",
                formatYLabel: value => formatMarketsPeso(value),
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
          )
        }}
      </ChartContainer>
    </View>
  )
}
