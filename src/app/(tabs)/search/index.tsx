import {zodResolver} from "@hookform/resolvers/zod"
import {StatusBar} from "expo-status-bar"

import {useForm, useWatch} from "react-hook-form"

import {useMarketsInstrumentsQuery} from "@/features/markets/hooks/useMarketsInstrumentsQuery"
import {OrdersTicketSheet} from "@/features/orders/components/ticket/OrdersTicketSheet"
import {toOrdersInstrument} from "@/features/orders/orderValidation"
import {SearchResultsView} from "@/features/search/components/results-view/SearchResultsView"
import {useSearchResultsQuery} from "@/features/search/hooks/useSearchResultsQuery"
import {
  DEFAULT_SEARCH_FORM_STATE,
  searchFormSchema,
  type SearchFormValues,
} from "@/features/search/searchFormSchema"
import {getSearchQuickTickers} from "@/features/search/searchQuickTickers"
import type {SearchQueryState, SearchResult} from "@/features/search/types"
import {useDebounce} from "@/hooks/useDebounce"
import {useModal} from "@/hooks/useModal"
import {useRefreshing} from "@/hooks/useRefreshing"

const SEARCH_DEBOUNCE_MS = 350

const getSearchErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return "Intenta nuevamente en unos segundos."
}

const getSearchQueryState = ({
  debouncedQuery,
  isError,
  isFetching,
  results,
}: {
  debouncedQuery: string
  isError: boolean
  isFetching: boolean
  results: SearchResult[]
}): SearchQueryState => {
  if (debouncedQuery.length === 0) {
    return "idle"
  }

  if (isFetching && results.length === 0) {
    return "loading"
  }

  if (isError) {
    return "error"
  }

  if (results.length === 0) {
    return "empty"
  }

  return "results"
}

export default function SearchRoute() {
  const form = useForm<SearchFormValues>({
    defaultValues: DEFAULT_SEARCH_FORM_STATE,
    mode: "onChange",
    resolver: zodResolver(searchFormSchema),
  })
  const query = useWatch({control: form.control, name: "query"})
  const showOrdersTicket = useModal(OrdersTicketSheet)
  const debouncedValue = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const instrumentsQuery = useMarketsInstrumentsQuery()

  const resultsQuery = useSearchResultsQuery(debouncedValue)
  const results = resultsQuery.data ?? []
  const state = getSearchQueryState({
    debouncedQuery: debouncedValue,
    isError: resultsQuery.isError,
    isFetching: resultsQuery.isFetching,
    results,
  })
  const {isRefreshing, refresh} = useRefreshing(resultsQuery)
  const suggestedTickers = getSearchQuickTickers(instrumentsQuery.data ?? [])

  const handleResultPress = (result: SearchResult) => {
    showOrdersTicket({
      instrument: toOrdersInstrument(result),
    })
  }

  const handleQueryChange = (value: string) => {
    form.setValue("query", value)
  }

  return (
    <>
      <StatusBar style="light" />
      <SearchResultsView
        control={form.control}
        debouncedQuery={debouncedValue}
        errorMessage={
          resultsQuery.isError
            ? getSearchErrorMessage(resultsQuery.error)
            : null
        }
        onQueryChange={handleQueryChange}
        onRefresh={refresh}
        onResultPress={handleResultPress}
        refreshing={isRefreshing}
        results={results}
        state={state}
        suggestedTickers={suggestedTickers}
      />
    </>
  )
}
