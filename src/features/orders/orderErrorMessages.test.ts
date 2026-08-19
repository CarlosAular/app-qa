// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {getOrdersApiErrorMessage} from "./orderErrorMessages"

describe("getOrdersApiErrorMessage", () => {
  it("maps known API rejection strings to Spanish", () => {
    expect(getOrdersApiErrorMessage("Insufficient cash")).toBe(
      "No tenés efectivo suficiente."
    )
    expect(getOrdersApiErrorMessage("Insufficient shares")).toBe(
      "No tenés acciones suficientes."
    )
    expect(getOrdersApiErrorMessage("Instrument not found")).toBe(
      "No encontramos ese instrumento."
    )
  })

  it("passes through unknown messages", () => {
    expect(getOrdersApiErrorMessage("Something unexpected")).toBe(
      "Something unexpected"
    )
  })
})
