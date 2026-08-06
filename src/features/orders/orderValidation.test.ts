// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  sanitizeOrdersDecimalInput,
  sanitizeOrdersIntegerInput,
} from "./orderValidation"

describe("sanitizeOrdersIntegerInput", () => {
  it("keeps a decimal comma so fractional shares are not coerced", () => {
    expect(sanitizeOrdersIntegerInput("1,5")).toBe("1,5")
  })

  it("strips es-AR thousands separators", () => {
    expect(sanitizeOrdersIntegerInput("1.000")).toBe("1000")
  })

  it("keeps only the first decimal comma", () => {
    expect(sanitizeOrdersIntegerInput("1,5,0")).toBe("1,50")
  })

  it("strips letters", () => {
    expect(sanitizeOrdersIntegerInput("abc")).toBe("")
  })

  it("keeps an empty string empty", () => {
    expect(sanitizeOrdersIntegerInput("")).toBe("")
  })
})

describe("sanitizeOrdersDecimalInput", () => {
  it("normalizes es-AR thousands and decimal separators", () => {
    expect(sanitizeOrdersDecimalInput("1.000,50")).toBe("1000,50")
  })

  it("keeps a simple decimal comma", () => {
    expect(sanitizeOrdersDecimalInput("84,50")).toBe("84,50")
  })

  it("strips letters", () => {
    expect(sanitizeOrdersDecimalInput("abc")).toBe("")
  })

  it("keeps an empty string empty", () => {
    expect(sanitizeOrdersDecimalInput("")).toBe("")
  })

  it("keeps only the first decimal comma", () => {
    expect(sanitizeOrdersDecimalInput("1,00,5")).toBe("1,005")
  })
})
