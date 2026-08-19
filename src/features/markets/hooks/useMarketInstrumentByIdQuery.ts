import {useQuery} from "@tanstack/react-query"

import {marketsQueries} from "../queries/marketsQueries"

export const useMarketInstrumentByIdQuery = (instrumentId: number) => {
  return useQuery(marketsQueries.instrumentById(instrumentId))
}
