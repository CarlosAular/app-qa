import {
  pullToRefresh,
  scrollToTextContains,
  scrollToTop,
} from "../support/gestures"
import {byTextContains} from "../support/selectors"
import {isVisible, waitForVisible} from "../support/waits"

const COUNT_PATTERN = /^(\d+)\s+(orden|órdenes)$/i

class OrdersScreen {
  async waitUntilLoaded() {
    await waitForVisible(byTextContains("Historial completo de órdenes"), {
      message: "No cargó la pantalla de Órdenes.",
    })
  }

  async refresh() {
    await scrollToTop()
    await pullToRefresh()
    await this.waitUntilLoaded()
  }

  /**
   * El conteo total que muestra el encabezado ("7 órdenes").
   *
   * No hay forma de seleccionarlo directo: se traen todos los textos que
   * contienen "orden" y se filtra por el patrón exacto, porque la pestaña
   * "Órdenes" y el subtítulo también matchean.
   */
  async readOrderCount(): Promise<number> {
    await scrollToTop()

    const candidates = await $$(byTextContains("rden"))

    for (const candidate of candidates) {
      const text = (await candidate.getText()).trim()
      const match = text.match(COUNT_PATTERN)

      if (match?.[1]) {
        return Number(match[1])
      }
    }

    throw new Error(
      'No encontré el contador de órdenes ("N órdenes") en el encabezado de la pestaña.'
    )
  }

  /**
   * Una fila por número de orden.
   *
   * Ancla en el texto "· #<id>", que es visible en las dos plataformas. No se
   * usa el accessibilityLabel de la fila porque OrdersHistoryRow lo pone sobre
   * un View sin `accessible`, así que en iOS no resuelve (defecto reportado).
   */
  async findRowById(orderId: number | string) {
    return scrollToTextContains(`#${orderId}`)
  }

  async hasRowForId(orderId: number | string): Promise<boolean> {
    return isVisible(byTextContains(`#${orderId}`), 2_500)
  }

  /** Coordenada vertical de una fila, para comprobar quién va primero. */
  async yOfRow(orderId: number | string): Promise<number> {
    const row = await this.findRowById(orderId)
    return (await row.getLocation()).y
  }

  /** Verifica que un texto exista dentro de la fila de esa orden. */
  async rowShows(orderId: number | string, fragment: string): Promise<boolean> {
    await this.findRowById(orderId)
    return isVisible(byTextContains(fragment), 2_500)
  }

  async isEmpty(): Promise<boolean> {
    await scrollToTop()
    return isVisible(byTextContains("Todavía no enviaste órdenes"), 2_000)
  }
}

export const ordersScreen = new OrdersScreen()
