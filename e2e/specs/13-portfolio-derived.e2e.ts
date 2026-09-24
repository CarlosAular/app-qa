import {qase} from "wdio-qase-reporter"

import {captureAccount, holdingOf, seedPosition} from "../api/snapshot"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {positionDetailScreen} from "../screens/PositionDetailScreen"
import {expectSameMoney} from "../support/money"
import {readTextNodes} from "../support/pageMap"
import {step} from "../support/steps"

const instrument = CASE_INSTRUMENT.portfolioReadOnly

/** "$ 0,00" o "+$ 0,00" o "-$ 0,00": el texto COMPLETO del nodo, sin espurios. */
const ZERO_GAIN_PATTERN = /^[+-]?\$\s*0,00$/

describe("Portafolio derivado de las órdenes", () => {
  before(async () => {
    // Posición compartida por los tres casos de este archivo: son de solo
    // lectura, así que no hace falta un instrumento distinto para cada uno.
    await seedPosition(instrument.id, instrument.ticker, 6)
  })

  it(
    qase(
      11,
      "COCOS-11 · El efectivo y las posiciones reflejan las órdenes ya ejecutadas"
    ),
    async () => {
      const snapshot = await captureAccount()
      const holding = holdingOf(snapshot, instrument.ticker)

      if (!holding) {
        throw new Error(
          `La siembra de la posición de ${instrument.ticker} no dejó tenencia en el servicio.`
        )
      }

      await step("El Portafolio muestra el efectivo del servicio", async () => {
        await tabBar.portfolio()
        await portfolioScreen.waitUntilLoaded()
        await portfolioScreen.refresh()

        expectSameMoney(
          await portfolioScreen.readCash(),
          snapshot.cash,
          "El efectivo"
        )
      })

      await step(
        `La posición de ${instrument.ticker} refleja la tenencia del servicio`,
        async () => {
          expect(await portfolioScreen.hasPosition(instrument.ticker)).toBe(
            true
          )
          expect(
            await portfolioScreen.readPositionQuantity(instrument.ticker)
          ).toBe(holding.quantity)

          expectSameMoney(
            await portfolioScreen.readPositionMarketValue(instrument.ticker),
            holding.quantity * holding.last_price,
            `El valor de mercado de ${instrument.ticker}`
          )
        }
      )
    }
  )

  it(
    qase(
      12,
      "COCOS-12 · El detalle de una posición muestra los precios de referencia y el resultado"
    ),
    async () => {
      const snapshot = await captureAccount()
      const holding = holdingOf(snapshot, instrument.ticker)

      if (!holding) {
        throw new Error(
          `No hay tenencia de ${instrument.ticker} en el servicio.`
        )
      }

      await step("Abrir el detalle de la posición", async () => {
        await tabBar.portfolio()
        await portfolioScreen.waitUntilLoaded()
        await portfolioScreen.refresh()
        await portfolioScreen.openPosition(instrument.ticker)
        await positionDetailScreen.waitUntilLoaded()
      })

      await step(
        "Cantidad, PPP, costo y valor coinciden con el servicio",
        async () => {
          expect(await positionDetailScreen.readQuantity()).toBe(
            holding.quantity
          )

          expectSameMoney(
            await positionDetailScreen.readAveragePrice(),
            holding.avg_cost_price,
            "El PPP"
          )

          expectSameMoney(
            await positionDetailScreen.readCost(),
            holding.avg_cost_price * holding.quantity,
            "El costo invertido"
          )

          expectSameMoney(
            await positionDetailScreen.readMarketValue(),
            holding.quantity * holding.last_price,
            "El valor de mercado"
          )
        }
      )
    }
  )

  it(
    qase(
      30,
      "COCOS-30 · La ganancia y el rendimiento llevan el signo correcto"
    ),
    async () => {
      await step("Abrir el detalle de la posición", async () => {
        await tabBar.portfolio()
        await portfolioScreen.waitUntilLoaded()
        await portfolioScreen.refresh()
        await portfolioScreen.openPosition(instrument.ticker)
        await positionDetailScreen.waitUntilLoaded()
      })

      /*
       * La API dummy nunca mueve precios en tier `off`: el PPP siempre
       * termina igual al último precio, así que la ganancia real es SIEMPRE
       * exactamente $0. No se puede ejercitar un signo positivo o negativo de
       * verdad contra este entorno (ver docs/qase.html, sección 4): el caso
       * queda acotado a que el cero no lleve un signo espurio y a que el
       * formato sea el correcto, no a un signo real.
       */
      await step("La ganancia en cero no lleva un signo espurio", async () => {
        const nodes = await readTextNodes()
        const gainNode = nodes.find(node => ZERO_GAIN_PATTERN.test(node.text))

        expect(gainNode).toBeDefined()
      })

      await step(
        "El rendimiento se muestra en formato argentino (coma decimal)",
        async () => {
          const ratioText = await positionDetailScreen.readReturnRatioText()

          expect(ratioText).toContain(",")
          expect(ratioText).not.toContain(".")
        }
      )
    }
  )
})
