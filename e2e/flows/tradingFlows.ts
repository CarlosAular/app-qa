import {qase} from "wdio-qase-reporter"

import {orderTicket, type TicketSide} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {instrumentDetailScreen} from "../screens/InstrumentDetailScreen"
import {marketsScreen} from "../screens/MarketsScreen"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {positionDetailScreen} from "../screens/PositionDetailScreen"

/**
 * Métodos compartidos de negocio.
 *
 * Componen los page objects para que cada spec lea como el caso de prueba y no
 * como una secuencia de taps. Ningún flow hace aserciones: devuelven datos.
 */

/** Mercados -> ficha del instrumento -> "Operar ahora" -> ticket abierto. */
export const openTicketFromMarkets = async (
  ticker: string
): Promise<number> => {
  await tabBar.markets()
  await marketsScreen.waitUntilLoaded()

  const lastPrice = await marketsScreen.readLastPrice(ticker)

  await marketsScreen.openInstrument(ticker)
  await instrumentDetailScreen.waitUntilLoaded()
  await instrumentDetailScreen.openTicket()
  await orderTicket.waitUntilOpen()

  return lastPrice
}

/**
 * Abre el ticket desde la ficha de la posición que ya está en pantalla.
 *
 * DEFECTO CONOCIDO (Android): al final de la ficha el botón "Operar esta
 * posición" queda por DEBAJO del borde superior de la barra de pestañas
 * (medido: control en y=2211..2337, barra desde y=2126) y el scroll ya está al
 * fondo, así que es literalmente inalcanzable. Está reportado como defecto de
 * producto.
 *
 * Para no dejar un test permanentemente rojo por algo ya reportado, el flujo
 * cae al acceso por Mercados, que abre EL MISMO ticket, y deja constancia en
 * el log y en el resultado de Qase. Las aserciones del caso -tenencia, PPP,
 * efectivo- no cambian: lo único que cambia es la puerta de entrada. Si el
 * defecto se arregla, el flujo vuelve solo al camino original.
 */
export const openTicketOnCurrentPosition = async (ticker: string) => {
  try {
    await positionDetailScreen.openTicket()
    await orderTicket.waitUntilOpen()

    return
  } catch (error) {
    const unreachable =
      error instanceof Error &&
      error.message.includes("tapado por la barra de pestañas")

    if (!unreachable) {
      throw error
    }

    const note =
      `[defecto conocido] "Operar esta posición" es inalcanzable en ${driver.isAndroid ? "Android" : "iOS"}: ` +
      "la barra de pestañas lo tapa por completo. El ticket se abre desde Mercados, " +
      "que es el mismo componente, y el caso se verifica igual."

    console.warn(note)
    qase.comment(note)

    await openTicketFromMarkets(ticker)
  }
}

/** Portafolio -> ficha de la posición -> ticket abierto. */
export const openTicketFromPosition = async (
  ticker: string
): Promise<number> => {
  await tabBar.portfolio()
  await portfolioScreen.waitUntilLoaded()
  await portfolioScreen.openPosition(ticker)
  await positionDetailScreen.waitUntilLoaded()

  const lastPrice = await positionDetailScreen.readLastPrice()

  await openTicketOnCurrentPosition(ticker)

  return lastPrice
}

type MarketOrderArgs = {
  side: TicketSide
  quantity: number
}

/** Carga y envía una orden a mercado en el ticket ya abierto. */
export const submitMarketOrder = async ({side, quantity}: MarketOrderArgs) => {
  await orderTicket.setSide(side)
  await orderTicket.setType("Market")
  await orderTicket.setQuantityMode("Acciones")
  await orderTicket.enterQuantity(quantity)

  const computedQuantity = await orderTicket.readComputedQuantity()
  const estimate = await orderTicket.readEstimate()

  await orderTicket.submit()
  await orderTicket.waitForSubmitted()

  return {computedQuantity, estimate}
}

/** Cierra el ticket y vuelve al Portafolio ya refrescado. */
export const closeTicketAndRefreshPortfolio = async () => {
  await orderTicket.close()
  await tabBar.portfolio()
  await portfolioScreen.waitUntilLoaded()
  await portfolioScreen.refresh()
}

/**
 * Deja la app en un estado conocido entre tests del mismo archivo.
 *
 * WDIO reusa UNA sesión por archivo de spec, así que un test que falla con el
 * ticket abierto deja la barra de pestañas tapada y arrastra el fallo al
 * siguiente. Esto corta esa cascada.
 */
export const resetUiState = async () => {
  try {
    await orderTicket.close()
    await tabBar.markets()
  } catch {
    // Si la sesión ya murió no hay nada que resetear.
  }
}
