import {
  pullToRefresh,
  scrollToTextContains,
  scrollToTop,
  swipeUp,
} from "../support/gestures"
import {readTextNodes} from "../support/pageMap"
import {
  byLabel,
  byText,
  byTextContains,
  byTextInsensitive,
} from "../support/selectors"
import {isVisible, waitForGone, waitForVisible} from "../support/waits"

const COUNT_PATTERN = /^(\d+)\s+(orden|órdenes)$/i

export type OrderStatusLabel = "Ejecutada" | "Pendiente" | "Rechazada"

const STATUS_LABELS: OrderStatusLabel[] = [
  "Ejecutada",
  "Pendiente",
  "Rechazada",
]
const ORDER_ID_PATTERN = /#(\d+)/

/**
 * El botón y el título del diálogo nativo comparten el MISMO texto
 * ("Reiniciar cuenta"): a propósito no se usa `byText` para tocar el botón,
 * para no arriesgar una resolución ambigua si la plataforma expone el
 * subárbol de atrás mientras el alert está arriba.
 */
const RESET_TRIGGER_LABEL = "Reiniciar cuenta"
const RESET_CONFIRM_MARK = "No se puede deshacer"
const RESET_CONFIRM_BUTTON = "Reiniciar"
const RESET_PENDING_LABEL = "Reiniciando…"

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

  /**
   * El estado (chip) de UNA orden.
   *
   * `rowShows` no sirve para esto: busca el texto en toda la pantalla, así que
   * el "Ejecutada" de otra fila lo daría por bueno. Acá se lee el chip más
   * cercano en vertical al texto "· #<id>" de la fila pedida.
   */
  async readRowStatus(orderId: number | string): Promise<OrderStatusLabel> {
    await this.findRowById(orderId)

    const nodes = await readTextNodes()
    const idNode = nodes.find(node => node.text.includes(`#${orderId}`))

    if (!idNode) {
      throw new Error(`No encontré la fila de la orden #${orderId}.`)
    }

    const {height} = await driver.getWindowSize()

    const [closest] = nodes
      .filter(node => STATUS_LABELS.includes(node.text.trim() as never))
      .map(node => ({node, distance: Math.abs(node.y - idNode.y)}))
      .filter(candidate => candidate.distance < height * 0.04)
      .sort((left, right) => left.distance - right.distance)

    if (!closest) {
      throw new Error(
        `No encontré el estado de la orden #${orderId} junto a su fila.`
      )
    }

    return closest.node.text.trim() as OrderStatusLabel
  }

  /**
   * Los números de orden de arriba hacia abajo, scrolleando hasta juntar
   * `count`. La lista es virtualizada: sólo existen las filas dibujadas, así que
   * se acumulan de a una pantalla y se corta si dos scrolls seguidos no traen
   * ninguna nueva.
   */
  async readOrderIdsTopToBottom(count: number): Promise<string[]> {
    await scrollToTop()

    const seen: string[] = []
    let idleScrolls = 0

    for (let attempt = 0; attempt < 14 && seen.length < count; attempt += 1) {
      const nodes = await readTextNodes()

      const visible = nodes
        .map(node => ({y: node.y, match: node.text.match(ORDER_ID_PATTERN)}))
        .filter(item => item.match !== null)
        .sort((left, right) => left.y - right.y)
        .map(item => item.match![1]!)

      const before = seen.length

      for (const id of visible) {
        if (!seen.includes(id)) {
          seen.push(id)
        }
      }

      idleScrolls = seen.length === before ? idleScrolls + 1 : 0

      if (idleScrolls >= 2) {
        break
      }

      await swipeUp(0.4)
    }

    return seen
  }

  async isEmpty(): Promise<boolean> {
    await scrollToTop()
    return isVisible(byTextContains("Todavía no enviaste órdenes"), 2_000)
  }

  /** El botón vive en el header de la lista: hay que estar arriba de todo. */
  async tapReset() {
    await scrollToTop()

    const button = await waitForVisible(byLabel(RESET_TRIGGER_LABEL), {
      message: `No encontré el botón "${RESET_TRIGGER_LABEL}".`,
    })
    await button.click()
  }

  /**
   * Ancla en el CUERPO del alert, no en su título: el título repite el mismo
   * texto que el accessibilityLabel del botón que lo disparó.
   */
  async waitForResetConfirmDialog() {
    await waitForVisible(byTextContains(RESET_CONFIRM_MARK), {
      message: "No apareció el diálogo de confirmación del reinicio.",
    })
  }

  /**
   * El AlertDialog nativo de Android pone los botones en mayúsculas por el
   * tema Material ("REINICIAR"), aunque el string de la app es "Reiniciar":
   * por eso el match es insensible a mayúsculas, no exacto.
   */
  async confirmReset() {
    const confirmButton = await waitForVisible(
      byTextInsensitive(RESET_CONFIRM_BUTTON),
      {
        message: `No encontré el botón "${RESET_CONFIRM_BUTTON}" del diálogo.`,
      }
    )
    await confirmButton.click()
  }

  /**
   * 25s, no 15s: llama a la API real (sin mock), y una corrida larga (la
   * suite completa corre este spec último, tras ~25 minutos de otros tests)
   * ya mostró que 15s se queda corto por latencia de red, no porque el
   * reinicio falle — el servicio y la UI sí terminan, solo tardan más.
   */
  async waitForResetComplete(timeout = 25_000) {
    await waitForGone(byText(RESET_PENDING_LABEL), {
      timeout,
      message: `El reinicio nunca terminó: el botón siguió en "${RESET_PENDING_LABEL}".`,
    })
  }
}

export const ordersScreen = new OrdersScreen()
