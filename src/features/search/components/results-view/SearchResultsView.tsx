import {View} from "react-native"

import {FlashList} from "@shopify/flash-list"
import {Search} from "lucide-react-native"
import type {Control} from "react-hook-form"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import type {SearchFormValues} from "../../searchFormSchema"
import type {SearchQueryState, SearchResult} from "../../types"
import {SearchResultRow} from "../result-list/SearchResultRow"
import {SearchInputField} from "../search-input/SearchInputField"
import {SearchEmptyState} from "../states/SearchEmptyState"
import {SearchErrorState} from "../states/SearchErrorState"
import {SearchLoadingState} from "../states/SearchLoadingState"

type SearchResultsViewProps = {
  control: Control<SearchFormValues>
  debouncedQuery: string
  errorMessage: string | null
  onQueryChange: (value: string) => void
  onRefresh: () => void
  onResultPress: (result: SearchResult) => void
  refreshing: boolean
  results: SearchResult[]
  state: SearchQueryState
  suggestedTickers: string[]
}

type SearchResultsViewHeaderProps = {
  control: Control<SearchFormValues>
  resultsCount: number
  state: SearchQueryState
}

const SearchResultsViewHeader = ({
  control,
  resultsCount,
  state,
}: SearchResultsViewHeaderProps) => {
  const resultsLabel =
    resultsCount === 1 ? "1 resultado" : `${resultsCount} resultados`

  return (
    <View className="gap-lg pt-lg pb-lg">
      <Row className="gap-lg items-start justify-between">
        <View className="gap-xs min-w-0 flex-1">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">
            Centro de órdenes
          </Text>
          <Text className="text-foreground text-3xl font-bold">
            Buscar activos
          </Text>
          <Text className="text-muted-foreground text-sm leading-5">
            Encontrá tickers y abrí un ticket de compra o venta.
          </Text>
        </View>

        <View className="border-primary/20 bg-primary/10 h-12 w-12 items-center justify-center rounded-lg border">
          <Icon as={Search} className="text-primary size-6" />
        </View>
      </Row>

      <SearchInputField control={control} />

      {state === "results" ? (
        <View className="gap-xs">
          <Text className="text-foreground text-lg font-semibold">
            Resultados
          </Text>
          <Text className="text-muted-foreground text-sm">{resultsLabel}</Text>
        </View>
      ) : null}
    </View>
  )
}

type SearchResultsViewEmptyProps = {
  debouncedQuery: string
  errorMessage: string | null
  onRefresh: () => void
  onSuggestionPress: (value: string) => void
  state: SearchQueryState
  suggestedTickers: string[]
}

const SearchResultsViewEmpty = ({
  debouncedQuery,
  errorMessage,
  onRefresh,
  onSuggestionPress,
  state,
  suggestedTickers,
}: SearchResultsViewEmptyProps) => {
  if (state === "loading") {
    return <SearchLoadingState />
  }

  if (state === "error") {
    return (
      <SearchErrorState
        message={errorMessage ?? "Intenta nuevamente en unos segundos."}
        onRetry={onRefresh}
      />
    )
  }

  if (state === "empty") {
    return <SearchEmptyState query={debouncedQuery} state="empty" />
  }

  return (
    <SearchEmptyState
      onSuggestionPress={onSuggestionPress}
      query={debouncedQuery}
      state="idle"
      suggestedTickers={suggestedTickers}
    />
  )
}

export const SearchResultsView = ({
  control,
  debouncedQuery,
  errorMessage,
  onQueryChange,
  onRefresh,
  onResultPress,
  refreshing,
  results,
  state,
  suggestedTickers,
}: SearchResultsViewProps) => {
  return (
    <FlashList
      contentInsetAdjustmentBehavior="never"
      contentContainerClassName="pb-safe pt-safe px-street"
      data={state === "results" ? results : []}
      keyExtractor={result => `${result.id}`}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <SearchResultsViewEmpty
          debouncedQuery={debouncedQuery}
          errorMessage={errorMessage}
          onRefresh={onRefresh}
          onSuggestionPress={onQueryChange}
          state={state}
          suggestedTickers={suggestedTickers}
        />
      }
      ListHeaderComponent={
        <SearchResultsViewHeader
          control={control}
          resultsCount={results.length}
          state={state}
        />
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={({item}) => (
        <SearchResultRow onPress={onResultPress} result={item} />
      )}
      showsVerticalScrollIndicator={false}
    />
  )
}
