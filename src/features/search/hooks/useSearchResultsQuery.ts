import {useQuery} from "@tanstack/react-query"

import {searchQueries} from "../queries/searchQueries"

export const useSearchResultsQuery = (query: string) => {
  return useQuery(searchQueries.results(query))
}
