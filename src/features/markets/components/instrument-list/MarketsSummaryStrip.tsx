import {View} from "react-native"

import {Activity, ArrowDownRight, ArrowUpRight} from "lucide-react-native"

import {Column} from "@/components/Column"
import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import type {MarketsSummary} from "../../types"

type MarketsSummaryStripProps = {
  summary: MarketsSummary
}

export const MarketsSummaryStrip = ({summary}: MarketsSummaryStripProps) => {
  const advancingRatio =
    summary.total > 0 ? Math.round((summary.up / summary.total) * 100) : 0

  return (
    <Column gap="s" className="-md">
      <Row className="gap-sm">
        <View className="border-border/80 bg-card gap-sm p-md flex-1 rounded-lg border">
          <Row className="items-center justify-between">
            <Text className="text-muted-foreground text-xs font-medium">
              Total
            </Text>
            <Icon as={Activity} className="text-secondary size-4" />
          </Row>
          <Text selectable className="text-foreground text-2xl font-bold">
            {summary.total}
          </Text>
          <Text className="text-muted-foreground text-xs leading-4">
            Instrumentos
          </Text>
        </View>

        <Column
          gap="s"
          expanded
          className="border-success/20 bg-success/10 p-md rounded-lg border"
        >
          <Row className="items-center justify-between">
            <Text className="text-profit text-xs font-medium">Suben</Text>
            <Icon as={ArrowUpRight} className="text-profit size-4" />
          </Row>
          <Text selectable className="text-profit text-2xl font-bold">
            {summary.up}
          </Text>
          <Text className="text-profit/80 text-xs leading-4">
            {advancingRatio}% del panel
          </Text>
        </Column>

        <Column
          expanded
          gap="s"
          className="border-destructive/20 bg-destructive/10 p-md rounded-lg border"
        >
          <Row className="items-center justify-between">
            <Text className="text-loss text-xs font-medium">Bajan</Text>
            <Icon as={ArrowDownRight} className="text-loss size-4" />
          </Row>
          <Text selectable className="text-loss text-2xl font-bold">
            {summary.down}
          </Text>
          <Text className="text-loss/80 text-xs leading-4">Volatilidad</Text>
        </Column>
      </Row>
    </Column>
  )
}
