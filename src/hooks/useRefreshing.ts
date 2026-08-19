import {useState} from "react"

import {type UseQueryResult} from "@tanstack/react-query"

type AsyncFunction<T = unknown> = () => Promise<T>

type UseRefreshingReturn = {
  isRefreshing: boolean
  refresh: AsyncFunction
}

type QueryResultOrRefreshFn = AsyncFunction | UseQueryResult

export const useRefreshing = (
  ...sources: QueryResultOrRefreshFn[]
): UseRefreshingReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = async () => {
    try {
      setIsRefreshing(true)
      await Promise.all(
        sources.map(source => {
          if (typeof source === "function") {
            return source()
          } else {
            return source.refetch()
          }
        })
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  return {isRefreshing, refresh}
}
