import {View} from "react-native"

import {Container} from "@/components/Container"
import {Row} from "@/components/Row"
import {Card} from "@/components/ui/card"
import {Skeleton} from "@/components/ui/skeleton"

const MARKETS_LOADING_ROWS = ["row-1", "row-2", "row-3", "row-4", "row-5"]

export const MarketsLoadingState = () => {
  return (
    <Container expanded className="gap-md pt-safe">
      <View className="gap-md pt-lg">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
      </View>
      <Row className="gap-sm">
        <Skeleton className="h-24 flex-1 rounded-lg" />
        <Skeleton className="h-24 flex-1 rounded-lg" />
        <Skeleton className="h-24 flex-1 rounded-lg" />
      </Row>
      <Card className="gap-0 overflow-hidden py-0">
        {MARKETS_LOADING_ROWS.map(row => (
          <Row
            className="border-border px-md py-md min-h-[88px] items-center justify-between border-b"
            key={row}
          >
            <Row className="gap-md items-center">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <View className="gap-sm">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-40" />
              </View>
            </Row>
            <View className="gap-sm items-end">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </View>
          </Row>
        ))}
      </Card>
    </Container>
  )
}
