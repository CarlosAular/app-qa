// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {normalizeSearchQuery, sortSearchResultsByTicker} from "./searchText"
import type {SearchResult} from "./types"

describe("searchText", () => {
  it("trims and uppercases ticker query text", () => {
    expect(normalizeSearchQuery(" dyc ")).toBe("DYC")
    expect(normalizeSearchQuery("bbar")).toBe("BBAR")
  })

  it("normalizes whitespace-only input to an empty query", () => {
    expect(normalizeSearchQuery("   ")).toBe("")
  })

  it("sorts results by ticker", () => {
    const results: SearchResult[] = [
      {
        closePrice: 24.44,
        id: 16,
        lastPrice: 27.12,
        name: "Garovaglio Y Zorraquin",
        ticker: "GARO",
        type: "ACCIONES",
      },
      {
        closePrice: 50.07,
        id: 1,
        lastPrice: 45.72,
        name: "Dycasa S.A.",
        ticker: "DYCA",
        type: "ACCIONES",
      },
      {
        closePrice: 71.67,
        id: 22,
        lastPrice: 79.36,
        name: "Banco Frances",
        ticker: "BBAR",
        type: "ACCIONES",
      },
    ]

    expect(
      sortSearchResultsByTicker(results).map(result => result.ticker)
    ).toEqual(["BBAR", "DYCA", "GARO"])
    expect(results.map(result => result.ticker)).toEqual([
      "GARO",
      "DYCA",
      "BBAR",
    ])
  })
})
