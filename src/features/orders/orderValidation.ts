import {z} from "zod"

import type {CreateOrderPayload, OrdersInstrument} from "./types"

type OrdersInstrumentLike = {
  id: number
  ticker: string
  name: string
  type: string
  lastPrice: number
}

type BuildCreateOrderPayloadArgs = {
  formValues: OrdersFormValues
  instrument: OrdersInstrument
}

type GetOrdersEstimatedTotalArgs = BuildCreateOrderPayloadArgs & {
  computedQuantity: number
}

type CreateOrderPayloadFromFormValuesArgs = {
  instrument: OrdersInstrument
  values: OrdersFormValues
}

// es-AR: `.` is thousands, `,` is the decimal separator. Keep a single comma so
// fractional share input can reach the integer validation message instead of
// being silently coerced into a larger whole number.
export const sanitizeOrdersEsArNumberInput = (value: string): string => {
  const withoutThousands = value.replace(/\./g, "").replace(/[^0-9,]/g, "")
  const commaIndex = withoutThousands.indexOf(",")

  if (commaIndex === -1) {
    return withoutThousands
  }

  const head = withoutThousands.slice(0, commaIndex + 1)
  const tail = withoutThousands.slice(commaIndex + 1).replace(/,/g, "")

  return head + tail
}

export const sanitizeOrdersIntegerInput = sanitizeOrdersEsArNumberInput
export const sanitizeOrdersDecimalInput = sanitizeOrdersEsArNumberInput

export const ordersIntegerInputSchema = z
  .string()
  .transform(sanitizeOrdersEsArNumberInput)

export const ordersDecimalInputSchema = z
  .string()
  .transform(sanitizeOrdersEsArNumberInput)

const ordersFormBaseSchema = z.object({
  amountText: z.string(),
  limitPriceText: z.string(),
  quantityMode: z.enum(["SHARES", "ARS"]),
  quantityText: z.string(),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
})

export type OrdersFormValues = z.infer<typeof ordersFormBaseSchema>

export const DEFAULT_ORDERS_FORM_STATE: OrdersFormValues = {
  amountText: "",
  limitPriceText: "",
  quantityMode: "SHARES",
  quantityText: "",
  side: "BUY",
  type: "MARKET",
}

export const toOrdersInstrument = (
  instrument: OrdersInstrumentLike
): OrdersInstrument => ({
  id: instrument.id,
  lastPrice: instrument.lastPrice,
  name: instrument.name,
  ticker: instrument.ticker,
  type: instrument.type,
})

export const parseOrdersNumber = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".")
  if (normalized.length === 0) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export const createOrdersFormSchema = (instrument: OrdersInstrument) =>
  ordersFormBaseSchema.superRefine((values, context) => {
    const quantity = getOrdersComputedQuantity({
      formValues: values,
      instrument,
    })

    if (values.quantityMode === "SHARES") {
      const parsedQuantity = parseOrdersNumber(values.quantityText)
      if (!parsedQuantity) {
        context.addIssue({
          code: "custom",
          message: "Ingresá una cantidad de acciones.",
          path: ["quantityText"],
        })
      } else if (!Number.isInteger(parsedQuantity)) {
        context.addIssue({
          code: "custom",
          message: "Ingresá una cantidad entera de acciones.",
          path: ["quantityText"],
        })
      }
    }

    if (values.quantityMode === "ARS") {
      const parsedAmount = parseOrdersNumber(values.amountText)
      if (!parsedAmount) {
        context.addIssue({
          code: "custom",
          message: "Ingresá un monto en pesos mayor a cero.",
          path: ["amountText"],
        })
      } else if (quantity < 1) {
        context.addIssue({
          code: "custom",
          message: "El monto no alcanza para comprar una acción.",
          path: ["amountText"],
        })
      }
    }

    const limitPrice =
      values.type === "LIMIT" ? parseOrdersNumber(values.limitPriceText) : null

    if (values.type === "LIMIT" && !limitPrice) {
      context.addIssue({
        code: "custom",
        message: "Ingresá un precio límite mayor a cero.",
        path: ["limitPriceText"],
      })
    }

    if (quantity < 1 && values.quantityMode === "SHARES") {
      const parsedQuantity = parseOrdersNumber(values.quantityText)
      if (parsedQuantity && Number.isInteger(parsedQuantity)) {
        context.addIssue({
          code: "custom",
          message: "La orden debe enviar al menos una acción.",
          path: ["quantityText"],
        })
      }
    }
  })

export const getOrdersComputedQuantity = ({
  formValues,
  instrument,
}: BuildCreateOrderPayloadArgs): number => {
  if (formValues.quantityMode === "ARS") {
    const amount = parseOrdersNumber(formValues.amountText)
    if (!amount || instrument.lastPrice <= 0) {
      return 0
    }

    return Math.floor(amount / instrument.lastPrice)
  }

  const quantity = parseOrdersNumber(formValues.quantityText)
  if (!quantity || !Number.isInteger(quantity)) {
    return 0
  }

  return quantity
}

export const getOrdersEstimatedTotal = ({
  computedQuantity,
  formValues,
  instrument,
}: GetOrdersEstimatedTotalArgs): number | null => {
  const price =
    formValues.type === "LIMIT"
      ? parseOrdersNumber(formValues.limitPriceText)
      : instrument.lastPrice

  if (!price || computedQuantity <= 0) {
    return null
  }

  const total = price * computedQuantity
  return Number.isFinite(total) ? total : null
}

export const createOrderPayloadFromFormValues = ({
  values,
  instrument,
}: CreateOrderPayloadFromFormValuesArgs): CreateOrderPayload => {
  const quantity = getOrdersComputedQuantity({formValues: values, instrument})
  const limitPrice =
    values.type === "LIMIT" ? parseOrdersNumber(values.limitPriceText) : null

  return {
    instrument_id: instrument.id,
    ...(values.type === "LIMIT" ? {price: limitPrice ?? undefined} : {}),
    quantity,
    side: values.side,
    type: values.type,
  }
}
