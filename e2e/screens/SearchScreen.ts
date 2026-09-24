import {NAV, SEARCH} from "../data/messages"
import {labelOf} from "../support/a11y"
import {scrollToLabelContains} from "../support/gestures"
import {extractArs} from "../support/money"
import {
  byLabel,
  byLabelContains,
  byText,
  inputByLabel,
} from "../support/selectors"
import {isVisible, waitForVisible, SHORT_TIMEOUT} from "../support/waits"

class SearchScreen {
  async waitUntilLoaded() {
    await waitForVisible(inputByLabel(SEARCH.inputLabel), {
      message: `No cargó la pantalla de Buscar: no apareció el campo "${SEARCH.inputLabel}".`,
    })
  }

  /**
   * Sin esto, en iOS el teclado se queda arriba después de tipear: empuja o
   * tapa la barra de pestañas, y el tap por geometría de `TabBar` (que asume
   * la pantalla completa, sin teclado) falla o cae en cualquier lado.
   */
  private async dismissKeyboard() {
    if (driver.isAndroid) {
      try {
        await driver.hideKeyboard()
      } catch {
        // UiAutomator2 tira si el teclado ya se cerró solo; no es fatal.
      }
      await browser.pause(400)
      return
    }

    const heading = await $(byText(NAV.headingSearch))

    if (await heading.isDisplayed().catch(() => false)) {
      await heading.click()
      await browser.pause(400)
    }
  }

  /**
   * Tipea y espera el debounce real de la app (350ms) más un margen para que
   * la respuesta de red llegue, antes de que cualquier lectura posterior
   * intente encontrar un resultado.
   */
  async typeQuery(query: string) {
    const field = await waitForVisible(inputByLabel(SEARCH.inputLabel), {
      message: `No encontré el campo "${SEARCH.inputLabel}".`,
    })

    await field.click()
    await field.clearValue()
    await field.addValue(query)
    await browser.pause(SEARCH.debounceMs + 550)
    await this.dismissKeyboard()
  }

  async clearQuery() {
    const clearButton = await waitForVisible(byLabel(SEARCH.clearLabel), {
      message: `No encontré el botón "${SEARCH.clearLabel}".`,
    })
    await clearButton.click()
  }

  /**
   * El campo conserva lo tipeado al cambiar de pestaña (es el propio
   * comportamiento que verifica COCOS-34): un test que necesite arrancar en
   * "idle" no puede asumir que el campo ya está vacío.
   */
  async ensureEmpty() {
    if (await isVisible(byLabel(SEARCH.clearLabel), 1_000)) {
      await this.clearQuery()
    }
  }

  /**
   * Fila de resultado: "TICKER, Nombre, TYPE, ultimo precio $ X,XX".
   * A diferencia de la fila de Mercados, esta SÍ trae el type en el label:
   * es el mecanismo real para distinguir ACCIONES de MONEDA (COCOS-43).
   */
  private rowFor(ticker: string) {
    return scrollToLabelContains(`${ticker}, `)
  }

  async hasResult(ticker: string, timeout = SHORT_TIMEOUT): Promise<boolean> {
    return isVisible(byLabelContains(`${ticker}, `), timeout)
  }

  async waitForResult(ticker: string) {
    await this.rowFor(ticker)
  }

  async readResultType(ticker: string): Promise<string> {
    const label = await labelOf(await this.rowFor(ticker))
    const match = label.match(/, ([A-ZÁÉÍÓÚÑ]+), ultimo precio/)

    if (!match?.[1]) {
      throw new Error(
        `No pude leer el tipo de ${ticker} del label de la fila: ${JSON.stringify(label)}`
      )
    }

    return match[1]
  }

  async readLastPrice(ticker: string): Promise<number> {
    const label = await labelOf(await this.rowFor(ticker))
    const match = label.match(/ultimo precio (.+)$/)

    if (!match?.[1]) {
      throw new Error(
        `No pude leer el precio de ${ticker} del label de la fila: ${JSON.stringify(label)}`
      )
    }

    return extractArs(match[1])
  }

  /** Abre el ticket directo: Buscar no tiene ficha intermedia. */
  async openResult(ticker: string) {
    const row = await this.rowFor(ticker)
    await row.click()
  }

  /** Sugerencias de "Más movidos", visibles sólo con el campo vacío. */
  async tapSuggestion(ticker: string) {
    const suggestion = await waitForVisible(byText(`Buscar ${ticker}`), {
      message: `No encontré la sugerencia "Buscar ${ticker}".`,
    })

    await suggestion.click()
    await browser.pause(SEARCH.debounceMs + 550)
  }
}

export const searchScreen = new SearchScreen()
