import {queryOptions} from "@tanstack/react-query"

import {getSearchResults} from "../api/search.api"
import {normalizeSearchQuery} from "../searchText"

const SEARCH_BASE_QUERY_KEY = "search"

export const searchQueries = {
  all: [SEARCH_BASE_QUERY_KEY] as const,
  results: (query: string) => {
    const normalizedQuery = normalizeSearchQuery(query)

    return queryOptions({
      enabled: normalizedQuery.length > 0,
      gcTime: 5 * 60_000,
      queryFn: () => getSearchResults(normalizedQuery),
      queryKey: [SEARCH_BASE_QUERY_KEY, "results", normalizedQuery] as const,
      staleTime: 30_000,
    })
  },
} as const
