// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  getPortfolioPositionDirection,
  getPortfolioPositionMetrics,
  getPortfolioSummary,
} from "./portfolioMath"
import type {PortfolioPosition} from "./types"

describe("portfolioMath", () => {
  it("calculates position market value, gain, and return ratio", () => {
    const metrics = getPortfolioPositionMetrics({
      avgCostPrice: 91.86,
      lastPrice: 97.56,
      quantity: 4,
    })

    expect(metrics.costBasis).toBeCloseTo(367.44)
    expect(metrics.marketValue).toBeCloseTo(390.24)
    expect(metrics.gain).toBeCloseTo(22.8)
    expect(metrics.returnRatio).toBeCloseTo(0.062051)
  })

  it("returns zero ratio when cost basis is not positive", () => {
    expect(
      getPortfolioPositionMetrics({
        avgCostPrice: 0,
        lastPrice: 10,
        quantity: 10,
      })
    ).toEqual({
      costBasis: 0,
      gain: 100,
      marketValue: 100,
      returnRatio: 0,
    })
  })

  it("classifies positive, negative, and flat position performance", () => {
    expect(getPortfolioPositionDirection(10)).toBe("up")
    expect(getPortfolioPositionDirection(-10)).toBe("down")
    expect(getPortfolioPositionDirection(0)).toBe("flat")
  })

  it("aggregates portfolio summary totals", () => {
    const positions: PortfolioPosition[] = [
      {
        avgCostPrice: 91.86,
        closePrice: 88.31,
        costBasis: 367.44,
        direction: "up",
        gain: 22.80000000000001,
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

    const summary = getPortfolioSummary(positions, 12_345.67)

    expect(summary.positions).toBe(2)
    expect(summary.cash).toBeCloseTo(12_345.67)
    expect(summary.totalCostBasis).toBeCloseTo(5329.44)
    expect(summary.totalMarketValue).toBeCloseTo(3585.24)
    expect(summary.totalGain).toBeCloseTo(-1744.2)
    expect(summary.totalReturnRatio).toBeCloseTo(-0.327084)
  })

  it("reports available cash with no positions", () => {
    const summary = getPortfolioSummary([], 1_000_000)

    expect(summary.cash).toBe(1_000_000)
    expect(summary.positions).toBe(0)
    expect(summary.totalMarketValue).toBe(0)
    expect(summary.totalReturnRatio).toBe(0)
  })
})
