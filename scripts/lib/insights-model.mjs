/**
 * Modelo de la página de insights: funciones puras sobre las filas de todas las
 * corridas (un test x un nivel x una plataforma). Sin acceso a disco, para
 * poder probarlas con `bun test`. El HTML lo arma insights-html.mjs.
 *
 * Idea central: el nivel `off` es la LÍNEA BASE (la API sin defectos). Un test
 * que falla ahí no está detectando nada, es ruido; un test que pasa en `off` y
 * falla en un nivel superior es una DETECCIÓN real de ese nivel.
 */

import {identityOf, qaseIdOf} from "./enrich-results.mjs"
import {categoryOfMessage} from "./failure-categories.mjs"
import {PLATFORMS, TIERS} from "./tiers.mjs"

const FAILING = ["failed", "broken"]

export const isFailing = row => FAILING.includes(row.status)

const labelValue = (labels, name) =>
  labels.find(label => label.name === name)?.value

/** Un resultado de Allure ya mergeado -> una fila del modelo. */
export const toRow = (result, cases = {}) => {
  const labels = result.labels ?? []
  const {tier, platform, feature} = identityOf(labels)
  const id = qaseIdOf(result)
  const meta = id === null ? undefined : cases[id]

  return {
    id,
    tier,
    platform,
    name: (result.name ?? "").replace(/\s*\(Qase ID: \d+\)$/, ""),
    spec: (labelValue(labels, "package") ?? "")
      .replace(/^e2e\.specs\./, "")
      .replace(/\.e2e\.ts$/, ""),
    feature: feature ?? "",
    status: result.status,
    durationMs: Math.max(0, (result.stop ?? 0) - (result.start ?? 0)),
    message: (result.statusDetails?.message ?? "").split("\n")[0],
    severity: meta?.severity ?? null,
    priority: meta?.priority ?? null,
    risks: meta?.risks ?? [],
    smoke: /@smoke/.test(result.name ?? ""),
  }
}

/** Sólo las filas que se pueden ubicar en la matriz (id, nivel y plataforma). */
export const toRows = (results, cases) =>
  results
    .map(result => toRow(result, cases))
    .filter(row => row.id !== null && row.tier && row.platform)

/** Nivel más bajo desde el cual el conjunto de niveles falla hasta el final. */
const isSuffixOfTiers = failingTiers => {
  const indexes = failingTiers.map(tier => TIERS.indexOf(tier)).sort()

  return (
    indexes.length > 0 &&
    indexes.every((index, at) => index === TIERS.length - indexes.length + at)
  )
}

/**
 * Clasifica un test mirando sus 8 celdas.
 *
 *   ruido      falla en `off` en todas las plataformas: no discrimina nada
 *   inestable  falla en `off` en alguna plataforma, o sus fallos no persisten
 *              en los niveles superiores (dan distinto según nivel/plataforma)
 *   detecta    pasa en `off` y falla desde un nivel en adelante: señal real
 *   estable    pasa en todo
 */
export const classifyTest = cells => {
  const failingTiersOf = platform =>
    TIERS.filter(tier => {
      const cell = cells[tier]?.[platform]

      return cell && isFailing(cell)
    })

  const platforms = PLATFORMS.filter(platform =>
    TIERS.some(tier => cells[tier]?.[platform])
  )
  const offFailing = platforms.filter(platform =>
    failingTiersOf(platform).includes("off")
  )

  if (offFailing.length > 0 && offFailing.length === platforms.length) {
    return {kind: "ruido"}
  }

  if (offFailing.length > 0) {
    return {kind: "inestable", reason: "falla en off en una sola plataforma"}
  }

  const failingByPlatform = Object.fromEntries(
    platforms.map(platform => [platform, failingTiersOf(platform)])
  )
  const failing = platforms.filter(
    platform => failingByPlatform[platform].length > 0
  )

  if (failing.length === 0) {
    return {kind: "estable"}
  }

  if (failing.every(platform => isSuffixOfTiers(failingByPlatform[platform]))) {
    const firstTier = TIERS.find(tier =>
      failing.some(platform => failingByPlatform[platform].includes(tier))
    )

    return {kind: "detecta", firstTier, platforms: failing}
  }

  return {
    kind: "inestable",
    reason: "los fallos no persisten en los niveles superiores",
  }
}

/** Agrupa las filas por test: { id: { info, cells: { tier: { platform: row } } } }. */
export const groupTests = rows => {
  const tests = new Map()

  for (const row of rows) {
    const test =
      tests.get(row.id) ??
      tests
        .set(row.id, {
          id: row.id,
          name: row.name,
          spec: row.spec,
          feature: row.feature,
          severity: row.severity,
          priority: row.priority,
          risks: row.risks,
          smoke: row.smoke,
          cells: {},
        })
        .get(row.id)

    test.cells[row.tier] ??= {}
    test.cells[row.tier][row.platform] = row
  }

  return [...tests.values()]
    .map(test => ({...test, verdict: classifyTest(test.cells)}))
    .sort((a, b) => a.id - b.id)
}

/** Cantidad de tests y porcentaje de éxito por combinación nivel x plataforma. */
export const runSummary = rows =>
  TIERS.flatMap(tier =>
    PLATFORMS.map(platform => {
      const cells = rows.filter(
        row => row.tier === tier && row.platform === platform
      )
      const failed = cells.filter(isFailing).length

      return {
        tier,
        platform,
        total: cells.length,
        passed: cells.length - failed,
        failed,
        passRate: cells.length ? (cells.length - failed) / cells.length : 0,
      }
    })
  )

/**
 * Curva de detección: fallos por nivel restando el ruido de la línea base (los
 * tests que fallan en todo). Si los niveles están bien ordenados por dificultad,
 * sube de `off` a `hard`. `caught` son los tests que ese nivel atrapa por
 * primera vez.
 */
export const detectionCurve = (rows, tests) => {
  const noise = new Set(
    tests.filter(test => test.verdict.kind === "ruido").map(test => test.id)
  )

  return TIERS.map(tier => ({
    tier,
    byPlatform: Object.fromEntries(
      PLATFORMS.map(platform => [
        platform,
        rows.filter(
          row =>
            row.tier === tier &&
            row.platform === platform &&
            isFailing(row) &&
            !noise.has(row.id)
        ).length,
      ])
    ),
    caught: tests.filter(
      test => test.verdict.kind === "detecta" && test.verdict.firstTier === tier
    ).length,
  }))
}

/** Categoría de un fallo, con las mismas reglas que el reporte de Allure. */
export const categoryOf = row => categoryOfMessage(row.message)

/** Mensaje sin números, importes ni ids de orden, para agrupar fallos parecidos. */
export const normalizeMessage = message =>
  message
    .replace(/\(diferencia[^)]*\)/, "(diferencia $N)")
    .replace(/\(antes[^)]*\)/, "(antes $N, después $N)")
    .replace(/\$ ?-?[\d.,]+/g, "$N")
    .replace(/#\d+/g, "#N")
    .replace(/\d+/g, "N")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150) || "(sin mensaje)"

/** Fallos agrupados por categoría y, dentro, por mensaje normalizado. */
export const failureClusters = rows => {
  const byCategory = new Map()

  for (const row of rows.filter(isFailing)) {
    const category = categoryOf(row)
    const clusters = byCategory.get(category) ?? new Map()
    const key = normalizeMessage(row.message)
    const cluster = clusters.get(key) ?? {
      message: key,
      count: 0,
      ids: new Set(),
      tiers: new Set(),
    }

    cluster.count += 1
    cluster.ids.add(row.id)
    cluster.tiers.add(row.tier)
    clusters.set(key, cluster)
    byCategory.set(category, clusters)
  }

  return [...byCategory.entries()]
    .map(([category, clusters]) => {
      const list = [...clusters.values()]
        .map(cluster => ({
          message: cluster.message,
          count: cluster.count,
          ids: [...cluster.ids].sort((a, b) => a - b),
          tiers: TIERS.filter(tier => cluster.tiers.has(tier)),
        }))
        .sort((a, b) => b.count - a.count)

      return {
        category,
        count: list.reduce((sum, cluster) => sum + cluster.count, 0),
        clusters: list,
      }
    })
    .sort((a, b) => b.count - a.count)
}

/**
 * Tests que dan distinto en android y en ios dentro del mismo nivel: son
 * candidatos a flaky o a un problema propio de una plataforma.
 */
export const platformMismatches = tests =>
  tests
    .map(test => ({
      id: test.id,
      name: test.name,
      kind: test.verdict.kind,
      tiers: TIERS.filter(tier => {
        const {android, ios} = test.cells[tier] ?? {}

        return android && ios && isFailing(android) !== isFailing(ios)
      }),
    }))
    .filter(entry => entry.tiers.length > 0)

/**
 * Cobertura por riesgo del plan de pruebas (riesgo:R<n> en Qase): cuántos casos
 * lo cubren en total, cuántos corrieron en la suite de UI y qué veredicto tuvo
 * cada uno. Un riesgo sin ningún test de UI queda cubierto sólo por API o a mano.
 */
export const riskCoverage = (tests, cases) => {
  const risks = new Map()
  const entry = risk =>
    risks.get(risk) ??
    risks
      .set(risk, {
        risk,
        cases: 0,
        ui: 0,
        detecta: 0,
        estable: 0,
        ruido: 0,
        inestable: 0,
      })
      .get(risk)

  for (const meta of Object.values(cases)) {
    for (const risk of meta.risks) {
      entry(risk).cases += 1
    }
  }

  for (const test of tests) {
    for (const risk of test.risks) {
      const current = entry(risk)

      current.ui += 1
      current[test.verdict.kind] += 1
    }
  }

  return [...risks.values()].sort(
    (a, b) => Number(a.risk.slice(1)) - Number(b.risk.slice(1))
  )
}

const percentile = (sorted, p) =>
  sorted.length === 0
    ? 0
    : sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]

/** Tiempos: por plataforma, los más lentos y lo que cuesta el ruido. */
export const timing = (rows, tests) => {
  const noise = new Set(
    tests.filter(test => test.verdict.kind === "ruido").map(test => test.id)
  )
  const total = rows.reduce((sum, row) => sum + row.durationMs, 0)
  const noiseMs = rows
    .filter(row => noise.has(row.id))
    .reduce((sum, row) => sum + row.durationMs, 0)

  return {
    totalMs: total,
    noiseMs,
    noiseShare: total ? noiseMs / total : 0,
    byPlatform: PLATFORMS.map(platform => {
      const durations = rows
        .filter(row => row.platform === platform)
        .map(row => row.durationMs)
        .sort((a, b) => a - b)

      return {
        platform,
        totalMs: durations.reduce((sum, ms) => sum + ms, 0),
        p50Ms: percentile(durations, 0.5),
        p95Ms: percentile(durations, 0.95),
      }
    }),
    slowest: [...rows]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10)
      .map(({id, name, platform, tier, durationMs}) => ({
        id,
        name,
        platform,
        tier,
        durationMs,
      })),
  }
}

const list = ids => ids.map(id => `COCOS-${id}`).join(", ")
const minutes = ms => Math.round(ms / 60_000)

/** "Qué mirar primero": entre 3 y 6 acciones que salen de las reglas de arriba. */
export const priorities = ({tests, curve, clusters, time, risks}) => {
  const items = []
  const of = kind => tests.filter(test => test.verdict.kind === kind)
  const noise = of("ruido")
  const unstable = of("inestable")
  const detecting = of("detecta")

  if (noise.length > 0) {
    items.push({
      title: `Fallos constantes en la línea base: ${noise.length}`,
      detail:
        `${list(noise.map(test => test.id))} fallan en \`off\` y en todos ` +
        `los niveles: la falla no depende de ningún nivel de bugs, así que ` +
        `no dicen nada sobre ellos y conviene leerlos aparte. Se llevan ` +
        `${minutes(time.noiseMs)} min de corrida ` +
        `(${Math.round(time.noiseShare * 100)}%).`,
    })
  }

  const criticalNoise = noise.filter(test => test.severity === "critical")

  if (criticalNoise.length > 0) {
    items.push({
      title: `Casos críticos entre ese ruido: ${criticalNoise.length}`,
      detail:
        `${list(criticalNoise.map(test => test.id))}: un caso crítico que ` +
        "siempre falla deja sin verificar esa funcionalidad.",
    })
  }

  if (unstable.length > 0) {
    items.push({
      title: `Casos con resultado inconsistente: ${unstable.length}`,
      detail:
        `${list(unstable.map(test => test.id))}: cambian según la plataforma ` +
        "o no persisten en los niveles superiores. Son candidatos a flaky; " +
        "conviene repetirlos antes de sacar conclusiones.",
    })
  }

  if (detecting.length > 0) {
    const perTier = curve
      .filter(point => point.tier !== "off")
      .map(point => `${point.tier}: ${point.caught}`)
      .join(", ")
    const silent = curve.filter(
      point => point.tier !== "off" && point.caught === 0
    )

    items.push({
      title: `Casos que detectan defectos de la API: ${detecting.length}`,
      detail:
        `Primer nivel que los atrapa, ${perTier}.` +
        (silent.length > 0
          ? ` ${silent.map(point => point.tier).join(" y ")} no suma detecciones nuevas sobre el nivel anterior.`
          : ""),
    })
  }

  if (clusters.length > 0) {
    const top = clusters[0]

    items.push({
      title: `El fallo más común: ${top.category.toLowerCase()}`,
      detail: `${top.count} de los fallos caen ahí; el mensaje más repetido es «${top.clusters[0].message}».`,
    })
  }

  const withoutUi = risks.filter(risk => risk.cases > 0 && risk.ui === 0)

  if (withoutUi.length > 0) {
    items.push({
      title: `Riesgos sin ningún test de UI: ${withoutUi.length}`,
      detail: `${withoutUi.map(risk => risk.risk).join(", ")}: sólo quedan cubiertos por casos manuales o de API.`,
    })
  }

  const [android, ios] = ["android", "ios"].map(platform =>
    time.byPlatform.find(entry => entry.platform === platform)
  )

  if (
    android &&
    ios &&
    android.totalMs > 0 &&
    ios.totalMs / android.totalMs > 1.5
  ) {
    items.push({
      title: `iOS tarda ${(ios.totalMs / android.totalMs).toFixed(1)}x lo que Android`,
      detail: `${minutes(ios.totalMs)} min contra ${minutes(android.totalMs)} min en las mismas pruebas.`,
    })
  }

  return items.slice(0, 6)
}

/** Todo junto: lo que necesita la página. */
export const buildInsights = (results, cases = {}) => {
  const rows = toRows(results, cases)
  const tests = groupTests(rows)
  const curve = detectionCurve(rows, tests)
  const clusters = failureClusters(rows)
  const time = timing(rows, tests)
  const risks = riskCoverage(tests, cases)

  return {
    rows,
    tests,
    summary: runSummary(rows),
    curve,
    clusters,
    mismatches: platformMismatches(tests),
    risks,
    time,
    priorities: priorities({tests, curve, clusters, time, risks}),
  }
}
