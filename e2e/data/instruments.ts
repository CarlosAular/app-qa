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
  PGR: {
    id: 3,
    ticker: "PGR",
    name: "Phoenix Global Resources",
    type: "ACCIONES",
    lastPrice: 31.95,
    closePrice: 28.57,
  },
  MOLA: {
    id: 4,
    ticker: "MOLA",
    name: "Molinos Agro S.A.",
    type: "ACCIONES",
    lastPrice: 92.15,
    closePrice: 84.13,
  },
  IRCP: {
    id: 10,
    ticker: "IRCP",
    name: "IRSA Propiedades Comerciales S.A.",
    type: "ACCIONES",
    lastPrice: 61.45,
    closePrice: 55.77,
  },
  GAMI: {
    id: 11,
    ticker: "GAMI",
    name: "Boldt Gaming S.A.",
    type: "ACCIONES",
    lastPrice: 97.56,
    closePrice: 88.31,
  },
  INTR: {
    id: 13,
    ticker: "INTR",
    name: "Compañía Introductora de Buenos Aires S.A.",
    type: "ACCIONES",
    lastPrice: 84.27,
    closePrice: 76.57,
  },
  MTR: {
    id: 14,
    ticker: "MTR",
    name: "Matba Rofex S.A.",
    type: "ACCIONES",
    lastPrice: 65.23,
    closePrice: 59.3,
  },
  FIPL: {
    id: 15,
    ticker: "FIPL",
    name: "Fiplasto",
    type: "ACCIONES",
    lastPrice: 85.96,
    closePrice: 78.15,
  },
  GARO: {
    id: 16,
    ticker: "GARO",
    name: "Garovaglio Y Zorraquín",
    type: "ACCIONES",
    lastPrice: 27.12,
    closePrice: 24.44,
  },
  SEMI: {
    id: 17,
    ticker: "SEMI",
    name: "Molinos Juan Semino",
    type: "ACCIONES",
    lastPrice: 59.99,
    closePrice: 54.54,
  },
  BPAT: {
    id: 19,
    ticker: "BPAT",
    name: "Banco Patagonia",
    type: "ACCIONES",
    lastPrice: 56.64,
    closePrice: 51.49,
  },
  BBAR: {
    id: 22,
    ticker: "BBAR",
    name: "Banco Frances",
    type: "ACCIONES",
    lastPrice: 79.36,
    closePrice: 71.67,
  },
  LEDE: {
    id: 23,
    ticker: "LEDE",
    name: "Ledesma",
    type: "ACCIONES",
    lastPrice: 41.61,
    closePrice: 37.79,
  },
  DOME: {
    id: 12,
    ticker: "DOME",
    name: "Domec",
    type: "ACCIONES",
    lastPrice: 38.89,
    closePrice: 35.36,
  },
  HARG: {
    id: 18,
    ticker: "HARG",
    name: "Holcim (Argentina) S.A.",
    type: "ACCIONES",
    lastPrice: 78.25,
    closePrice: 71.13,
  },
  RIGO: {
    id: 20,
    ticker: "RIGO",
    name: "Rigolleau S.A.",
    type: "ACCIONES",
    lastPrice: 93.47,
    closePrice: 85.58,
  },
  CVH: {
    id: 21,
    ticker: "CVH",
    name: "Cablevision Holding",
    type: "ACCIONES",
    lastPrice: 36.22,
    closePrice: 32.84,
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
  /** COCOS-4 · el panel de orden abre listo para comprar a mercado */
  ticketDefaults: INSTRUMENTS.PGR,
  /** COCOS-22 · mismo instrumento desde los tres accesos (posición sembrada) */
  threeEntryPoints: INSTRUMENTS.MOLA,
  /** COCOS-21 · estimado con precio límite */
  limitEstimate: INSTRUMENTS.IRCP,
  /** COCOS-9 · no comprar por más dinero del disponible */
  insufficientCash: INSTRUMENTS.GAMI,
  /** COCOS-44 · precio confirmado = precio de ejecución */
  confirmedPrice: INSTRUMENTS.INTR,
  /** COCOS-36 · doble toque en "Enviar orden" */
  doubleSubmit: INSTRUMENTS.MTR,
  /** COCOS-37 · el panel no arrastra la orden anterior (primer instrumento) */
  noCarryOverFirst: INSTRUMENTS.FIPL,
  /** COCOS-37 · segundo instrumento, abierto justo después del primero */
  noCarryOverSecond: INSTRUMENTS.GARO,
  /** COCOS-40 · reabrir el panel no reenvía la última orden */
  noResubmitOnReopen: INSTRUMENTS.SEMI,
  /** COCOS-11, COCOS-12, COCOS-30 · posición compartida de solo lectura */
  portfolioReadOnly: INSTRUMENTS.BPAT,
  /** COCOS-13 · reset deja el saldo inicial */
  resetBaseline: INSTRUMENTS.BBAR,
  /** COCOS-50 · reset borra órdenes límite pendientes */
  resetClearsLimit: INSTRUMENTS.LEDE,
  /** COCOS-48 · doce órdenes a mercado seguidas */
  historyOrder: INSTRUMENTS.DOME,
  /** COCOS-8 · compra límite por debajo del mercado nunca se ejecuta */
  limitBelowMarket: INSTRUMENTS.HARG,
  /** COCOS-29 · compra límite pendiente reserva efectivo, no crea posición */
  limitReservesCash: INSTRUMENTS.RIGO,
  /** COCOS-46 · venta límite pendiente reserva acciones, no efectivo */
  limitReservesShares: INSTRUMENTS.CVH,
} as const
