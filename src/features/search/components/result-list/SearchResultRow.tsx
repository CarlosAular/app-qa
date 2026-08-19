import {Pressable, View} from "react-native"

import {ChevronRight} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {SearchResultTickerAvatar} from "./SearchResultTickerAvatar"

import {formatSearchPeso} from "../../searchFormatters"
import type {SearchResult} from "../../types"

type SearchResultRowProps = {
  onPress: (result: SearchResult) => void
  result: SearchResult
}

export const SearchResultRow = ({onPress, result}: SearchResultRowProps) => {
  const price = formatSearchPeso(result.lastPrice)
  const accessibilityLabel = `${result.ticker}, ${result.name}, ${result.type}, ultimo precio ${price}`

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="border-border/80 bg-card mb-sm px-md py-md active:bg-muted/70 min-h-[88px] rounded-lg border"
      onPress={() => onPress(result)}
    >
      <Row className="gap-md items-center">
        <SearchResultTickerAvatar ticker={result.ticker} />

        <View className="gap-xs min-w-0 flex-1">
          <Text selectable className="text-foreground text-base font-bold">
            {result.ticker}
          </Text>
          <Text
            selectable
            className="text-muted-foreground text-sm leading-5"
            numberOfLines={1}
          >
            {result.name}
          </Text>
        </View>

        <View className="gap-xs shrink-0 items-end">
          <Text
            selectable
            className="text-foreground text-base font-semibold tabular-nums"
            style={{fontVariant: ["tabular-nums"]}}
          >
            {price}
          </Text>
          <View className="border-border bg-muted/40 px-sm py-xs rounded-md border">
            <Text
              selectable
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              {result.type}
            </Text>
          </View>
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
