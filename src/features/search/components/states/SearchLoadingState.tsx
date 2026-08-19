import {View} from "react-native"

import {Row} from "@/components/Row"
import {Skeleton} from "@/components/ui/skeleton"
import {Text} from "@/components/ui/text"

const SEARCH_LOADING_ROWS = ["row-1", "row-2", "row-3", "row-4"]

export const SearchLoadingState = () => {
  return (
    <View className="gap-md">
      <Text className="text-muted-foreground text-sm">Buscando activos…</Text>
      {SEARCH_LOADING_ROWS.map(row => (
        <Row
          className="border-border/80 bg-card gap-md px-md py-md min-h-[88px] items-center rounded-lg border"
          key={row}
        >
          <Skeleton className="h-12 w-12 rounded-lg" />
          <View className="gap-sm min-w-0 flex-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-44" />
          </View>
          <View className="gap-sm items-end">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </View>
        </Row>
      ))}
    </View>
  )
}
