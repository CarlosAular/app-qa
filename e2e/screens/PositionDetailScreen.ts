import {tabBar} from "../components/TabBar"
import {NAV} from "../data/messages"
import {
  scrollToText,
  scrollToTop,
  swipeUp,
  tapAt,
  tapElement,
} from "../support/gestures"
import {extractArs, parseQuantity} from "../support/money"
import {readTextNodes, readValueUnderLabel} from "../support/pageMap"
import {byText, byTextIgnoringVisibility} from "../support/selectors"
import {isVisible, waitForVisible} from "../support/waits"

class PositionDetailScreen {
  async waitUntilLoaded() {
    await scrollToTop()
    await waitForVisible(byText("Detalle"), {
      message: "No cargó la ficha de la posición.",
    })
  }

  /**
   * Trae la etiqueta a pantalla antes de leer su valor.
   *
   * El page source SOLO contiene lo renderizado: "Costo" y "Valor" viven en la
   * tarjeta "Resultado de la posición", que arranca abajo del fold. Leer sin
   * scrollear da "no encontré la etiqueta" aunque la pantalla sea la correcta.
   */
  private async readMetric(label: string): Promise<string> {
    await scrollToText(label, 8, true)
    return readValueUnderLabel(label)
  }

  async readQuantity(): Promise<number> {
    return parseQuantity(await this.readMetric("Cantidad"))
  }

  /** PPP: precio promedio ponderado de compra. Vender NO lo mueve. */
  async readAveragePrice(): Promise<number> {
    return extractArs(await this.readMetric("PPP"))
  }

  async readCost(): Promise<number> {
    return extractArs(await this.readMetric("Costo"))
  }

  async readMarketValue(): Promise<number> {
    return extractArs(await this.readMetric("Valor"))
  }

  /**
   * El rendimiento (retorno %) no tiene una etiqueta al lado como "Costo" o
   * "Valor": es el único TEXTO VISIBLE con "%" en la ficha, dentro de
   * PortfolioReturnBadge. Devuelve el texto CRUDO porque lo que importa acá
   * es el FORMATO (formatPortfolioPercent usa `toFixed(2)`, punto decimal,
   * no es-AR).
   *
   * No se usa `byTextContains("%")`: en iOS matchea antes un
   * accessibilityValue oculto del gráfico ("0 %", ver
   * InstrumentDetailScreen.readDailyReturnText) que el badge real.
   * `readTextNodes` sólo trae StaticText realmente dibujado.
   */
  async readReturnRatioText(): Promise<string> {
    await scrollToText("Resultado de la posición", 8, true)

    const nodes = await readTextNodes()
    const node = nodes.find(candidate => candidate.text.includes("%"))

    if (!node) {
      throw new Error("No encontré el badge de rendimiento en la ficha.")
    }

    return node.text
  }

  /**
   * La ficha no muestra el último precio con una etiqueta al lado, pero sí el
   * valor de mercado y la cantidad: el precio es el cociente.
   *
   * Las dos lecturas van SECUENCIALES, no en `Promise.all`: cada una scrollea
   * (un solo driver, una sola sesión). Dos scrolls a la vez confunden a WDA en
   * iOS —cada uno reinicia el progreso del otro— y la sesión queda scrolleando
   * sin encontrar nunca ninguna de las dos etiquetas.
   */
  async readLastPrice(): Promise<number> {
    const marketValue = await this.readMarketValue()
    const quantity = await this.readQuantity()

    if (quantity === 0) {
      throw new Error(
        "No puedo derivar el último precio: la posición tiene 0 acciones."
      )
    }

    return marketValue / quantity
  }

  /**
   * Defecto conocido: en Android este botón queda tapado por la barra de
   * pestañas y es inalcanzable.
   *
   * Siempre se pasa por scrollToText, que además LEVANTA el elemento por encima
   * de la barra. Un atajo del tipo "si ya se ve, tocalo" no sirve: Appium lo
   * reporta visible aunque la barra se esté comiendo el tap.
   */
  async openTicket() {
    if (driver.isIOS) {
      await this.openTicketOnIos()
      return
    }

    const button = await scrollToText(NAV.tradeFromPosition)
    await tapElement(button, NAV.tradeFromPosition)
  }

  /**
   * En iOS 26 el botón NO es inalcanzable: con la barra expandida queda debajo
   * de ella, pero un scroll más hacia abajo la colapsa a dos círculos en los
   * extremos y el centro del botón queda libre. Es lo que hace una persona.
   *
   * Ni `scrollToText` ni `tapElement` sirven acá. XCUITest marca el botón
   * `visible="false"` mientras el frame de la barra lo cubra, colapsada o no, así
   * que se lo busca sin filtrar por visibilidad y se lo toca por coordenadas
   * cuando está entero en pantalla y la barra ya se colapsó.
   */
  private async openTicketOnIos() {
    const selector = byTextIgnoringVisibility(NAV.tradeFromPosition)
    const {height: windowHeight} = await driver.getWindowSize()

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const [button] = await $$(selector).getElements()

      if (button) {
        const [{x, y}, {width, height}] = await Promise.all([
          button.getLocation(),
          button.getSize(),
        ])

        if (y + height <= windowHeight && (await tabBar.isCollapsed())) {
          await tapAt(x + width / 2, y + height / 2)
          return
        }
      }

      await swipeUp(0.3, true)
    }

    throw new Error(
      `No pude dejar "${NAV.tradeFromPosition}" a la vista con la barra colapsada.`
    )
  }

  /**
   * ¿Está abierta la ficha de la posición? Se decide por su botón "Operar esta
   * posición", que sólo existe ahí. En iOS se pregunta por su presencia en el
   * árbol, no por su visibilidad: XCUITest lo marca `visible="false"` mientras
   * el frame de la barra de pestañas lo cubra (ver `openTicketOnIos`).
   */
  async isShown() {
    if (driver.isIOS) {
      const matches = await $$(
        byTextIgnoringVisibility(NAV.tradeFromPosition)
      ).getElements()

      return matches.length > 0
    }

    return isVisible(byText(NAV.tradeFromPosition), 1_500)
  }

  async goBack() {
    if (driver.isAndroid) {
      await driver.back()
      return
    }

    const back = await waitForVisible(byText(NAV.backToPortfolio))
    await back.click()
  }
}

export const positionDetailScreen = new PositionDetailScreen()
