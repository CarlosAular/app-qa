/**
 * Aritmética y parseo en formato es-AR.
 *
 * La app formatea con Intl.NumberFormat("es-AR", {style:"currency", currency:"ARS"}),
 * que produce "$ 45,72": signo peso, ESPACIO DURO (U+00A0), punto de miles y
 * coma decimal. El parser tolera cualquier variante de espacio porque Hermes no
 * siempre devuelve el mismo carácter en iOS y en Android.
 */

const ALL_SPACES = /[\s   ]/g

/** "$ 1.234,50" -> 1234.5 · "+$ 12,00" -> 12 · "-$ 12,00" -> -12 */
export const parseArs = (text: string): number => {
  const raw = text.trim()
  const negative = raw.startsWith("-")

  const digits = raw
    .replace(ALL_SPACES, "")
    .replace(/[$+\-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")

  const parsed = Number(digits)

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `No pude parsear un importe es-AR de ${JSON.stringify(text)}`
    )
  }

  return negative ? -parsed : parsed
}

/** "1.234" -> 1234 */
export const parseQuantity = (text: string): number => {
  const digits = text
    .replace(ALL_SPACES, "")
    .replace(/\./g, "")
    .replace(/[^0-9-]/g, "")
  const parsed = Number(digits)

  if (!Number.isInteger(parsed)) {
    throw new Error(`No pude parsear una cantidad de ${JSON.stringify(text)}`)
  }

  return parsed
}

/** Extrae el primer importe con signo peso que aparezca en un texto largo. */
export const extractArs = (text: string): number => {
  const match = text.match(/-?\$[\s  ]?[\d.]+,\d{2}/)

  if (!match) {
    throw new Error(`No encontré un importe en ${JSON.stringify(text)}`)
  }

  return parseArs(match[0])
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 2,
  style: "currency",
})

const quantityFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
})

export const formatArs = (amount: number) => arsFormatter.format(amount)
export const formatQuantity = (quantity: number) =>
  quantityFormatter.format(quantity)

/** Lo que se tipea en un input de la app: coma como separador decimal. */
export const toEsArInput = (value: number, decimals = 2): string =>
  value.toFixed(decimals).replace(".", ",")

/**
 * Espeja getOrdersComputedQuantity de src/features/orders/orderValidation.ts.
 * Es un floor puro: la conversión de pesos a acciones NUNCA redondea hacia arriba.
 */
export const sharesForAmount = (amount: number, price: number): number =>
  price <= 0 ? 0 : Math.floor(amount / price)

/** Espeja getOrdersEstimatedTotal. */
export const estimatedTotal = (quantity: number, price: number): number =>
  quantity * price

/** Redondeo a centavos, para comparar deltas sin ruido de punto flotante. */
export const toCents = (amount: number): number => Math.round(amount * 100)

export const expectSameMoney = (
  actual: number,
  expected: number,
  what: string
) => {
  if (toCents(actual) !== toCents(expected)) {
    throw new Error(
      `${what}: esperaba ${formatArs(expected)} y obtuve ${formatArs(actual)} ` +
        `(diferencia ${formatArs(actual - expected)})`
    )
  }
}
