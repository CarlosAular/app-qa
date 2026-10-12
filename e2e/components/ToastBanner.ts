import {byText, byTextContains} from "../support/selectors"
import {isVisible} from "../support/waits"

/**
 * Toasts de sonner-native (position top-center, 6s de duración).
 *
 * Defectos conocidos que hacen que NO se pueda depender de esto como oráculo:
 *   - En Android el toast "Orden ejecutada" nunca aparece.
 *   - En iOS un rechazo del servicio no mostraba nada (defecto #19). El
 *     12/10/2026 no se reprodujo: el aviso aparece. Afirmarlo queda pendiente.
 *
 * Por eso la suite confirma contra el historial y el estado, y sólo consulta el
 * toast donde la plataforma sí lo muestra.
 */
class ToastBanner {
  async isShowing(title: string, timeout = 6_000) {
    return isVisible(byText(title), timeout)
  }

  async isShowingContaining(fragment: string, timeout = 6_000) {
    return isVisible(byTextContains(fragment), timeout)
  }
}

export const toastBanner = new ToastBanner()
