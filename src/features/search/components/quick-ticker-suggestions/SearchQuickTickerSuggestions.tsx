import {Pressable} from "react-native"

import {Row} from "@/components/Row"
import {Text} from "@/components/ui/text"

type SearchQuickTickerSuggestionsProps = {
  onSuggestionPress: (ticker: string) => void
  tickers: string[]
}

export const SearchQuickTickerSuggestions = ({
  onSuggestionPress,
  tickers,
}: SearchQuickTickerSuggestionsProps) => {
  if (tickers.length === 0) {
    return null
  }

  return (
    <Row className="gap-sm w-full flex-wrap">
      {tickers.map(ticker => (
        <Pressable
          accessibilityLabel={`Buscar ${ticker}`}
          accessibilityRole="button"
          className="border-border bg-muted/40 px-lg py-sm active:border-primary/40 active:bg-primary/10 min-h-[44px] rounded-lg border"
          key={ticker}
          onPress={() => onSuggestionPress(ticker)}
        >
          <Text className="text-foreground text-sm font-semibold">
            {ticker}
          </Text>
        </Pressable>
      ))}
    </Row>
  )
}
