import {NAV, PORTFOLIO} from "../data/messages"
import {labelOf} from "../support/a11y"
import {
  pullToRefresh,
  scrollToLabelContains,
  scrollToTop,
} from "../support/gestures"
import {extractArs, parseQuantity} from "../support/money"
import {readTextNodes, valueUnderLabel} from "../support/pageMap"
import {byText, byTextContains} from "../support/selectors"
import {isVisible, waitForVisible} from "../support/waits"

class PortfolioScreen {
  /**
   * Asegura el LISTADO de posiciones, no cualquier pantalla de la pestaña.
   *
   * Dos cosas que hay que desarmar acá:
   *   - El scroll sobrevive al cambio de pestaña, así que el encabezado puede
   *     estar fuera de pantalla aunque la pantalla sea la correcta.
   *   - La ficha de una posición es una ruta HIJA de la pestaña Portafolio: la
   *     barra sigue visible y tocar la pestaña no siempre vuelve al listado.
   */
  async waitUntilLoaded() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await scrollToTop()

      if (
        await isVisible(byTextContains("Tenencias valorizadas en pesos"), 1_500)
      ) {
        return
      }

      if (driver.isAndroid) {
        await driver.back()
      } else if (await isVisible(byText(NAV.backToPortfolio), 800)) {
        await (await $(byText(NAV.backToPortfolio))).click()
      } else {
        break
      }

      await browser.pause(800)
    }

    await waitForVisible(byTextContains("Tenencias valorizadas en pesos"), {
      message: "No cargó el listado del Portafolio.",
    })
  }

  /** Los casos manuales dicen "refrescar tirando hacia abajo". */
  async refresh() {
    await scrollToTop()
    await pullToRefresh()
    await this.waitUntilLoaded()
  }

  /** Toda la tarjeta de resumen en una sola llamada al driver. */
  async readSummary() {
    await scrollToTop()

    const nodes = await readTextNodes()

    return {
      totalValue: extractArs(valueUnderLabel(nodes, PORTFOLIO.totalValue)),
      gain: extractArs(valueUnderLabel(nodes, PORTFOLIO.gain)),
      costBasis: extractArs(valueUnderLabel(nodes, PORTFOLIO.costBasis)),
      cash: extractArs(valueUnderLabel(nodes, PORTFOLIO.cash)),
      positions: parseQuantity(valueUnderLabel(nodes, PORTFOLIO.positions)),
    }
  }

  private async readSummaryValue(label: string): Promise<string> {
    await scrollToTop()
    return valueUnderLabel(await readTextNodes(), label)
  }

  async readCash(): Promise<number> {
    return extractArs(await this.readSummaryValue(PORTFOLIO.cash))
  }

  async readTotalValue(): Promise<number> {
    return extractArs(await this.readSummaryValue(PORTFOLIO.totalValue))
  }

  async readCostBasis(): Promise<number> {
    return extractArs(await this.readSummaryValue(PORTFOLIO.costBasis))
  }

  async readPositionsCount(): Promise<number> {
    return parseQuantity(await this.readSummaryValue(PORTFOLIO.positions))
  }

  private rowFor(ticker: string) {
    return scrollToLabelContains(`${ticker}, cantidad `)
  }

  async hasPosition(ticker: string): Promise<boolean> {
    try {
      await this.rowFor(ticker)
      return true
    } catch {
      return false
    }
  }

  /**
   * La cantidad sale del label de la fila:
   * "DYCA, cantidad 21, valor de mercado $ 960,12, ganancia $ 0,00".
   */
  async readPositionQuantity(ticker: string): Promise<number> {
    const label = await labelOf(await this.rowFor(ticker))
    const match = label.match(/cantidad ([\d.]+)/)

    if (!match?.[1]) {
      throw new Error(
        `No pude leer la cantidad de ${ticker} del label: ${JSON.stringify(label)}`
      )
    }

    return parseQuantity(match[1])
  }

  async readPositionMarketValue(ticker: string): Promise<number> {
    const label = await labelOf(await this.rowFor(ticker))
    const match = label.match(/valor de mercado (.+?), ganancia/)

    if (!match?.[1]) {
      throw new Error(
        `No pude leer el valor de mercado de ${ticker} del label: ${JSON.stringify(label)}`
      )
    }

    return extractArs(match[1])
  }

  async openPosition(ticker: string) {
    const row = await this.rowFor(ticker)
    await row.click()

    await waitForVisible(byTextContains("Composición de la posición"), {
      message: `Abrí la posición de ${ticker} pero no cargó su ficha.`,
    })
  }

  async isEmpty(): Promise<boolean> {
    await scrollToTop()
    return isVisible(byTextContains(PORTFOLIO.emptyTitle), 2_000)
  }
}

export const portfolioScreen = new PortfolioScreen()
