import {useMutation, useQueryClient} from "@tanstack/react-query"

import {portfolioQueries} from "@/features/portfolio/queries/portfolioQueries"

import {createOrder} from "../api/orders.api"
import {ordersQueries} from "../queries/ordersQueries"

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ordersQueries.all}),
        queryClient.invalidateQueries({queryKey: portfolioQueries.all}),
      ])
    },
  })
}
