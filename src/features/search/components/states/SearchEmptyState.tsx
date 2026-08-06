import {View} from "react-native"

import {Search, SearchX} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {SearchQuickTickerSuggestions} from "../quick-ticker-suggestions/SearchQuickTickerSuggestions"

type SearchEmptyStateProps = {
  onSuggestionPress?: (ticker: string) => void
  query: string
  state: "idle" | "empty"
  suggestedTickers?: string[]
}

export const SearchEmptyState = ({
  onSuggestionPress,
  query,
  state,
  suggestedTickers = [],
}: SearchEmptyStateProps) => {
  const isIdle = state === "idle"
  const title = isIdle ? "Explorá el mercado" : `Sin resultados para “${query}”`
  const description = isIdle
    ? "Ingresá el símbolo del activo o elegí uno de los más movidos para empezar."
    : "Probá con otro ticker del mercado o revisá la ortografía."

  return (
    <View className="border-border/80 bg-card gap-lg px-md py-xl w-full rounded-lg border">
      <Row className="gap-md items-start">
        <View
          className={
            isIdle
              ? "border-primary/25 bg-primary/15 h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
              : "border-border bg-muted/50 h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
          }
        >
          <Icon
            as={isIdle ? Search : SearchX}
            className={
              isIdle ? "text-primary size-5" : "text-muted-foreground size-5"
            }
          />
        </View>

        <View className="gap-xs pt-xs min-w-0 flex-1">
          <Text className="text-foreground text-lg font-semibold">{title}</Text>
          <Text className="text-muted-foreground text-sm leading-5">
            {description}
          </Text>
        </View>
      </Row>

      {isIdle && onSuggestionPress && suggestedTickers.length > 0 ? (
        <View className="gap-sm border-border/60 pt-lg border-t">
          <Text className="text-muted-foreground text-xs font-medium uppercase">
            Más movidos
          </Text>
          <SearchQuickTickerSuggestions
            onSuggestionPress={onSuggestionPress}
            tickers={suggestedTickers}
          />
        </View>
      ) : null}
    </View>
  )
}
