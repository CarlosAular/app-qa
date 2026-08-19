// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {describe, expect, it} from "bun:test"

import {
  DEFAULT_ORDERS_FORM_STATE,
  getOrdersEstimatedTotal,
  type OrdersFormValues,
} from "./orderValidation"
import type {OrdersInstrument} from "./types"

const instrument: OrdersInstrument = {
  id: 1,
  lastPrice: 74.68,
  name: "S.A San Miguel",
  ticker: "SAMI",
  type: "ACCIONES",
}

const createFormValues = (
  values: Partial<OrdersFormValues>
): OrdersFormValues => ({
  ...DEFAULT_ORDERS_FORM_STATE,
  ...values,
})

describe("order calculations", () => {
  it("uses the instrument price for market order estimates", () => {
    const total = getOrdersEstimatedTotal({
      computedQuantity: 3,
      formValues: createFormValues({quantityText: "3"}),
      instrument,
    })

    expect(total).toBeCloseTo(224.04)
  })

  it("uses the limit price for limit order estimates", () => {
    const total = getOrdersEstimatedTotal({
      computedQuantity: 3,
      formValues: createFormValues({
        limitPriceText: "80,50",
        quantityText: "3",
        type: "LIMIT",
      }),
      instrument,
    })

    expect(total).toBeCloseTo(241.5)
  })

  it("returns null when the quantity or price cannot produce an estimate", () => {
    expect(
      getOrdersEstimatedTotal({
        computedQuantity: 0,
        formValues: createFormValues({quantityText: ""}),
        instrument,
      })
    ).toBeNull()

    expect(
      getOrdersEstimatedTotal({
        computedQuantity: 3,
        formValues: createFormValues({
          limitPriceText: "",
          quantityText: "3",
          type: "LIMIT",
        }),
        instrument,
      })
    ).toBeNull()
  })
})
