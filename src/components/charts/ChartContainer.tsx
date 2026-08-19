import {type ReactNode} from "react"
import {View} from "react-native"

import {useFont} from "@shopify/react-native-skia"

import {
  CHART_HEIGHT,
  getChartFrameColor,
  getChartGridColor,
  getChartLabelColor,
} from "./chartTheme"

const chartFont = require("../../../assets/fonts/PlusJakartaSans-Medium.ttf")

type ChartFont = NonNullable<ReturnType<typeof useFont>>

type ChartContainerProps = {
  children: (options: {font: ChartFont}) => ReactNode
}

export const ChartContainer = ({children}: ChartContainerProps) => {
  const font = useFont(chartFont, 12)

  return (
    <View className="border-border/80 bg-card p-md w-full overflow-hidden rounded-lg border">
      <View className="w-full" style={{height: CHART_HEIGHT}}>
        {font ? children({font}) : null}
      </View>
    </View>
  )
}

export const getDefaultChartAxisOptions = (font: ChartFont) => ({
  font,
  tickCount: {x: 3, y: 4},
  labelColor: {
    x: getChartLabelColor(),
    y: getChartLabelColor(),
  },
  lineColor: {
    grid: {x: getChartGridColor(), y: getChartGridColor()},
    frame: getChartFrameColor(),
  },
  lineWidth: {grid: {x: 0, y: 1}, frame: 1},
})
