const SEARCH_QUICK_TICKER_COUNT = 3

type SearchQuickTickerInstrument = {
  dailyReturnPercent: number
  ticker: string
}

export const getSearchQuickTickers = (
  instruments: SearchQuickTickerInstrument[]
): string[] =>
  [...instruments]
    .sort(
      (left, right) =>
        Math.abs(right.dailyReturnPercent) - Math.abs(left.dailyReturnPercent)
    )
    .slice(0, SEARCH_QUICK_TICKER_COUNT)
    .map(instrument => instrument.ticker)
