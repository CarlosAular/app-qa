import {describe, expect, it} from "bun:test"

import {qaseIdOf} from "./enrich-results.mjs"
import {
  buildInsights,
  categoryOf,
  classifyTest,
  detectionCurve,
  groupTests,
  normalizeMessage,
  toRow,
} from "./insights-model.mjs"
import {PLATFORMS, TIERS} from "./tiers.mjs"

const cell = status => ({status})

/** Celdas de un test a partir de un mapa "nivel:plataforma" -> estado. */
const cellsOf = failing =>
  Object.fromEntries(
    TIERS.map(tier => [
      tier,
      Object.fromEntries(
        PLATFORMS.map(platform => [
          platform,
          cell(failing.includes(`${tier}:${platform}`) ? "failed" : "passed"),
        ])
      ),
    ])
  )

const result = ({
  id,
  tier,
  platform,
  status,
  message,
  start = 0,
  stop = 1000,
}) => ({
  name: `COCOS-${id} · Caso ${id} (Qase ID: ${id})`,
  status,
  start,
  stop,
  statusDetails: message ? {message} : {},
  labels: [
    {name: "parentSuite", value: tier},
    {name: "suite", value: platform},
    {name: "subSuite", value: "Área"},
    {name: "package", value: "e2e.specs.01-market-buy.e2e.ts"},
  ],
})

describe("classifyTest", () => {
  it("marca como estable un test que pasa en todo", () => {
    expect(classifyTest(cellsOf([])).kind).toBe("estable")
  })

  it("marca como ruido un test que falla en off en las dos plataformas", () => {
    const all = TIERS.flatMap(tier => PLATFORMS.map(p => `${tier}:${p}`))

    expect(classifyTest(cellsOf(all)).kind).toBe("ruido")
    expect(classifyTest(cellsOf(["off:android", "off:ios"])).kind).toBe("ruido")
  })

  it("detecta un test que pasa en off y falla desde un nivel en adelante", () => {
    const verdict = classifyTest(
      cellsOf(["medium:android", "medium:ios", "hard:android", "hard:ios"])
    )

    expect(verdict).toEqual({
      kind: "detecta",
      firstTier: "medium",
      platforms: ["android", "ios"],
    })
  })

  it("acepta que sólo una plataforma detecte", () => {
    expect(classifyTest(cellsOf(["hard:android"]))).toEqual({
      kind: "detecta",
      firstTier: "hard",
      platforms: ["android"],
    })
  })

  it("marca como inestable un fallo en off en una sola plataforma", () => {
    expect(classifyTest(cellsOf(["off:ios"])).kind).toBe("inestable")
  })

  it("marca como inestable un fallo que no persiste en los niveles superiores", () => {
    expect(classifyTest(cellsOf(["easy:ios", "hard:android"])).kind).toBe(
      "inestable"
    )
    expect(classifyTest(cellsOf(["easy:android"])).kind).toBe("inestable")
  })
})

describe("categoryOf y normalizeMessage", () => {
  it("clasifica por mensaje y no por estado", () => {
    expect(
      categoryOf({
        status: "broken",
        message: "El precio de MIRG: esperaba $ 40,88 y obtuve $ 0,00",
      })
    ).toBe("Importes o precios que no coinciden")
    expect(
      categoryOf({
        status: "broken",
        message: "Se crearon 1 orden(es) que no debían existir: #1 BUY 1",
      })
    ).toBe("Se crearon órdenes de más")
    expect(
      categoryOf({status: "failed", message: "expect(received).toBe(expected)"})
    ).toBe("Aserción sin mensaje (mejorar el test)")
    expect(categoryOf({status: "broken", message: "algo raro"})).toBe(
      "Otros fallos"
    )
  })

  it("agrupa mensajes que sólo difieren en números", () => {
    const a = normalizeMessage(
      "El precio de ejecución: esperaba $ 74,68 y obtuve $ 67,31 (diferencia -$ 7,37)"
    )
    const b = normalizeMessage(
      "El precio de ejecución: esperaba $ 45,72 y obtuve $ 50,07 (diferencia $ 4,35)"
    )

    expect(a).toBe(b)
    expect(normalizeMessage("")).toBe("(sin mensaje)")
  })
})

describe("buildInsights", () => {
  const cases = {
    1: {severity: "critical", risks: ["R1"]},
    2: {severity: "major", risks: ["R2"]},
    3: {severity: "minor", risks: ["R2", "R3"]},
    4: {severity: "normal", risks: ["R9"]},
  }

  const results = TIERS.flatMap(tier =>
    PLATFORMS.flatMap(platform => [
      // 1: falla siempre (ruido).
      result({
        id: 1,
        tier,
        platform,
        status: "failed",
        message: "expect(received).toBe(expected)",
      }),
      // 2: detecta desde hard.
      result({
        id: 2,
        tier,
        platform,
        status: tier === "hard" ? "broken" : "passed",
        message:
          tier === "hard"
            ? "Se crearon 1 orden(es) que no debían existir: #1 BUY 1"
            : "",
      }),
      // 3: estable.
      result({id: 3, tier, platform, status: "passed"}),
    ])
  )

  const insights = buildInsights(results, cases)

  it("ubica cada resultado en la matriz y clasifica los tests", () => {
    expect(insights.rows).toHaveLength(24)
    expect(insights.tests.map(test => [test.id, test.verdict.kind])).toEqual([
      [1, "ruido"],
      [2, "detecta"],
      [3, "estable"],
    ])
  })

  it("resta el ruido de la línea base en la curva de detección", () => {
    expect(insights.curve.map(point => point.byPlatform.android)).toEqual([
      0, 0, 0, 1,
    ])
    expect(insights.curve.find(point => point.tier === "hard").caught).toBe(1)
  })

  it("agrupa los fallos por categoría", () => {
    expect(
      insights.clusters.map(group => [group.category, group.count])
    ).toEqual([
      ["Aserción sin mensaje (mejorar el test)", 8],
      ["Se crearon órdenes de más", 2],
    ])
  })

  it("cruza los riesgos con lo que corrió en la UI", () => {
    const r2 = insights.risks.find(entry => entry.risk === "R2")
    const r9 = insights.risks.find(entry => entry.risk === "R9")

    expect(r2).toMatchObject({cases: 2, ui: 2, detecta: 1, estable: 1})
    expect(r9).toMatchObject({cases: 1, ui: 0})
  })

  it("mide el costo del ruido y propone prioridades", () => {
    expect(insights.time.noiseShare).toBeCloseTo(1 / 3)
    expect(insights.priorities[0].title).toContain("línea base")
    expect(
      insights.priorities.some(item => item.title.includes("críticos"))
    ).toBe(true)
  })

  it("no explota con un test que no está en Qase", () => {
    const row = toRow(
      result({id: 99, tier: "off", platform: "ios", status: "passed"}),
      {}
    )

    expect(row.severity).toBeNull()
    expect(groupTests([row])[0].verdict.kind).toBe("estable")
    expect(detectionCurve([row], groupTests([row]))).toHaveLength(4)
  })
})

describe("qaseIdOf", () => {
  it("lee el id del nombre del test", () => {
    expect(qaseIdOf({name: "COCOS-7 · Algo (Qase ID: 7)"})).toBe(7)
    expect(qaseIdOf({name: "COCOS-12 · Sin sufijo"})).toBe(12)
    expect(qaseIdOf({name: "Otro test"})).toBeNull()
  })
})
