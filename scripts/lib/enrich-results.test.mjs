import {describe, expect, it} from "bun:test"

import {enrichLabels, identityOf} from "./enrich-results.mjs"

const values = (labels, name) =>
  labels.filter(label => label.name === name).map(label => label.value)

/** Etiquetas como las deja scripts/e2e-tiers.mjs: nivel, plataforma y describe. */
const merged = () => [
  {name: "package", value: "e2e.specs.07-market-catalog.e2e.ts"},
  {name: "thread", value: "0-6"},
  {name: "parentSuite", value: "hard"},
  {name: "suite", value: "ios"},
  {name: "subSuite", value: "Panel de mercados"},
  {name: "tag", value: "hard"},
  {name: "tag", value: "ios"},
]

const meta = {
  severity: "major",
  priority: "high",
  behavior: "positive",
  layer: "e2e",
  risks: ["R1", "R2"],
}

describe("identityOf", () => {
  it("lee nivel, plataforma y área de lo que deja e2e-tiers", () => {
    expect(identityOf(merged())).toEqual({
      tier: "hard",
      platform: "ios",
      feature: "Panel de mercados",
    })
  })

  it("prefiere las etiquetas propias una vez enriquecido", () => {
    expect(identityOf(enrichLabels(merged(), meta))).toEqual({
      tier: "hard",
      platform: "ios",
      feature: "Panel de mercados",
    })
  })

  it("devuelve campos vacíos para una corrida suelta", () => {
    const single = [{name: "parentSuite", value: "Panel de mercados"}]

    expect(identityOf(single).tier).toBeUndefined()
    expect(enrichLabels(single, meta)).toEqual(single)
  })
})

describe("enrichLabels", () => {
  const labels = enrichLabels(merged(), meta)

  it("deja una barra por corrida y el área como suite", () => {
    expect(values(labels, "parentSuite")).toEqual(["8 · hard · iOS"])
    expect(values(labels, "suite")).toEqual(["Panel de mercados"])
    expect(values(labels, "story")).toEqual(["8 · hard · iOS"])
    expect(values(labels, "subSuite")).toEqual([])
  })

  it("lleva la severidad de Qase a los niveles de Allure y conserva la exacta", () => {
    expect(values(labels, "severity")).toEqual(["normal"])
    expect(values(labels, "qaseSeverity")).toEqual(["major"])
    expect(
      values(
        enrichLabels(merged(), {...meta, severity: "critical"}),
        "severity"
      )
    ).toEqual(["critical"])
  })

  it("suma los riesgos como tags y conserva lo que no es suyo", () => {
    expect(values(labels, "tag").sort()).toEqual(
      ["R1", "R2", "hard", "ios"].sort()
    )
    expect(values(labels, "package")).toEqual([
      "e2e.specs.07-market-catalog.e2e.ts",
    ])
    expect(values(labels, "thread")).toEqual(["0-6"])
  })

  it("es idempotente", () => {
    const again = enrichLabels(labels, meta)

    expect(again).toEqual(labels)
    expect(enrichLabels(again, meta)).toEqual(labels)
  })

  it("no explota con un caso que no está en Qase", () => {
    const withoutMeta = enrichLabels(merged(), undefined)

    expect(values(withoutMeta, "severity")).toEqual([])
    expect(values(withoutMeta, "parentSuite")).toEqual(["8 · hard · iOS"])
  })
})
