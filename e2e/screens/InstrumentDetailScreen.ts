import {NAV} from "../data/messages"
import {scrollToText, tapElement} from "../support/gestures"
import {extractArs} from "../support/money"
import {readValueUnderLabel} from "../support/pageMap"
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
