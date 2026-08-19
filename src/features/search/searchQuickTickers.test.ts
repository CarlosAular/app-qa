// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {getSearchQuickTickers} from "./searchQuickTickers"

describe("getSearchQuickTickers", () => {
  it("returns the top movers by absolute daily return", () => {
    expect(
      getSearchQuickTickers([
        {dailyReturnPercent: 2, ticker: "CAPX"},
        {dailyReturnPercent: -8.69, ticker: "DYCA"},
        {dailyReturnPercent: 11.83, ticker: "PGR"},
        {dailyReturnPercent: 0, ticker: "ARS"},
      ])
    ).toEqual(["PGR", "DYCA", "CAPX"])
  })

  it("returns fewer than three when the feed is short", () => {
    expect(
      getSearchQuickTickers([{dailyReturnPercent: 1, ticker: "MOLA"}])
    ).toEqual(["MOLA"])
  })
})
