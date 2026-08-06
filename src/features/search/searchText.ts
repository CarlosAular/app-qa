import type {SearchResult} from "./types"

export const normalizeSearchQuery = (query: string) =>
  query.trim().toUpperCase()

export const sortSearchResultsByTicker = (results: SearchResult[]) => {
  return [...results].sort((left, right) =>
    left.ticker.localeCompare(right.ticker, "es-AR")
  )
}
