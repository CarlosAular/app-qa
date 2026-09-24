import {byLabelContains, byText, byTextContains, tabSelector} from "./selectors"
import {isVisible, SHORT_TIMEOUT} from "./waits"

type Box = {width: number; height: number}

let cachedWindow: Box | null = null

const windowSize = async (): Promise<Box> => {
  cachedWindow ??= await driver.getWindowSize()
  return cachedWindow
}

const swipe = async (
  from: {x: number; y: number},
  to: {x: number; y: number},
  duration = 600
) => {
  await driver
    .action("pointer", {parameters: {pointerType: "touch"}})
    .move({duration: 0, x: Math.round(from.x), y: Math.round(from.y)})
    .down()
    .pause(120)
    .move({duration, x: Math.round(to.x), y: Math.round(to.y)})
    .up()
    .perform()

  await browser.pause(350)
}

/**
 * Se usa swipe crudo, no `mobile: scroll`.
 *
 * Medido en esta máquina: cada `mobile: scroll` tarda ~9 segundos, así que
 * cuatro de ellos por cada vuelta al tope convierten una corrida de 1 minuto en
 * una de 4 y hacen expirar los tests. El swipe crudo es instantáneo y alcanza
 * para las listas. El scroll nativo se reserva para BUSCAR un elemento puntual
 * (ver iosScrollToVisible), que es donde el swipe a ciegas falla.
 */

/**
 * Margen izquierdo, fuera de las tarjetas. En la ficha de una posición el
 * gráfico de Skia del medio se come el gesto, y un swipe vertical que arranca
 * acá lo esquiva: es contenido del ScrollView, no de la tarjeta.
 */
const EDGE_X = 8

/** Un scroll hacia abajo (el contenido sube). */
export const swipeUp = async (fraction = 0.45, fromEdge = false) => {
  const {width, height} = await windowSize()
  const x = fromEdge ? EDGE_X : width / 2

  await swipe({x, y: height * 0.72}, {x, y: height * (0.72 - fraction)})
}

/** Un scroll hacia arriba (el contenido baja). */
export const swipeDown = async (fraction = 0.45) => {
  const {width, height} = await windowSize()
  const x = width / 2

  await swipe({x, y: height * 0.3}, {x, y: height * (0.3 + fraction)})
}

/**
 * Pull to refresh. Los casos manuales dicen "refrescar tirando hacia abajo" y
 * las queries de TanStack no se invalidan solas al volver a la pestaña.
 */
export const pullToRefresh = async () => {
  const {width, height} = await windowSize()
  const x = width / 2

  await swipe({x, y: height * 0.28}, {x, y: height * 0.75}, 900)
  await browser.pause(1_200)
}

/** Fallback si la barra está visible pero no se puede medir. */
const TAB_BAR_TOP_RATIO = 0.87

let cachedTabBarTop: number | null = null

/**
 * Coordenada Y donde arranca la barra de pestañas, o null si en esta pantalla
 * no hay barra.
 *
 * El "o null" es la parte importante: la ficha del instrumento vive en el stack
 * RAÍZ, fuera de las tabs, así que ahí no hay barra que tape nada. Cachear la
 * posición y aplicarla siempre hacía que un botón perfectamente alcanzable se
 * reportara como tapado.
 */
const tabBarTop = async (): Promise<number | null> => {
  const selector = tabSelector("Mercados")

  /*
   * Se pregunta si el elemento EXISTE, no si `waitForDisplayed` lo da por
   * visible. La diferencia no es cosmética: un `isVisible` con timeout corto
   * devuelve false de a ratos mientras la pantalla se está acomodando, y
   * entonces la suite cree que no hay barra, no levanta la fila que la barra
   * tapa, y el tap se pierde sin error. Una consulta sin espera es
   * determinista.
   */
  const matches = await $$(selector).getElements()

  if (matches.length === 0) {
    return null
  }

  if (cachedTabBarTop !== null) {
    return cachedTabBarTop
  }

  try {
    cachedTabBarTop = (await matches[0]!.getLocation()).y
    return cachedTabBarTop
  } catch {
    const {height} = await windowSize()
    return height * TAB_BAR_TOP_RATIO
  }
}

type Positioned = {
  getLocation(): Promise<{x: number; y: number}>
  getSize(): Promise<{width: number; height: number}>
}

/**
 * Defecto conocido: la última fila de toda lista queda TAPADA por la barra de
 * pestañas. El elemento existe y Appium lo reporta visible, pero el tap lo
 * recibe la barra y la navegación nunca ocurre.
 */
const isBehindTabBar = async (element: Positioned) => {
  const limit = await tabBarTop()

  if (limit === null) {
    return false
  }

  const [{y}, {height: elementHeight}] = await Promise.all([
    element.getLocation(),
    element.getSize(),
  ])

  return y + elementHeight / 2 > limit
}

const liftAboveTabBar = async (selector: string) => {
  let element = await $(selector)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await isBehindTabBar(element))) {
      return element
    }

    await nudgeUp()
    element = await $(selector)
  }

  return element
}

/**
 * En iOS se le pide a XCUITest que scrollee HASTA el elemento, en vez de
 * scrollear a ciegas y chequear después de cada swipe.
 *
 * `mobile: scroll` con `predicateString` + `toVisible` conoce el contenido del
 * UIScrollView y llega al elemento en un solo comando. Scrollear a ciegas en la
 * ficha de una posición no alcanza: el gráfico de Skia del medio se come el
 * gesto y la vista no se mueve.
 */
const iosScrollToVisible = async (text: string) => {
  const escaped = text.replace(/"/g, '\\"')

  try {
    await driver.execute("mobile: scroll", {
      predicateString: `label ==[cd] "${escaped}" OR name ==[cd] "${escaped}"`,
      toVisible: true,
    })

    await browser.pause(400)
    return true
  } catch {
    return false
  }
}

const scrollUntilVisible = async (
  selector: string,
  maxSwipes: number,
  label: string,
  exactText?: string,
  fromEdge = false
) => {
  /*
   * `fromEdge` es sólo iOS: la ficha de una posición. Ahí `mobile: scroll` no
   * converge (WDA agota su tope de scrolls tras 70-120 segundos por etiqueta y
   * los reintentos suman minutos) y `liftAboveTabBar` empuja desde el centro, o
   * sea sobre el gráfico. Se scrollea desde el margen y se devuelve el elemento
   * tal cual: cómo esquivar la barra lo resuelve quien llama.
   */
  const edge = fromEdge && driver.isIOS

  if (await isVisible(selector, SHORT_TIMEOUT)) {
    return edge ? $(selector) : liftAboveTabBar(selector)
  }

  if (
    !edge &&
    driver.isIOS &&
    exactText &&
    (await iosScrollToVisible(exactText))
  ) {
    if (await isVisible(selector, 1_500)) {
      return liftAboveTabBar(selector)
    }
  }

  for (let attempt = 0; attempt < maxSwipes; attempt += 1) {
    await swipeUp(0.45, edge)

    if (await isVisible(selector, 800)) {
      return edge ? $(selector) : liftAboveTabBar(selector)
    }
  }

  throw new Error(
    `No encontré ${label} después de ${maxSwipes} scrolls. ` +
      `Las listas son FlashList virtualizadas: si la fila no se renderizó, no existe en el árbol.`
  )
}

/**
 * Las listas son @shopify/flash-list v2, o sea virtualizadas: las filas fuera de
 * pantalla NO existen en la jerarquía. Buscar sin scrollear da falsos negativos.
 */
export const scrollToText = async (
  text: string,
  maxSwipes = 8,
  fromEdge = false
) =>
  scrollUntilVisible(
    byText(text),
    maxSwipes,
    `el texto "${text}"`,
    text,
    fromEdge
  )

export const scrollToTextContains = async (text: string, maxSwipes = 8) =>
  scrollUntilVisible(
    byTextContains(text),
    maxSwipes,
    `un texto que contenga "${text}"`
  )

export const scrollToLabelContains = async (label: string, maxSwipes = 8) =>
  scrollUntilVisible(
    byLabelContains(label),
    maxSwipes,
    `una fila con label "${label}"`
  )

/**
 * Defecto conocido: la última fila de toda lista queda tapada por la barra de
 * pestañas, y en Android el botón "Operar esta posición" es directamente
 * inalcanzable sin este empujón extra.
 */
export const nudgeUp = async () => {
  await swipeUp(0.18)
}

/**
 * Cierra el teclado sin enviar la orden.
 *
 * Dos trampas acá:
 *   - Los inputs del ticket tienen `returnKeyType="send"` con `onSubmitEditing`
 *     conectado al submit: tocar la tecla de retorno ENVÍA LA ORDEN. Por eso no
 *     se usa Enter ni el botón "Send" de la barra del teclado.
 *   - En iOS el teclado tapa "Enviar orden", y `hideKeyboard()` no siempre
 *     tiene con qué cerrarlo en un teclado numérico. La salida es tocar un
 *     texto neutro DENTRO del sheet: el título alcanza para que el campo pierda
 *     el foco. No se toca el backdrop, que cerraría el ticket.
 */
export const dismissKeyboard = async () => {
  const isShown = async () => {
    try {
      return await driver.isKeyboardShown()
    } catch {
      return false
    }
  }

  if (!(await isShown())) {
    return
  }

  if (driver.isAndroid) {
    try {
      await driver.hideKeyboard()
      await browser.pause(400)
    } catch {
      // UiAutomator2 tira si el teclado ya se cerró solo; no es fatal.
    }

    return
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const heading = await $(byText("Nueva orden"))

    if (await heading.isDisplayed().catch(() => false)) {
      await heading.click()
    } else {
      const {width, height} = await windowSize()

      await driver
        .action("pointer", {parameters: {pointerType: "touch"}})
        .move({
          duration: 0,
          x: Math.round(width / 2),
          y: Math.round(height * 0.32),
        })
        .down()
        .pause(60)
        .up()
        .perform()
    }

    await browser.pause(600)

    if (!(await isShown())) {
      return
    }
  }
}

/** Vuelve al tope de la lista. El encabezado vive en un ListHeaderComponent que
 * se desmonta al scrollear, así que hay que subir antes de leerlo. */
export const scrollToTop = async (swipes = 4) => {
  /*
   * En iOS alcanza con tocar la barra de estado: los ScrollView de RN vienen
   * con `scrollsToTop`, así que un solo tap hace lo que harían cuatro swipes.
   */
  if (driver.isIOS) {
    try {
      const {width} = await windowSize()

      await driver
        .action("pointer", {parameters: {pointerType: "touch"}})
        .move({duration: 0, x: Math.round(width / 2), y: 8})
        .down()
        .pause(60)
        .up()
        .perform()

      await browser.pause(500)
      return
    } catch {
      // Si el tap en la barra de estado no prende, seguir con los swipes.
    }
  }

  for (let index = 0; index < swipes; index += 1) {
    await swipeDown(0.5)
  }
}

/** Un toque en coordenadas de pantalla. */
export const tapAt = async (x: number, y: number) => {
  await driver
    .action("pointer", {parameters: {pointerType: "touch"}})
    .move({duration: 0, x: Math.round(x), y: Math.round(y)})
    .down()
    .pause(80)
    .up()
    .perform()

  await browser.pause(700)
}

/**
 * Toca un elemento respetando la barra de pestañas.
 *
 * Defecto conocido y VERIFICADO: al final de la ficha de una posición el botón
 * "Operar esta posición" queda parcialmente tapado por la barra, y como el
 * scroll ya llegó al fondo NINGÚN swipe lo libera. Su centro geométrico cae
 * dentro de la barra, así que un tap al centro lo recibe la barra y la
 * navegación nunca ocurre.
 *
 * La salida honesta es tocar la FRANJA del control que sí está por encima de
 * la barra. Si no queda ninguna franja alcanzable, se falla nombrando el
 * defecto en vez de reportar un timeout genérico.
 */
export const tapElement = async (element: Positioned, what: string) => {
  const [{x, y}, {width, height: elementHeight}, limit] = await Promise.all([
    element.getLocation(),
    element.getSize(),
    tabBarTop(),
  ])

  const centerX = x + width / 2
  let targetY = y + elementHeight / 2

  if (limit !== null && targetY > limit) {
    const reachable = Math.min(y + elementHeight - 4, limit - 4)

    if (reachable <= y + 4) {
      throw new Error(
        `"${what}" está completamente tapado por la barra de pestañas ` +
          `(control en y=${y}..${y + elementHeight}, barra desde y=${Math.round(limit)}). ` +
          "Es el defecto conocido de alcance, no un problema del test."
      )
    }

    targetY = reachable
  }

  await tapAt(centerX, targetY)
}
