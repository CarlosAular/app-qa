/**
 * La ÚNICA capa de la suite que sabe en qué plataforma corre.
 *
 * La app bajo prueba no expone un solo testID: la suite se apoya en los
 * accessibilityLabel que ya existen y en el texto visible. Eso obliga a un
 * split por plataforma, porque los atributos no se llaman igual:
 *
 *   - Android  -> content-desc (del accessibilityLabel) y text (del <Text>).
 *   - iOS      -> name (identifier ?: label) y label. La estrategia `~` de
 *                 Appium resuelve contra el IDENTIFIER, que acá nunca está
 *                 seteado, así que en iOS SIEMPRE se usa predicate string.
 *
 * De esta capa para arriba (screens, components, flows, specs) el código es
 * único para las dos plataformas.
 */

/**
 * En iOS todas las comparaciones usan los modificadores [cd] de NSPredicate:
 * insensible a mayúsculas y A DIACRÍTICOS.
 *
 * El motivo del [d] no es cosmético: macOS normaliza los acentos de forma
 * distinta según de dónde venga el string (NFC vs NFD), así que un `==` contra
 * "Órdenes" puede fallar aunque la etiqueta se vea idéntica. Con [d] la
 * comparación deja de depender de cómo quedó compuesta la tilde.
 */
const quote = (value: string) => value.replace(/"/g, '\\"')

/**
 * TODO predicate de iOS exige `visible == 1`.
 *
 * XCUITest expone cada elemento DOS VECES: el que se ve y un gemelo con
 * `visible="false"`. `$()` devuelve el primer match, que muchas veces es el
 * invisible, y entonces `waitForDisplayed` expira sobre un elemento que está
 * perfectamente en pantalla. Fue la causa de la mayoría de los fallos raros en
 * iOS: filas de Mercados que el árbol mostraba y el selector no encontraba.
 */
const ASCII_RUNS = /[\u0020-\u007F]+/g

/**
 * El fragmento mas largo del texto sin caracteres no-ASCII.
 *
 * "Historial completo de ordenes" -> "Historial completo de "
 * "Operar esta posicion"          -> "Operar esta posici"
 *
 * Es la contramedida al hallazgo mas molesto de toda la suite: en iOS, un texto
 * con tilde NO matchea en un predicate, con ningun modificador. Ni `==`, ni
 * `==[cd]`, ni `CONTAINS[cd]`. El elemento esta en el arbol, visible, con ese
 * label exacto, y el predicado devuelve vacio. Matchear por el tramo ASCII mas
 * largo es determinista y no depende de como quedo codificada la tilde.
 *
 * Solo se usa en iOS: en Android el XPath sobre @text y @content-desc compara
 * los acentos sin problema.
 */
const asciiFragment = (text: string): string => {
  const runs = text.match(ASCII_RUNS) ?? []
  const longest = runs.reduce(
    (best, run) => (run.trim().length > best.trim().length ? run : best),
    ""
  )

  return longest.trim().length >= 6 ? longest.trim() : text
}

/** Elemento por accessibilityLabel. */
export const byLabel = (label: string): string =>
  driver.isAndroid
    ? `~${label}`
    : `-ios predicate string:visible == 1 AND (name ==[cd] "${quote(label)}" OR label ==[cd] "${quote(label)}")`

/** Elemento por texto visible exacto (o por label, cuando RN lo colapsa). */
export const byText = (text: string): string => {
  if (driver.isAndroid) {
    return `//*[@text="${quote(text)}" or @content-desc="${quote(text)}"]`
  }

  const fragment = asciiFragment(text)

  // Con acentos no queda otra que comparar por contenido del tramo ASCII.
  if (fragment !== text) {
    return `-ios predicate string:visible == 1 AND (name CONTAINS "${quote(fragment)}" OR label CONTAINS "${quote(fragment)}" OR value CONTAINS "${quote(fragment)}")`
  }

  return `-ios predicate string:visible == 1 AND (name ==[cd] "${quote(text)}" OR label ==[cd] "${quote(text)}" OR value ==[cd] "${quote(text)}")`
}

/**
 * Sólo iOS: el elemento aunque XCUITest lo marque `visible="false"`.
 *
 * La barra de pestañas minimizada conserva su frame de 402x83, así que WDA da
 * por tapado todo lo que queda debajo aunque los círculos sólo ocupen los
 * extremos. Con `visible == 1` el botón "Operar esta posición" no aparece
 * nunca, pese a estar entero y tocable en pantalla.
 */
export const byTextIgnoringVisibility = (text: string): string => {
  const fragment = asciiFragment(text)

  return `-ios predicate string:name CONTAINS "${quote(fragment)}" OR label CONTAINS "${quote(fragment)}"`
}

/** Elemento cuyo texto o label CONTIENE el fragmento. */
export const byTextContains = (text: string): string =>
  driver.isAndroid
    ? `//*[contains(@text,"${quote(text)}") or contains(@content-desc,"${quote(text)}")]`
    : `-ios predicate string:visible == 1 AND (name CONTAINS "${quote(asciiFragment(text))}" OR label CONTAINS "${quote(asciiFragment(text))}" OR value CONTAINS "${quote(asciiFragment(text))}")`

/** Elemento cuyo accessibilityLabel CONTIENE el fragmento (filas de lista). */
export const byLabelContains = (label: string): string =>
  driver.isAndroid
    ? `//*[contains(@content-desc,"${quote(label)}")]`
    : `-ios predicate string:visible == 1 AND (name CONTAINS "${quote(asciiFragment(label))}" OR label CONTAINS "${quote(asciiFragment(label))}")`

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ"
const LOWER = "abcdefghijklmnopqrstuvwxyzáéíóúüñ"

/** XPath 1.0 no tiene lower-case(): se emula con translate(). */
const xpathLower = (attribute: string) =>
  `translate(${attribute},'${UPPER}','${LOWER}')`

/** Texto exacto, ignorando mayúsculas (para etiquetas con `uppercase`). */
export const byTextInsensitive = (text: string): string =>
  driver.isAndroid
    ? `//*[${xpathLower("@text")}="${quote(text.toLowerCase())}" or ${xpathLower("@content-desc")}="${quote(text.toLowerCase())}"]`
    : `-ios predicate string:visible == 1 AND (name ==[cd] "${quote(text)}" OR label ==[cd] "${quote(text)}")`

/** Campo de texto por su accessibilityLabel. */
export const inputByLabel = (label: string): string =>
  driver.isAndroid
    ? `//android.widget.EditText[@content-desc="${quote(label)}"]`
    : `-ios predicate string:visible == 1 AND (type == "XCUIElementTypeTextField" AND (name ==[cd] "${quote(label)}" OR label ==[cd] "${quote(label)}"))`

/** Los segmentos de los toggles no tienen label: se matchean por el texto hijo. */
export const segmentByText = (text: string): string =>
  driver.isAndroid
    ? `//*[(@text="${quote(text)}" or @content-desc="${quote(text)}")]`
    : `-ios predicate string:visible == 1 AND ((type == "XCUIElementTypeButton" OR type == "XCUIElementTypeOther" OR type == "XCUIElementTypeStaticText") AND (name ==[cd] "${quote(text)}" OR label ==[cd] "${quote(text)}"))`

/**
 * La barra de pestañas, y SOLO la barra.
 *
 * Cada pantalla repite el nombre de su pestaña como encabezado ("Órdenes" es a
 * la vez el título de la pantalla y la pestaña), y el encabezado gana en orden
 * de documento. Matchear por texto tocaba el título y no navegaba a ningún
 * lado. En Android la pestaña es lo único que lleva content-desc; en iOS es lo
 * único que es un Button.
 */
/**
 * Orden de las pestañas, tal como las declara src/app/(tabs)/_layout.tsx.
 *
 * En iOS la pestaña se elige por POSICIÓN, no por texto. Suena a atajo y es lo
 * contrario: el texto resultó ser lo frágil. "Órdenes" está en el árbol con ese
 * name exacto y visible, pero NINGUNA variante de predicate lo matchea —ni
 * `==`, ni `==[cd]`, ni `CONTAINS[cd]` sobre el fragmento sin acento—: la tilde
 * no sobrevive el viaje hasta XCUITest. Y aflojar el match a CONTAINS tiene su
 * propio costo: "Mercados" también matchea el botón "Volver a mercados" de la
 * ficha del instrumento, y entonces la suite cree que hay barra donde no la hay.
 *
 * El orden de las pestañas es parte del layout de la app: si cambia, cambia la
 * navegación y este mapa se actualiza con él.
 */
const IOS_TAB_INDEX: Record<string, number> = {
  Mercados: 1,
  Portafolio: 2,
  Órdenes: 3,
  Buscar: 4,
}

export const tabSelector = (name: string): string => {
  if (driver.isAndroid) {
    return `//*[@content-desc="${quote(name)}"]`
  }

  const index = IOS_TAB_INDEX[name]

  if (!index) {
    throw new Error(`Pestaña desconocida: "${name}". Agregala a IOS_TAB_INDEX.`)
  }

  return `-ios class chain:**/XCUIElementTypeTabBar/**/XCUIElementTypeButton[\`visible == 1\`][${index}]`
}
