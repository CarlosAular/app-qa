// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  buildPortfolioChartData,
  getPortfolioChartLineColor,
} from "./portfolioChartData"

describe("portfolioChartData", () => {
  it("builds average cost, close, and last price points", () => {
    expect(
      buildPortfolioChartData({
        avgCostPrice: 90,
        closePrice: 95,
        lastPrice: 100,
      })
    ).toEqual([
      {point: 0, price: 90, label: "PPP"},
      {point: 1, price: 95, label: "Cierre"},
      {point: 2, price: 100, label: "Último"},
    ])
  })

  it("maps direction to chart line colors", () => {
    expect(getPortfolioChartLineColor("up")).toBe("#34d399")
    expect(getPortfolioChartLineColor("down")).toBe("#fb7185")
    expect(getPortfolioChartLineColor("flat")).toBe("#38bdf8")
  })
})
