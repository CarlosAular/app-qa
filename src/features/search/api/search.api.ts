import {z} from "zod"

import {api} from "@/config/api.config"

import {sortSearchResultsByTicker} from "../searchText"
import type {SearchResult, SearchResultApiItem} from "../types"

const searchResultApiItemSchema = z.object({
  close_price: z.number(),
  id: z.number(),
  last_price: z.number(),
  name: z.string(),
  ticker: z.string(),
  type: z.string(),
})

const searchResultsResponseSchema = z.array(searchResultApiItemSchema)

const toSearchResult = (item: SearchResultApiItem): SearchResult => {
  return {
    closePrice: item.close_price,
    id: item.id,
    lastPrice: item.last_price,
    name: item.name,
    ticker: item.ticker,
    type: item.type,
  }
}

export const getSearchResults = async (
  query: string
): Promise<SearchResult[]> => {
  const response = await api.get("/search", {
    params: {
      query,
    },
  })
  const parsed = searchResultsResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error("Invalid search response")
  }

  return sortSearchResultsByTicker(parsed.data.map(toSearchResult))
}
