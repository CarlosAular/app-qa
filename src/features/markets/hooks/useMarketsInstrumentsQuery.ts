import {useQuery} from "@tanstack/react-query"

import {marketsQueries} from "../queries/marketsQueries"

export const useMarketsInstrumentsQuery = () => {
  return useQuery(marketsQueries.instruments())
}
