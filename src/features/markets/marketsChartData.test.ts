// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  buildMarketsChartData,
  getMarketsChartAccessibilityLabel,
} from "./marketsChartData"

describe("marketsChartData", () => {
  it("builds close and last price comparison points", () => {
    expect(buildMarketsChartData({closePrice: 100, lastPrice: 105})).toEqual([
      {point: 0, price: 100, label: "Cierre"},
      {point: 1, price: 105, label: "Último"},
    ])
  })

  it("describes chart values for accessibility", () => {
    const label = getMarketsChartAccessibilityLabel({
      closePrice: 100,
      dailyReturnPercent: 5,
      lastPrice: 105,
      ticker: "GGAL",
    })

    expect(label).toContain("GGAL")
    expect(label).toContain("cierre 100")
    expect(label).toContain("último 105")
    expect(label).toContain("5.00")
  })
})
