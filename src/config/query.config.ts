import {QueryClient} from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60_000,
      staleTime: 30_000,
    },
  },
})
