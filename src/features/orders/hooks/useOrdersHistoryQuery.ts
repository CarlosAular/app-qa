import {useQuery} from "@tanstack/react-query"

import {ordersQueries} from "../queries/ordersQueries"

export const useOrdersHistoryQuery = () => {
  return useQuery(ordersQueries.history())
}
