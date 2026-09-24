import {NAV} from "../data/messages"
import {byText, tabSelector} from "../support/selectors"
import {isVisible, waitForVisible} from "../support/waits"

export type TabName = "Mercados" | "Portafolio" | "Órdenes" | "Buscar"

/** El orden que declara src/app/(tabs)/_layout.tsx. */
const TAB_ORDER: TabName[] = ["Mercados", "Portafolio", "Órdenes", "Buscar"]

const IOS_TAB_BAR = "-ios class chain:**/XCUIElementTypeTabBar"
const IOS_TAB_BUTTONS =
  "-ios class chain:**/XCUIElementTypeTabBar/**/XCUIElementTypeButton[`visible == 1`]"

/**
 * La barra de pestañas es NativeTabs de expo-router: UITabBar en iOS y
 * BottomNavigationView en Android, o sea elementos nativos, no vistas de RN.
 */
class TabBar {
  /**
   * La ficha del instrumento (`/instrument/[id]`) vive en el stack RAÍZ, fuera
   * de las tabs: mientras esté arriba no hay barra de pestañas a la que tocar.
   */
  private async ensureVisible() {
    if (await isVisible(tabSelector(NAV.tabMarkets), 1_500)) {
      return
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (driver.isAndroid) {
        await driver.back()
      } else if (await isVisible(byText(NAV.backToMarkets), 800)) {
        await (await $(byText(NAV.backToMarkets))).click()
      } else if (await isVisible(byText(NAV.backToPortfolio), 800)) {
        await (await $(byText(NAV.backToPortfolio))).click()
      } else {
        break
      }

      await browser.pause(700)

      if (await isVisible(tabSelector(NAV.tabMarkets), 1_500)) {
        return
      }
    }

    throw new Error(
      "No pude volver a una pantalla con barra de pestañas. " +
        "¿Quedó el ticket abierto tapándola?"
    )
  }

  /**
   * En iOS se toca por GEOMETRÍA de la barra, no por selector del botón.
   *
   * Los botones de la tab bar de iOS resultaron imposibles de matchear de forma
   * confiable: "Órdenes" está en el árbol, visible, con ese name exacto, y no
   * lo agarra ni `==`, ni `==[cd]`, ni `CONTAINS[cd]` sobre el fragmento sin
   * acento, ni un class chain por índice. Lo que XCUITest sí reporta sin
   * ambigüedad es el frame de la TabBar.
   *
   * Las coordenadas NO salen de una captura: salen del elemento TabBar que
   * devuelve el árbol, dividido en tantas partes como pestañas declara el
   * layout de la app.
   */
  private async tapByGeometry(tab: TabName) {
    const bar = await waitForVisible(IOS_TAB_BAR, {
      message: "No encontré la barra de pestañas de iOS.",
    })

    const [{x, y}, {width, height}] = await Promise.all([
      bar.getLocation(),
      bar.getSize(),
    ])

    const index = TAB_ORDER.indexOf(tab)

    if (index < 0) {
      throw new Error(`Pestaña desconocida: "${tab}".`)
    }

    const slot = width / TAB_ORDER.length

    await driver
      .action("pointer", {parameters: {pointerType: "touch"}})
      .move({
        duration: 0,
        x: Math.round(x + slot * (index + 0.5)),
        y: Math.round(y + Math.min(height / 2, 26)),
      })
      .down()
      .pause(80)
      .up()
      .perform()

    await browser.pause(900)
  }

  /**
   * La app declara `minimizeBehavior="onScrollDown"` (src/app/(tabs)/_layout.tsx):
   * en iOS 26 la barra se COLAPSA a dos círculos (la pestaña activa y Buscar) en
   * cuanto una lista scrollea hacia abajo. Con la barra colapsada, dividir su
   * ancho en cuatro partes iguales (`tapByGeometry`) cae sobre una fila de la
   * lista: se abría la ficha de un instrumento en vez de cambiar de pestaña.
   *
   * Colapsada = hay menos de cuatro botones visibles. Se expande tocando el
   * círculo de la pestaña activa, como haría una persona. NO se expande
   * scrolleando hacia arriba: eso mueve la lista de la pestaña que se está
   * dejando, y COCOS-34 verifica justamente que esa posición se conserve.
   */
  /** Sólo iOS 26: la barra minimizada muestra menos de cuatro botones. */
  async isCollapsed() {
    if (!driver.isIOS) {
      return false
    }

    const buttons = await $$(IOS_TAB_BUTTONS).getElements()

    return buttons.length < TAB_ORDER.length
  }

  private async expandIfCollapsed() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const buttons = await $$(IOS_TAB_BUTTONS).getElements()

      if (buttons.length >= TAB_ORDER.length) {
        return
      }

      // El primer círculo es la pestaña activa; el segundo, Buscar.
      await buttons[0]?.click()
      await browser.pause(800)
    }
  }

  async open(tab: TabName) {
    await this.ensureVisible()

    if (driver.isIOS) {
      await this.expandIfCollapsed()
      await this.tapByGeometry(tab)
      return
    }

    /*
     * Se verifica que la pestaña quedó seleccionada y se reintenta. Justo
     * después de cerrar el ticket y salir de la ficha del instrumento, la
     * pantalla sigue atenuada un instante por el backdrop del sheet que se
     * está cerrando: el clic lo recibe ese backdrop, la barra lo ignora y la
     * app se queda en Mercados. Medido en COCOS-46, dos corridas seguidas.
     */
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const item = await waitForVisible(tabSelector(tab), {
        message: `No encontré la pestaña "${tab}".`,
      })

      await item.click()
      await browser.pause(900)

      if ((await item.getAttribute("selected")) === "true") {
        return
      }

      await browser.pause(600)
    }

    throw new Error(`No pude cambiar a la pestaña "${tab}".`)
  }

  markets = () => this.open(NAV.tabMarkets as TabName)
  portfolio = () => this.open(NAV.tabPortfolio as TabName)
  orders = () => this.open(NAV.tabOrders as TabName)
  search = () => this.open(NAV.tabSearch as TabName)
}

export const tabBar = new TabBar()
