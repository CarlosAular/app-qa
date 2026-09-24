/**
 * Strings exactos que renderiza la app. Una sola fuente para toda la suite:
 * si la app cambia una copy, se corrige acá y no en cinco specs.
 *
 * Verificados contra el código, no transcritos de una captura.
 */

/** Validación de cliente (src/features/orders/orderValidation.ts). */
export const VALIDATION = {
  quantityRequired: "Ingresá una cantidad de acciones.",
  quantityMustBeInteger: "Ingresá una cantidad entera de acciones.",
  amountRequired: "Ingresá un monto en pesos mayor a cero.",
  amountBelowOneShare: "El monto no alcanza para comprar una acción.",
  limitPriceRequired: "Ingresá un precio límite mayor a cero.",
  atLeastOneShare: "La orden debe enviar al menos una acción.",
} as const

/** Toasts (src/features/orders/orderToasts.ts). */
export const TOAST = {
  orderFilled: "Orden ejecutada",
  orderPending: "Orden enviada",
  orderRejected: "Orden rechazada",
  orderFailed: "No pudimos enviar la orden",
} as const

/** Mensajes de error de negocio mapeados (src/features/orders/orderErrorMessages.ts). */
export const API_ERROR = {
  insufficientCash: "No tenés efectivo suficiente.",
  insufficientShares: "No tenés acciones suficientes.",
  instrumentNotFound: "No encontramos ese instrumento.",
  limitNeedsPrice: "Las órdenes Limit necesitan un precio.",
  quantityMustBePositive: "La cantidad debe ser un entero positivo.",
} as const

/** Etiquetas del ticket (bottom sheet). */
export const TICKET = {
  heading: "Nueva orden",
  sideBuy: "Comprar",
  sideSell: "Vender",
  typeMarket: "Market",
  typeLimit: "Limit",
  modeShares: "Acciones",
  modeArs: "Pesos",
  quantityLabel: "Cantidad de acciones",
  amountLabel: "Monto en pesos",
  limitPriceLabel: "Precio límite",
  submitIdle: "Enviar orden",
  /** Tres puntos ASCII, no U+2026. */
  submitPending: "Enviando...",
  submitDone: "Enviar otra orden",
  estimateQuantityLabel: "Acciones a enviar",
  estimatePrefix: "Estimado",
} as const

/** Navegación y encabezados de pantalla. */
export const NAV = {
  tabMarkets: "Mercados",
  tabPortfolio: "Portafolio",
  tabOrders: "Órdenes",
  tabSearch: "Buscar",
  headingMarkets: "Mercados",
  headingPortfolio: "Portafolio",
  headingOrders: "Órdenes",
  headingSearch: "Buscar activos",
  tradeFromInstrument: "Operar ahora",
  tradeFromPosition: "Operar esta posición",
  backToMarkets: "Volver a mercados",
  backToPortfolio: "Volver al portafolio",
} as const

/** Etiquetas de la tarjeta de resumen del portafolio. */
export const PORTFOLIO = {
  totalValue: "Valor total",
  gain: "Ganancia",
  returnRatio: "Retorno",
  costBasis: "Costo invertido",
  cash: "Efectivo",
  positions: "Posiciones",
  emptyTitle: "No hay posiciones en el portfolio",
} as const

/** Etiquetas de la pestaña Buscar (src/features/search/components/). */
export const SEARCH = {
  inputLabel: "Buscar ticker",
  clearLabel: "Borrar búsqueda",
  /** Debounce real de la app (SEARCH_DEBOUNCE_MS en src/app/(tabs)/search/index.tsx). */
  debounceMs: 350,
} as const

/** Vocabulario del historial de órdenes (src/features/orders/orderFormatters.ts). */
export const ORDER_LABELS = {
  statusFilled: "Ejecutada",
  statusPending: "Pendiente",
  statusRejected: "Rechazada",
  sideBuy: "Compra",
  sideSell: "Venta",
  typeMarket: "Market",
  /** Ojo: acentuado en el historial, sin acento en el toggle del ticket. */
  typeLimit: "Límite",
  emptyTitle: "Todavía no enviaste órdenes",
} as const
