import {NAV} from "../data/messages"
import {scrollToText, tapElement} from "../support/gestures"
import {extractArs} from "../support/money"
import {readTextNodes, readValueUnderLabel} from "../support/pageMap"
import {byText} from "../support/selectors"
import {waitForVisible} from "../support/waits"

class InstrumentDetailScreen {
  async waitUntilLoaded() {
    await waitForVisible(byText(NAV.tradeFromInstrument), {
      message: "No cargó la ficha del instrumento.",
    })
  }

  /** El cierre anterior sí tiene etiqueta al lado; el último precio no. */
  async readPreviousClose(): Promise<number> {
    return extractArs(await readValueUnderLabel("Cierre anterior"))
  }

  async readSpread(): Promise<number> {
    return extractArs(await readValueUnderLabel("Spread diario"))
  }

  /**
   * El badge de retorno diario no tiene una etiqueta separada al lado (a
   * diferencia de "Cierre anterior"/"Spread diario"): es el único TEXTO
   * VISIBLE con "%" en la ficha. Devuelve el texto CRUDO ("+8.69%"), sin
   * parsear, porque lo que importa es el formato (MarketsInstrumentReturnBadge
   * usa `toFixed(2)`, punto decimal, no es-AR).
   *
   * No se usa `byTextContains("%")`: en iOS matchea antes un accessibilityValue
   * oculto del gráfico ("0 %", ningún texto visible lo muestra) que el badge
   * real. `readTextNodes` sólo trae StaticText realmente dibujado.
   */
  async readDailyReturnText(): Promise<string> {
    const nodes = await readTextNodes()
    const node = nodes.find(candidate => candidate.text.includes("%"))

    if (!node) {
      throw new Error("No encontré el badge de retorno diario en la ficha.")
    }

    return node.text
  }

  /** Mismo criterio que en la ficha de la posición: siempre por scrollToText,
   *  que levanta el botón por encima de la barra de pestañas. */
  async openTicket() {
    const button = await scrollToText(NAV.tradeFromInstrument)
    await tapElement(button, NAV.tradeFromInstrument)
  }

  async goBack() {
    if (driver.isAndroid) {
      await driver.back()
      return
    }

    const back = await waitForVisible(byText(NAV.backToMarkets))
    await back.click()
  }
}

export const instrumentDetailScreen = new InstrumentDetailScreen()
