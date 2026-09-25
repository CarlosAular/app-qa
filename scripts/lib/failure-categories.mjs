/**
 * Categorías de fallo de la suite de UI, por lo que dice el mensaje.
 *
 * En esta suite el estado no separa tipos de fallo: `broken` es cualquier Error
 * que lanzan los helpers (desvíos de importes, órdenes de más...) y `failed` son
 * los expect() sin mensaje. Allure 2 clasifica por defecto según el estado
 * ("Product defects" y "Test defects") y por eso engaña; estas reglas lo
 * reemplazan. La misma lista usa la página de insights (insights-model.mjs).
 *
 * La primera regla que coincide gana; lo que no encaje en ninguna va a
 * OTHER_CATEGORY.
 */
export const FAILURE_CATEGORIES = [
  {
    name: "Importes o precios que no coinciden",
    pattern: /esperaba .* y obtuve/,
  },
  {
    name: "Se crearon órdenes de más",
    pattern: /Se crearon \d+ orden/,
  },
  {
    name: "La pantalla no llegó al estado esperado",
    pattern:
      /nunca terminó|nunca pasó a|No cargó|No encontré una fila|No pude volver/,
  },
  {
    name: "Falló la preparación de datos (siembra)",
    pattern: /La siembra de/,
  },
  {
    name: "Aserción sin mensaje (mejorar el test)",
    pattern: /expect\(received\)/,
  },
]

export const OTHER_CATEGORY = "Otros fallos"

/** Categoría de un mensaje de fallo. */
export const categoryOfMessage = message =>
  FAILURE_CATEGORIES.find(({pattern}) => pattern.test(message ?? ""))?.name ??
  OTHER_CATEGORY

/**
 * Las mismas reglas en el formato de categories.json de Allure 2. El regex de
 * Allure es de Java y tiene que cubrir todo el mensaje, de ahí el `(?s).*`.
 * Allure asigna cada fallo a la primera categoría que coincide, así que la
 * última, sin regex, recoge todo lo demás, incluidos los fallos sin mensaje
 * (un regex nunca coincide con un mensaje ausente).
 */
export const allure2Categories = () => {
  const statuses = ["failed", "broken"]

  return [
    ...FAILURE_CATEGORIES.map(({name, pattern}) => ({
      name,
      matchedStatuses: statuses,
      messageRegex: `(?s).*(${pattern.source}).*`,
    })),
    {name: OTHER_CATEGORY, matchedStatuses: statuses},
  ]
}
