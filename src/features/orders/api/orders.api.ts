import {isAxiosError} from "axios"
import {z} from "zod"

import {api} from "@/config/api.config"

import {getOrdersApiErrorMessage} from "../orderErrorMessages"
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  OrdersHistoryOrder,
} from "../types"

const createOrderBasePayloadSchema = z.object({
  instrument_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  side: z.enum(["BUY", "SELL"]),
})

const createOrderPayloadSchema = z.discriminatedUnion("type", [
  createOrderBasePayloadSchema
    .extend({
      type: z.literal("MARKET"),
    })
    .strict(),
  createOrderBasePayloadSchema
    .extend({
      price: z.number().positive(),
      type: z.literal("LIMIT"),
    })
    .strict(),
])

const createOrderResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  status: z.enum(["PENDING", "REJECTED", "FILLED"]),
})

const createOrderErrorSchema = z.object({
  error: z.string().min(1),
})

// The API rejects orders it cannot execute (unknown instrument, insufficient
// cash or shares) with a 400 and an explanatory `error` string. Surface that
// message so the order ticket can show the real reason.
const toCreateOrderError = (error: unknown): Error => {
  if (isAxiosError(error)) {
    const parsedError = createOrderErrorSchema.safeParse(error.response?.data)

    if (parsedError.success) {
      return new Error(getOrdersApiErrorMessage(parsedError.data.error))
    }
  }

  return error instanceof Error ? error : new Error("Order request failed")
}

export const createOrder = async (
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  const parsedPayload = createOrderPayloadSchema.safeParse(payload)

  if (!parsedPayload.success) {
    throw new Error("Invalid order request")
  }

  try {
    const response = await api.post("/orders", parsedPayload.data)
    const parsedResponse = createOrderResponseSchema.safeParse(response.data)

    if (!parsedResponse.success) {
      throw new Error("Invalid order response")
    }

    return {
      id: String(parsedResponse.data.id),
      status: parsedResponse.data.status,
    }
  } catch (error) {
    throw toCreateOrderError(error)
  }
}

const ordersHistoryApiItemSchema = z.object({
  created_at: z.string(),
  id: z.union([z.string(), z.number()]),
  instrument_id: z.number(),
  price: z.number(),
  quantity: z.number(),
  side: z.enum(["BUY", "SELL"]),
  status: z.enum(["PENDING", "REJECTED", "FILLED"]),
  type: z.enum(["MARKET", "LIMIT"]),
})

const ordersHistoryResponseSchema = z.array(ordersHistoryApiItemSchema)

export const getOrdersHistory = async (): Promise<OrdersHistoryOrder[]> => {
  const response = await api.get("/orders")
  const parsed = ordersHistoryResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error("Invalid orders response")
  }

  return parsed.data.map(item => ({
    createdAt: item.created_at,
    id: String(item.id),
    instrumentId: item.instrument_id,
    price: item.price,
    quantity: item.quantity,
    side: item.side,
    status: item.status,
    type: item.type,
  }))
}

const resetOrdersResponseSchema = z.object({
  ok: z.literal(true),
})

export const resetOrders = async (): Promise<void> => {
  const response = await api.post("/reset")
  const parsed = resetOrdersResponseSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error("Invalid reset response")
  }
}
