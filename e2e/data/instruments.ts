/**
 * Precios fijos de la API dummy, verificados contra GET /instruments.
 *
 * La API no mueve los precios, así que toda compra deja el PPP igual al último
 * precio y el resultado de la posición siempre en $ 0,00. Los specs igual leen
 * el precio de la UI en runtime y lo comparan contra este fixture: si la API
 * cambia un precio, el test falla con un mensaje claro en vez de romper una
 * aritmética silenciosa.
 */
export type InstrumentFixture = {
  id: number
  ticker: string
  name: string
  type: "ACCIONES" | "MONEDA"
  lastPrice: number
  closePrice: number
}

export const INSTRUMENTS = {
  DYCA: {
    id: 1,
    ticker: "DYCA",
    name: "Dycasa S.A.",
    type: "ACCIONES",
    lastPrice: 45.72,
    closePrice: 50.07,
  },
  CAPX: {
    id: 2,
    ticker: "CAPX",
    name: "Capex S.A.",
    type: "ACCIONES",
    lastPrice: 53.68,
    closePrice: 49.71,
  },
  TECO2: {
    id: 7,
    ticker: "TECO2",
    name: "Telecom",
    type: "ACCIONES",
    lastPrice: 76.04,
    closePrice: 69.87,
  },
  MIRG: {
    id: 5,
    ticker: "MIRG",
    name: "Mirgor",
    type: "ACCIONES",
    lastPrice: 40.88,
    closePrice: 37.74,
  },
  PATA: {
    id: 6,
    ticker: "PATA",
    name: "Importadora y Exportadora de la Patagonia",
    type: "ACCIONES",
    lastPrice: 47.41,
    closePrice: 44.21,
  },
  FERR: {
    id: 8,
    ticker: "FERR",
    name: "Ferrum S.A.",
    type: "ACCIONES",
    lastPrice: 66.29,
    closePrice: 59.82,
  },
  SAMI: {
    id: 9,
    ticker: "SAMI",
    name: "S.A San Miguel",
    type: "ACCIONES",
    lastPrice: 74.68,
    closePrice: 67.31,
  },
  ARS: {
    id: 26,
    ticker: "ARS",
    name: "Pesos",
    type: "MONEDA",
    lastPrice: 1,
    closePrice: 1,
  },
} as const satisfies Record<string, InstrumentFixture>

export const INITIAL_CASH = 1_000_000

/**
 * Un instrumento por caso, a propósito.
 *
 * Todos los specs de una corrida comparten tenant (el candidate id queda
 * horneado en el binario y no puede variar por test). Si dos casos operaran el
 * mismo ticker, el delta de uno mediría el movimiento del otro y el que
 * necesita vender la posición ENTERA nunca podría hacerlo.
 */
export const CASE_INSTRUMENT = {
  /** COCOS-7 · compra a mercado end-to-end */
  marketBuy: INSTRUMENTS.DYCA,
  /** COCOS-5 · conversión de pesos a acciones enteras */
  amountToShares: INSTRUMENTS.CAPX,
  /** COCOS-49 · importe con coma decimal */
  decimalAmount: INSTRUMENTS.MIRG,
  /** COCOS-6 y COCOS-47 · validaciones (no crean ninguna orden) */
  validation: INSTRUMENTS.TECO2,
  /** COCOS-25 · venta a mercado */
  sell: INSTRUMENTS.PATA,
  /** COCOS-28 · venta parcial y PPP */
  partialSell: INSTRUMENTS.FERR,
  /** COCOS-10 · historial */
  history: INSTRUMENTS.SAMI,
} as const
