import type {
  MarketsInstrument,
  MarketsInstrumentDirection,
  MarketsSummary,
} from "./types"

export const getMarketsDailyReturnPercent = ({
  lastPrice,
  closePrice,
}: {
  lastPrice: number
  closePrice: number
}) => {
  if (closePrice <= 0) {
    return 0
  }

  return ((lastPrice - closePrice) / closePrice) * 100
}

export const getMarketsInstrumentDirection = (
  dailyReturnPercent: number
): MarketsInstrumentDirection => {
  if (dailyReturnPercent > 0) {
    return "up"
  }

  if (dailyReturnPercent < 0) {
    return "down"
  }

  return "flat"
}

export const getMarketsSummary = (
  instruments: MarketsInstrument[]
): MarketsSummary => {
  return instruments.reduce<MarketsSummary>(
    (summary, instrument) => {
      if (instrument.direction === "up") {
        return {...summary, up: summary.up + 1}
      }

      if (instrument.direction === "down") {
        return {...summary, down: summary.down + 1}
      }

      return summary
    },
    {
      total: instruments.length,
      up: 0,
      down: 0,
    }
  )
}
