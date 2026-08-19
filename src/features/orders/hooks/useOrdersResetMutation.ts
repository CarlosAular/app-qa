import {useMutation, useQueryClient} from "@tanstack/react-query"

import {portfolioQueries} from "@/features/portfolio/queries/portfolioQueries"

import {resetOrders} from "../api/orders.api"
import {ordersQueries} from "../queries/ordersQueries"

export const useOrdersResetMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetOrders,
    onSuccess: async () => {
      // Reset clears the order history, and the portfolio is derived from it.
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ordersQueries.all}),
        queryClient.invalidateQueries({queryKey: portfolioQueries.all}),
      ])
    },
  })
}
