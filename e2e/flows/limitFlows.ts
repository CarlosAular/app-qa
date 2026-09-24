import {openTicketFromMarkets} from "./tradingFlows"

import {getOrders, type ApiOrder} from "../api/cocosApi"
import {orderTicket, type TicketSide} from "../components/OrderTicket"
import {toEsArInput} from "../support/money"

type LimitOrderArgs = {
  ticker: string
  side: TicketSide
  quantity: number
  limitPrice: number
}

/**
 * Carga y envía una orden LÍMITE por el ticket, abierto desde Mercados.
 *
 * Devuelve el último precio y el estimado que mostró el pie del panel, para que
 * el spec compruebe que el estimado usa el precio límite y no el de mercado.
 */
export const submitLimitOrderFromMarkets = async ({
  ticker,
  side,
  quantity,
  limitPrice,
}: LimitOrderArgs) => {
  const lastPrice = await openTicketFromMarkets(ticker)

  await orderTicket.setSide(side)
  await orderTicket.setType("Limit")
  await orderTicket.setQuantityMode("Acciones")
  await orderTicket.enterQuantity(quantity)
  await orderTicket.enterLimitPrice(toEsArInput(limitPrice))

  const estimate = await orderTicket.readEstimate()

  await orderTicket.submit()
  await orderTicket.waitForSubmitted()
  await orderTicket.close()

  return {lastPrice, estimate}
}

/**
 * Lleva una orden límite a un estado final leyendo la cuenta por API.
 *
 * La API resuelve las órdenes límite al LEER la cuenta, con un factor
 * aleatorio: una orden no ejecutable tarda entre 1 y 5 lecturas en rechazarse,
 * y a veces más de 6 (medido: 2 de 10). Refrescar la pantalla hace lo mismo pero
 * cuesta ~5 segundos por lectura; por API son ~300ms, así que el tope de 40
 * lecturas deja una probabilidad despreciable de no resolverse.
 *
 * Devuelve TODOS los estados observados, en orden, para que el spec afirme el
 * invariante ("nunca FILLED") sobre la secuencia completa y no sobre un estado
 * puntual.
 */
export const pollUntilResolved = async (
  orderId: number,
  maxReads = 40
): Promise<ApiOrder["status"][]> => {
  const seen: ApiOrder["status"][] = []

  for (let read = 0; read < maxReads; read += 1) {
    const order = (await getOrders()).find(
      candidate => candidate.id === orderId
    )

    if (!order) {
      throw new Error(`La orden #${orderId} no figura en el servicio.`)
    }

    seen.push(order.status)

    if (order.status !== "PENDING") {
      return seen
    }
  }

  throw new Error(
    `La orden #${orderId} siguió PENDING tras ${maxReads} lecturas: ${seen.join(" > ")}`
  )
}
