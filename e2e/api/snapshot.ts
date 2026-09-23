import {
  createOrder,
  getOrders,
  getPortfolio,
  type ApiHolding,
  type ApiOrder,
} from "./cocosApi"

import {expectSameMoney, formatArs} from "../support/money"

export type AccountSnapshot = {
  cash: number
  holdings: ApiHolding[]
  orders: ApiOrder[]
  orderCount: number
  takenAt: string
}

/**
 * Foto de la cuenta por API, para medir movimientos.
 *
 * Sin POST /reset la cuenta arrastra estado entre specs, así que ningún spec
 * puede asertar absolutos contra el millón inicial: toma esta foto antes de
 * actuar y verifica el DELTA.
 */
export const captureAccount = async (): Promise<AccountSnapshot> => {
  const [portfolio, orders] = await Promise.all([getPortfolio(), getOrders()])

  return {
    cash: portfolio.cash,
    holdings: portfolio.holdings,
    orders,
    orderCount: orders.length,
    takenAt: new Date().toISOString(),
  }
}

export const holdingOf = (
  snapshot: AccountSnapshot,
  ticker: string
): ApiHolding | undefined =>
  snapshot.holdings.find(holding => holding.ticker === ticker)

export const quantityOf = (snapshot: AccountSnapshot, ticker: string): number =>
  holdingOf(snapshot, ticker)?.quantity ?? 0

/** Órdenes creadas entre dos fotos, de la más nueva a la más vieja. */
export const ordersCreatedSince = (
  before: AccountSnapshot,
  after: AccountSnapshot
): ApiOrder[] => {
  const known = new Set(before.orders.map(order => order.id))
  return after.orders.filter(order => !known.has(order.id))
}

export const expectCashDelta = (
  before: AccountSnapshot,
  after: AccountSnapshot,
  expectedDelta: number,
  what = "El efectivo"
) => {
  expectSameMoney(
    after.cash - before.cash,
    expectedDelta,
    `${what} se movió distinto de lo esperado (antes ${formatArs(before.cash)}, después ${formatArs(after.cash)})`
  )
}

export const expectNoNewOrders = (
  before: AccountSnapshot,
  after: AccountSnapshot
) => {
  const created = ordersCreatedSince(before, after)

  if (created.length > 0) {
    throw new Error(
      `Se crearon ${created.length} orden(es) que no debían existir: ` +
        created
          .map(order => `#${order.id} ${order.side} ${order.quantity}`)
          .join(", ")
    )
  }
}

/**
 * Siembra una posición por API para que el spec no dependa de que otro spec
 * haya corrido antes. Compra sólo la diferencia que falte.
 */
export const seedPosition = async (
  instrumentId: number,
  ticker: string,
  minimumQuantity: number
): Promise<number> => {
  const snapshot = await captureAccount()
  const current = quantityOf(snapshot, ticker)

  if (current >= minimumQuantity) {
    return current
  }

  const missing = minimumQuantity - current

  const order = await createOrder({
    instrument_id: instrumentId,
    quantity: missing,
    side: "BUY",
    type: "MARKET",
  })

  if (order.status !== "FILLED") {
    throw new Error(
      `La siembra de ${missing} ${ticker} no se ejecutó (estado ${order.status}, orden #${order.id})`
    )
  }

  return minimumQuantity
}
