/**
 * Ordena las etiquetas de los resultados de todas las corridas y les suma la
 * metadata de los casos de Qase (e2e/data/qase-cases.json, ver
 * scripts/qase-sync-metadata.mjs) para que el reporte de Allure se pueda leer.
 *
 * Los tests de WDIO sólo llevan suite y tags, así que los gráficos de severidad
 * y de comportamientos salen vacíos o no dicen nada. Acá cada resultado queda
 * con:
 *
 *   parentSuite   la corrida ("1 · off · Android"): el widget Suites muestra una
 *                 barra por corrida y el árbol de Suites arranca por ahí
 *   suite         el área funcional (el bloque describe del spec)
 *   feature       el área funcional
 *   story         la corrida: en Behaviors, cada área se abre por corrida
 *   severity      severidad de Qase llevada a los cinco niveles de Allure
 *   qaseSeverity  la severidad exacta de Qase (Allure no tiene "major")
 *   priority, behavior, layer
 *   bugTier, platform   identidad de la corrida (off|easy|medium|hard, android|ios)
 *   tag           el nivel, la plataforma y los riesgos (R1, R2...) del caso
 *
 * Es idempotente: primero borra lo que él mismo agrega, así que se puede correr
 * sobre resultados ya enriquecidos. Lo que scripts/e2e-tiers.mjs deja en
 * parentSuite, suite y subSuite (nivel, plataforma y describe) se lee una sola
 * vez, la primera, y desde entonces la identidad vive en bugTier, platform y
 * feature.
 */
import {readdirSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

import {PLATFORMS, runName, TIERS} from "./tiers.mjs"

/**
 * Allure conoce cinco niveles (blocker, critical, normal, minor, trivial) y
 * Qase seis. "major" se lleva a "normal" para que "critical" quede reservado a
 * lo que en Qase es realmente crítico; el valor exacto va en qaseSeverity.
 */
const ALLURE_SEVERITY = {
  blocker: "blocker",
  critical: "critical",
  major: "normal",
  normal: "normal",
  minor: "minor",
  trivial: "trivial",
}

const OWNED_LABELS = [
  "severity",
  "qaseSeverity",
  "priority",
  "behavior",
  "layer",
  "epic", // ya no se agrega: con epic, Features by stories colapsa en un solo ítem
  "feature",
  "story",
  "bugTier",
  "platform",
]

const labelValue = (labels, name) =>
  labels.find(label => label.name === name)?.value

/** Id del caso de Qase de un resultado: "... (Qase ID: 7)" o "COCOS-7 · ...". */
export const qaseIdOf = result => {
  const match =
    /\(Qase ID: (\d+)\)/.exec(result.name ?? "") ??
    /^COCOS-(\d+)/.exec(result.name ?? "")

  return match ? Number(match[1]) : null
}

/**
 * Nivel, plataforma y área funcional de un resultado. Los lee de las etiquetas
 * que deja este mismo módulo y, si todavía no pasó por acá, de las que deja
 * scripts/e2e-tiers.mjs. Sin nivel y plataforma (una corrida suelta) devuelve
 * campos vacíos.
 */
export const identityOf = labels => {
  const known = {
    tier: labelValue(labels, "bugTier"),
    platform: labelValue(labels, "platform"),
    feature: labelValue(labels, "feature"),
  }

  if (TIERS.includes(known.tier) && PLATFORMS.includes(known.platform)) {
    return known
  }

  const tier = labelValue(labels, "parentSuite")
  const platform = labelValue(labels, "suite")

  return {
    tier: TIERS.includes(tier) ? tier : undefined,
    platform: PLATFORMS.includes(platform) ? platform : undefined,
    feature: labelValue(labels, "subSuite"),
  }
}

/** Etiquetas de un resultado ordenadas y con la metadata de Qase (función pura). */
export const enrichLabels = (labels, meta) => {
  const {tier, platform, feature} = identityOf(labels)

  if (!tier || !platform) {
    return labels
  }

  const run = runName(tier, platform)
  const kept = labels.filter(
    label =>
      !OWNED_LABELS.includes(label.name) &&
      !["parentSuite", "suite", "subSuite"].includes(label.name) &&
      // Los tags de nivel, plataforma y riesgo los agrega este módulo.
      !(
        label.name === "tag" &&
        ([tier, platform].includes(label.value) || /^R\d+$/.test(label.value))
      )
  )

  const added = [
    {name: "parentSuite", value: run},
    feature && {name: "suite", value: feature},
    feature && {name: "feature", value: feature},
    {name: "story", value: run},
    {name: "bugTier", value: tier},
    {name: "platform", value: platform},
    {name: "tag", value: tier},
    {name: "tag", value: platform},
  ]

  if (meta) {
    added.push(
      meta.layer && {name: "layer", value: meta.layer},
      meta.severity && {
        name: "severity",
        value: ALLURE_SEVERITY[meta.severity],
      },
      meta.severity && {name: "qaseSeverity", value: meta.severity},
      meta.priority && {name: "priority", value: meta.priority},
      meta.behavior && {name: "behavior", value: meta.behavior},
      ...(meta.risks ?? []).map(risk => ({name: "tag", value: risk}))
    )
  }

  return [...kept, ...added.filter(Boolean)]
}

/**
 * Reescribe in situ los *-result.json de un directorio de Allure. Devuelve
 * cuántos resultados tocó y cuáles no encontraron su caso en Qase.
 */
export const enrichDirectory = (directory, cases) => {
  let touched = 0
  const missing = new Set()

  for (const file of readdirSync(directory)) {
    if (!file.endsWith("-result.json")) {
      continue
    }

    const path = resolve(directory, file)
    const result = JSON.parse(readFileSync(path, "utf8"))
    const id = qaseIdOf(result)
    const meta = id === null ? undefined : cases[id]

    if (id !== null && !meta) {
      missing.add(id)
    }

    const labels = enrichLabels(result.labels ?? [], meta)

    if (JSON.stringify(labels) !== JSON.stringify(result.labels)) {
      result.labels = labels
      writeFileSync(path, JSON.stringify(result))
      touched += 1
    }
  }

  return {touched, missing: [...missing].sort((a, b) => a - b)}
}
