export type SearchResultApiItem = {
  close_price: number
  id: number
  last_price: number
  name: string
  ticker: string
  type: string
}

export type SearchResult = {
  closePrice: number
  id: number
  lastPrice: number
  name: string
  ticker: string
  type: string
}

export type SearchQueryState =
  | "idle"
  | "loading"
  | "error"
  | "empty"
  | "results"
