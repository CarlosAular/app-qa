// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {beforeAll, describe, expect, it, mock} from "bun:test"

import type {PortfolioHoldings, PortfolioPosition} from "./types"

mock.module("@/config/api.config", () => ({
  api: {
    get: async () => ({data: {cash: 1_000_000, holdings: []}}),
  },
}))

let portfolioQueries: typeof import("./queries/portfolioQueries").portfolioQueries

beforeAll(async () => {
  portfolioQueries = (await import("./queries/portfolioQueries"))
    .portfolioQueries
})

const positions: PortfolioPosition[] = [
  {
    avgCostPrice: 91.86,
    closePrice: 88.31,
    costBasis: 367.44,
    direction: "up",
    gain: 22.8,
    instrumentId: 11,
    lastPrice: 97.56,
    marketValue: 390.24,
    positionId: "11-0",
    quantity: 4,
    returnRatio: 0.062051,
    ticker: "GAMI",
  },
  {
    avgCostPrice: 49.62,
    closePrice: 28.57,
    costBasis: 4962,
    direction: "down",
    gain: -1767,
    instrumentId: 3,
    lastPrice: 31.95,
    marketValue: 3195,
    positionId: "3-1",
    quantity: 100,
    returnRatio: -0.35610640870616685,
    ticker: "PGR",
  },
]

const holdings: PortfolioHoldings = {cash: 1_000_000, positions}

describe("portfolioQueries", () => {
  it("keys position detail queries by position id", () => {
    expect(portfolioQueries.positionById("11-0").queryKey).toEqual([
      "portfolio",
      "positions",
      "11-0",
    ])
  })

  it("selects the matching position by route id", () => {
    const selected = portfolioQueries.positionById("11-0").select?.(holdings)

    expect(selected).toEqual(positions[0])
  })

  it("returns undefined when the position id is not present", () => {
    const selected = portfolioQueries.positionById("99-0").select?.(holdings)

    expect(selected).toBeUndefined()
  })
})
