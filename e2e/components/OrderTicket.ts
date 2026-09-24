import {TICKET} from "../data/messages"
import {dismissKeyboard} from "../support/gestures"
import {extractArs, parseQuantity} from "../support/money"
import {readValueUnderLabel} from "../support/pageMap"
import {
  byText,
  byTextContains,
  byTextInsensitive,
  inputByLabel,
  segmentByText,
} from "../support/selectors"
import {eventually, isVisible, textOf, waitForVisible} from "../support/waits"

export type TicketSide = "Comprar" | "Vender"
export type TicketType = "Market" | "Limit"
export type TicketQuantityMode = "Acciones" | "Pesos"

/**
 * El ticket de trading.
 *
 * Es un BottomSheetModal, no una ruta: convive en el árbol con la pantalla que
 * quedó atrás. Se abre desde Mercados, Portafolio y Buscar, así que es un
 * component object y no una pantalla.
 */
class OrderTicket {
  async waitUntilOpen() {
    await waitForVisible(byText(TICKET.heading), {
      message: 'El ticket no se abrió: no apareció "Nueva orden".',
    })
  }

  async isOpen() {
    return isVisible(byText(TICKET.heading), 1_500)
  }

  private async tapSegment(label: string) {
    const segment = await waitForVisible(segmentByText(label), {
      message: `No encontré el segmento "${label}" en el ticket.`,
    })

    await segment.click()
    await browser.pause(350)
  }

  async setSide(side: TicketSide) {
    await this.tapSegment(side)
  }

  async setType(type: TicketType) {
    await this.tapSegment(type)

    if (type === "Limit") {
      await waitForVisible(inputByLabel(TICKET.limitPriceLabel), {
        message: 'Elegí Limit pero no apareció el campo "Precio límite".',
      })
    }
  }

  async setQuantityMode(mode: TicketQuantityMode) {
    await this.tapSegment(mode)

    const expectedInput =
      mode === "Pesos" ? TICKET.amountLabel : TICKET.quantityLabel

    await waitForVisible(inputByLabel(expectedInput), {
      message: `Elegí "${mode}" pero no apareció el campo "${expectedInput}".`,
    })
  }

  private async fill(label: string, value: string) {
    const field = await waitForVisible(inputByLabel(label), {
      message: `No encontré el campo "${label}".`,
    })

    await field.click()
    await field.clearValue()
    await field.addValue(value)
    await dismissKeyboard()
  }

  /** Cantidad en acciones. Acepta string para poder probar "2,5". */
  async enterQuantity(quantity: number | string) {
    await this.fill(TICKET.quantityLabel, String(quantity))
  }

  /** Monto en pesos. Usar coma decimal: "1500,50". */
  async enterAmount(amount: string) {
    await this.fill(TICKET.amountLabel, amount)
  }

  async enterLimitPrice(price: string) {
    await this.fill(TICKET.limitPriceLabel, price)
  }

  async clearLimitPrice() {
    const field = await waitForVisible(inputByLabel(TICKET.limitPriceLabel))
    await field.click()
    await field.clearValue()
    await dismissKeyboard()
  }

  /** Lo que el campo muestra REALMENTE, después del saneado de la app. */
  async readFieldValue(label: string) {
    const field = await waitForVisible(inputByLabel(label))
    return (await field.getText()).trim()
  }

  /** Las acciones que el pie del panel dice que va a enviar. */
  async readComputedQuantity(): Promise<number> {
    return parseQuantity(
      await readValueUnderLabel(TICKET.estimateQuantityLabel)
    )
  }

  /** El importe estimado. Devuelve null cuando la app no lo dibuja (0 acciones). */
  async readEstimate(): Promise<number | null> {
    const selector = byTextContains(TICKET.estimatePrefix)

    if (!(await isVisible(selector, 1_500))) {
      return null
    }

    return extractArs(await textOf(selector))
  }

  async submit() {
    const button = await waitForVisible(byTextInsensitive(TICKET.submitIdle), {
      message: 'No encontré el botón "Enviar orden".',
    })

    await button.click()
  }

  /**
   * La señal cross-platform de que la orden se procesó.
   *
   * NO se usa el toast: en Android el aviso "Orden ejecutada" nunca aparece
   * (defecto conocido). El botón, en cambio, pasa a "Enviar otra orden" en las
   * dos plataformas porque lo maneja el estado del formulario.
   */
  async waitForSubmitted(timeout = 20_000) {
    await waitForVisible(byTextInsensitive(TICKET.submitDone), {
      timeout,
      message:
        'La orden no llegó a procesarse: el botón nunca pasó a "Enviar otra orden".',
    })
  }

  /**
   * Como `waitForSubmitted`, pero da por procesada la orden también si el sheet
   * ya se cerró solo.
   *
   * Observado en iOS con las VENTAS límite: pasados unos segundos del envío el
   * sheet se cierra por su cuenta y aparece el toast "Orden enviada", en vez de
   * quedar abierto con "Enviar otra orden" (las compras límite sí quedan abiertas).
   * La orden llegó igual: el servicio la muestra pendiente. No se confirmó la
   * causa; la hipótesis es que el refresco de la posición, ya con la reserva
   * descontada, desmonta el sheet. Que la orden existió lo verifican los pasos
   * siguientes del caso contra la API, no esta espera.
   */
  async waitForSubmittedOrClosed(timeout = 20_000) {
    await eventually(
      async () => {
        if (await isVisible(byTextInsensitive(TICKET.submitDone), 800)) {
          return
        }

        if (!(await this.isOpen())) {
          return
        }

        throw new Error(
          'La orden no llegó a procesarse: el ticket sigue en "Enviando…".'
        )
      },
      {timeout, interval: 300}
    )
  }

  /** Mensaje de validación bajo un campo. */
  async expectFieldError(message: string) {
    await eventually(async () => {
      if (!(await isVisible(byText(message), 1_200))) {
        throw new Error(`No apareció el mensaje de validación "${message}".`)
      }
    })
  }

  async hasFieldError(message: string) {
    return isVisible(byText(message), 2_000)
  }

  /**
   * Cierra el sheet tocando el backdrop.
   *
   * NO se usa el back de Android: el ModalProvider vive en el layout raíz, así
   * que el back saca la RUTA de abajo (la ficha del instrumento) y deja el
   * sheet abierto tapando la barra de pestañas. El backdrop está configurado
   * con pressBehavior="close", que es lo que realmente lo cierra.
   */
  async close() {
    if (!(await this.isOpen())) {
      return
    }

    const {width, height} = await driver.getWindowSize()

    /*
     * El backdrop está expuesto como elemento propio ("Bottom sheet backdrop"):
     * tocarlo es más confiable que apuntar a una fracción de la pantalla, que
     * en iOS puede caer sobre la barra de estado y no cerrar nada.
     */
    const backdrop = await $(byText("Bottom sheet backdrop"))

    if (await backdrop.isDisplayed().catch(() => false)) {
      await backdrop.click()
    } else {
      await driver
        .action("pointer", {parameters: {pointerType: "touch"}})
        .move({
          duration: 0,
          x: Math.round(width / 2),
          y: Math.round(height * 0.14),
        })
        .down()
        .pause(80)
        .up()
        .perform()
    }

    await browser.pause(700)

    if (!(await this.isOpen())) {
      return
    }

    // Plan B: arrastrar el sheet hacia abajo (enablePanDownToClose).
    const handle = await $(byText(TICKET.heading))
    const location = await handle.getLocation()

    await driver
      .action("pointer", {parameters: {pointerType: "touch"}})
      .move({duration: 0, x: Math.round(width / 2), y: Math.round(location.y)})
      .down()
      .pause(120)
      .move({
        duration: 500,
        x: Math.round(width / 2),
        y: Math.round(height * 0.95),
      })
      .up()
      .perform()

    await browser.pause(700)

    if (await this.isOpen()) {
      throw new Error(
        "No pude cerrar el ticket: sigue visible tras tocar el backdrop y arrastrarlo hacia abajo."
      )
    }
  }
}

export const orderTicket = new OrderTicket()
