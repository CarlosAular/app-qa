// @ts-expect-error This repo runs tests with Bun, but Bun test types are not configured for app compilation.
import {beforeAll, describe, expect, it, mock} from "bun:test"

mock.module("sonner-native", () => ({
  toast: {
    error: () => undefined,
    success: () => undefined,
  },
}))

let orderToasts: typeof import("./orderToasts")

beforeAll(async () => {
  orderToasts = await import("./orderToasts")
})

describe("orderToasts", () => {
  it("maps filled order responses to executed success toasts", () => {
    expect(
      orderToasts.getOrdersCreateOrderResultToast({
        id: "940554",
        status: "FILLED",
      })
    ).toEqual({
      description: "Orden #940554",
      title: "Orden ejecutada",
      type: "success",
    })
  })

  it("maps pending order responses to sent success toasts", () => {
    expect(
      orderToasts.getOrdersCreateOrderResultToast({
        id: "940554",
        status: "PENDING",
      })
    ).toEqual({
      description: "Orden #940554 pendiente",
      title: "Orden enviada",
      type: "success",
    })
  })

  it("maps rejected order responses to error toasts", () => {
    expect(
      orderToasts.getOrdersCreateOrderResultToast({
        id: "940554",
        status: "REJECTED",
      })
    ).toEqual({
      description: "Orden #940554",
      title: "Orden rechazada",
      type: "error",
    })
  })

  it("uses error messages for failed order requests", () => {
    expect(
      orderToasts.getOrdersCreateOrderErrorToast(new Error("Request failed"))
    ).toEqual({
      description: "Request failed",
      title: "No pudimos enviar la orden",
      type: "error",
    })
  })

  it("uses a fallback message for unknown order request failures", () => {
    expect(orderToasts.getOrdersCreateOrderErrorToast("boom")).toEqual({
      description: "Intentá nuevamente en unos segundos.",
      title: "No pudimos enviar la orden",
      type: "error",
    })
  })
})
