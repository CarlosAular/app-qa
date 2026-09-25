/*
 * ESQUEMAS: la "forma exacta" que debe tener cada respuesta de la API.
 *
 * Un esquema es como un formulario con campos obligatorios y reglas: si el
 * servicio devuelve un campo que falta, con otro tipo (texto en vez de número)
 * o con un valor imposible (una cantidad negativa), el test falla con el
 * mensaje "Contrato roto". Así detectamos cambios en la API sin tener que
 * escribir una comprobación a mano por cada campo.
 *
 * Los esquemas describen DATOS (un instrumento, una orden), no rutas. Por eso
 * un mismo esquema lo comparten varios endpoints:
 *
 *   instrumentSchema  ->  GET /instruments  y  GET /search
 *   portfolioSchema   ->  GET /portfolio
 *   holdingSchema     ->  GET /portfolio, dentro de la lista `holdings`: cada
 *                         elemento es una posición, o sea las unidades de UN
 *                         instrumento que tengo. No hay un endpoint que
 *                         devuelva una posición suelta
 *   orderSchema       ->  GET /orders  y  POST /orders
 *   errorSchema       ->  cualquier rechazo (respuesta 400)
 *
 * Reglas que se repiten en los campos numéricos:
 *   .int()         número entero, sin decimales
 *   .positive()    mayor que cero
 *   .nonnegative() cero o mayor (nunca negativo)
 *   .min(1)        texto que no puede venir vacío
 */
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
