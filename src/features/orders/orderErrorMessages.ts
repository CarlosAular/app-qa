const ORDERS_API_ERROR_MESSAGES: Record<string, string> = {
  "Instrument not found": "No encontramos ese instrumento.",
  "LIMIT orders require a numeric price":
    "Las órdenes Limit necesitan un precio.",
  "quantity must be a positive integer":
    "La cantidad debe ser un entero positivo.",
  "Insufficient cash": "No tenés efectivo suficiente.",
  "Insufficient shares": "No tenés acciones suficientes.",
}

export const getOrdersApiErrorMessage = (message: string): string => {
  const trimmed = message.trim()

  return ORDERS_API_ERROR_MESSAGES[trimmed] ?? trimmed
}
