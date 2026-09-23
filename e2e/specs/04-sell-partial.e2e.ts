import {qase} from "wdio-qase-reporter"

import {
  captureAccount,
  expectCashDelta,
  expectNoNewOrders,
  quantityOf,
  seedPosition,
} from "../api/snapshot"
import {orderTicket} from "../components/OrderTicket"
import {tabBar} from "../components/TabBar"
import {CASE_INSTRUMENT} from "../data/instruments"
import {
  closeTicketAndRefreshPortfolio,
  openTicketFromPosition,
  openTicketOnCurrentPosition,
  resetUiState,
  submitMarketOrder,
} from "../flows/tradingFlows"
import {portfolioScreen} from "../screens/PortfolioScreen"
import {positionDetailScreen} from "../screens/PositionDetailScreen"
import {estimatedTotal, expectSameMoney} from "../support/money"
import {step} from "../support/steps"

describe("Venta a mercado", () => {
  afterEach(resetUiState)

  it(
    qase(
      25,
      "COCOS-25 · Una venta a mercado reduce la tenencia y aumenta el efectivo"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.sell

      await step("Partir de una posición de al menos 20 acciones", async () => {
        // La precondición se siembra por API: el spec no depende de que otro
        // spec haya corrido antes.
        await seedPosition(instrument.id, instrument.ticker, 20)
      })

      const before = await captureAccount()
      const quantityBefore = quantityOf(before, instrument.ticker)

      const lastPrice = await step(
        "Abrir la ficha de la posición y anotar el último precio",
        async () => {
          const price = await openTicketFromPosition(instrument.ticker)
          expectSameMoney(
            price,
            instrument.lastPrice,
            `El precio de ${instrument.ticker}`
          )
          return price
        }
      )

      const expectedProceeds = estimatedTotal(5, lastPrice)

      await step("Vender 5 acciones a mercado", async () => {
        const {computedQuantity, estimate} = await submitMarketOrder({
          side: "Vender",
          quantity: 5,
        })

        expect(computedQuantity).toBe(5)
        expectSameMoney(estimate!, expectedProceeds, "El estimado de la venta")
      })

      await step(
        "El efectivo subió exactamente en 5 × el precio de ejecución",
        async () => {
          await closeTicketAndRefreshPortfolio()

          const after = await captureAccount()
          expectCashDelta(before, after, expectedProceeds)

          expectSameMoney(
            await portfolioScreen.readCash(),
            after.cash,
            "El efectivo que muestra la UI"
          )
        }
      )

      await step(
        "La posición bajó en 5 acciones y sigue existiendo",
        async () => {
          expect(await portfolioScreen.hasPosition(instrument.ticker)).toBe(
            true
          )
          expect(
            await portfolioScreen.readPositionQuantity(instrument.ticker)
          ).toBe(quantityBefore - 5)
        }
      )

      await step(
        "Vender más acciones de las que quedan se rechaza y no mueve la tenencia",
        async () => {
          const beforeReject = await captureAccount()
          const remaining = quantityOf(beforeReject, instrument.ticker)

          await openTicketFromPosition(instrument.ticker)
          await orderTicket.setSide("Vender")
          await orderTicket.setType("Market")
          await orderTicket.setQuantityMode("Acciones")
          await orderTicket.enterQuantity(remaining + 50)
          await orderTicket.submit()

          /*
           * No se espera feedback visual a propósito.
           *
           * En iOS un rechazo del servicio no muestra absolutamente nada, y en
           * Android el toast tampoco es confiable. El oráculo es el estado: la
           * API devuelve 400 SIN crear orden, así que no existe ninguna orden
           * REJECTED que buscar en el historial.
           */
          await browser.pause(4_000)

          const afterReject = await captureAccount()

          expectNoNewOrders(beforeReject, afterReject)
          expect(quantityOf(afterReject, instrument.ticker)).toBe(remaining)
          expectCashDelta(
            beforeReject,
            afterReject,
            0,
            "El efectivo tras el rechazo"
          )

          await orderTicket.close()
        }
      )
    }
  )

  it(
    qase(
      28,
      "COCOS-28 · Una venta parcial reduce la cantidad y mantiene el precio promedio de compra"
    ),
    async () => {
      const instrument = CASE_INSTRUMENT.partialSell

      await step("Partir de una compra a mercado de 20 acciones", async () => {
        await seedPosition(instrument.id, instrument.ticker, 20)
      })

      const before = await captureAccount()
      const quantityBefore = quantityOf(before, instrument.ticker)

      const {averagePrice, cost} = await step(
        "Anotar cantidad, precio promedio de compra y costo",
        async () => {
          await tabBar.portfolio()
          await portfolioScreen.waitUntilLoaded()
          await portfolioScreen.refresh()
          await portfolioScreen.openPosition(instrument.ticker)
          await positionDetailScreen.waitUntilLoaded()

          const quantity = await positionDetailScreen.readQuantity()
          const ppp = await positionDetailScreen.readAveragePrice()
          const costBasis = await positionDetailScreen.readCost()

          expect(quantity).toBe(quantityBefore)
          expectSameMoney(costBasis, ppp * quantity, "El costo invertido")

          return {averagePrice: ppp, cost: costBasis}
        }
      )

      await step("Vender 8 acciones a mercado desde esa ficha", async () => {
        await openTicketOnCurrentPosition(instrument.ticker)

        const {computedQuantity} = await submitMarketOrder({
          side: "Vender",
          quantity: 8,
        })
        expect(computedQuantity).toBe(8)
      })

      const remaining = quantityBefore - 8

      await step(
        "La posición sigue existiendo, con 8 acciones menos",
        async () => {
          await closeTicketAndRefreshPortfolio()

          expect(await portfolioScreen.hasPosition(instrument.ticker)).toBe(
            true
          )
          expect(
            await portfolioScreen.readPositionQuantity(instrument.ticker)
          ).toBe(remaining)
        }
      )

      await step(
        "El precio promedio de compra NO cambió y el costo bajó en proporción",
        async () => {
          await portfolioScreen.openPosition(instrument.ticker)
          await positionDetailScreen.waitUntilLoaded()

          expect(await positionDetailScreen.readQuantity()).toBe(remaining)

          // El corazón del caso: vender no cambia lo que se pagó por lo que queda.
          expectSameMoney(
            await positionDetailScreen.readAveragePrice(),
            averagePrice,
            "El precio promedio de compra tras la venta parcial"
          )

          expectSameMoney(
            await positionDetailScreen.readCost(),
            averagePrice * remaining,
            "El costo invertido tras la venta parcial"
          )

          expect(averagePrice * remaining).toBeLessThan(cost)
        }
      )

      await step(
        "Vender las acciones restantes hace desaparecer la posición",
        async () => {
          const beforeFinalSale = await captureAccount()
          const positionsBefore = await portfolioScreen
            .readPositionsCount()
            .catch(() => null)

          await openTicketOnCurrentPosition(instrument.ticker)
          await submitMarketOrder({side: "Vender", quantity: remaining})
          await closeTicketAndRefreshPortfolio()

          const after = await captureAccount()

          expect(quantityOf(after, instrument.ticker)).toBe(0)
          expect(await portfolioScreen.hasPosition(instrument.ticker)).toBe(
            false
          )
          expectCashDelta(
            beforeFinalSale,
            after,
            estimatedTotal(remaining, averagePrice)
          )

          /*
           * El caso original dice "el contador vuelve a cero" porque se corría
           * sobre una cuenta recién reiniciada. Acá la cuenta es compartida por
           * toda la corrida, así que el invariante equivalente es que el contador
           * baje EXACTAMENTE en uno.
           */
          if (positionsBefore !== null) {
            await tabBar.portfolio()
            await portfolioScreen.waitUntilLoaded()
            expect(await portfolioScreen.readPositionsCount()).toBe(
              positionsBefore - 1
            )
          }
        }
      )
    }
  )
})
