import {z} from "zod"

export const instrumentSchema = z.object({
  id: z.number().int().positive(),
  ticker: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  last_price: z.number().nonnegative(),
  close_price: z.number().nonnegative(),
})

export const holdingSchema = z.object({
  instrument_id: z.number().int().positive(),
  ticker: z.string().min(1),
  quantity: z.number().int().positive(),
  last_price: z.number().nonnegative(),
  close_price: z.number().nonnegative(),
  avg_cost_price: z.number().nonnegative(),
})

export const portfolioSchema = z.object({
  cash: z.number(),
  holdings: z.array(holdingSchema),
})

export const orderSchema = z.object({
  id: z.number().int().positive(),
  candidate_id: z.string().min(1),
  instrument_id: z.number().int().positive(),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  status: z.enum(["FILLED", "PENDING", "REJECTED"]),
  created_at: z.string().min(1),
})

export const errorSchema = z.object({error: z.string().min(1)})

export type Instrument = z.infer<typeof instrumentSchema>
export type Portfolio = z.infer<typeof portfolioSchema>
export type Order = z.infer<typeof orderSchema>
