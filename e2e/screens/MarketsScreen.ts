import {NAV} from "../data/messages"
import {labelOf} from "../support/a11y"
import {scrollToLabelContains, scrollToTop} from "../support/gestures"
import {extractArs} from "../support/money"
import {byLabelContains, byText} from "../support/selectors"
import {waitForVisible} from "../support/waits"

class MarketsScreen {
  /**
   * Se espera por una FILA, no por el encabezado: el scroll sobrevive al cambio
   * de pestaña, así que al volver a Mercados el título puede estar fuera de
   * pantalla aunque la pantalla esté perfectamente cargada.
   */
  async waitUntilLoaded() {
    await waitForVisible(byLabelContains("ultimo precio"), {
      message:
        "No cargó la pantalla de Mercados: no hay ninguna fila de instrumento.",
    })
  }

  private rowFor(ticker: string) {
    return scrollToLabelContains(`${ticker}, `)
  }

  /**
   * El último precio sale del accessibilityLabel de la fila, que trae todo:
   * "DYCA, Dycasa S.A., ultimo precio $ 45,72, retorno diario -8.69 por ciento".
   * Es la lectura más estable que ofrece la app sin tocar su código.
   */
  async readLastPrice(ticker: string): Promise<number> {
    const row = await this.rowFor(ticker)
    const label = await labelOf(row)
    const match = label.match(/ultimo precio (.+?), retorno/)

    if (!match?.[1]) {
      throw new Error(
        `No pude leer el precio de ${ticker} del label de la fila: ${JSON.stringify(label)}`
      )
    }

    return extractArs(match[1])
  }

  async openInstrument(ticker: string) {
    const row = await this.rowFor(ticker)
    await row.click()

    await waitForVisible(byText(NAV.tradeFromInstrument), {
      message: `Abrí ${ticker} pero no apareció el botón "Operar ahora".`,
    })
  }

  async backToTop() {
    await scrollToTop()
  }
}

export const marketsScreen = new MarketsScreen()
