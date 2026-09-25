/**
 * Renderiza la página de insights a partir de buildInsights() (insights-model.mjs).
 * HTML autocontenido: CSS y SVG en línea, sin JavaScript ni recursos externos,
 * con la misma paleta que docs/*.html.
 */
import {PLATFORMS, TIERS} from "./tiers.mjs"

const esc = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

/** Texto con `código` en línea, ya escapado. */
const rich = text => esc(text).replace(/`([^`]+)`/g, "<code>$1</code>")

const percent = ratio => `${Math.round(ratio * 100)}%`
const minutes = ms => `${Math.round(ms / 60_000)} min`
const seconds = ms => `${Math.round(ms / 1000)} s`

const PLATFORM_LABEL = {android: "Android", ios: "iOS"}
const PLATFORM_SHORT = {android: "A", ios: "i"}

const VERDICTS = [
  {
    kind: "ruido",
    title: "Ruido de la línea base",
    hint: "Fallan en `off` en las dos plataformas: la falla no depende de ningún nivel de bugs y no dice nada sobre ellos.",
    open: true,
  },
  {
    kind: "inestable",
    title: "Inestables",
    hint: "Cambian según la plataforma o no persisten al subir de nivel: candidatos a flaky.",
    open: true,
  },
  {
    kind: "detecta",
    title: "Detectan defectos",
    hint: "Pasan en `off` y fallan desde un nivel en adelante: la señal real de cada nivel.",
    open: true,
  },
  {
    kind: "estable",
    title: "Estables",
    hint: "Pasan en los ocho recorridos.",
    open: false,
  },
]

const SEVERITY_RANK = {
  blocker: 0,
  critical: 1,
  major: 2,
  normal: 3,
  minor: 4,
  trivial: 5,
}

const css = `
:root {
  color-scheme: dark;
  --bg: #020617; --card: #0e1223; --panel: #11182a; --fg: #f8fafc;
  --fg-muted: #9aa7bd; --fg-dim: #64748b; --border: #253149;
  --primary: #2dd4bf; --secondary: #38bdf8;
  --pass: #34d399; --fail: #fb7185; --broken: #f59e0b;
  --sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 var(--sans); }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px 80px; }
.masthead { padding: 48px 0 26px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.eyebrow { font: 11.5px var(--mono); letter-spacing: .18em; text-transform: uppercase; color: var(--primary); margin: 0 0 12px; }
h1 { font-size: clamp(1.9rem, 1.4rem + 2.2vw, 2.8rem); line-height: 1.08; letter-spacing: -.03em; margin: 0 0 12px; text-wrap: balance; }
.standfirst { color: var(--fg-muted); max-width: 70ch; margin: 0 0 14px; }
.meta { font: 12px var(--mono); color: var(--fg-dim); }
h2 { font-size: 1.45rem; letter-spacing: -.02em; margin: 54px 0 6px; }
.lede { color: var(--fg-muted); max-width: 72ch; margin: 0 0 18px; }
code { font: .88em var(--mono); background: var(--panel); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; }
.todo { display: grid; gap: 10px; counter-reset: todo; }
.todo li { list-style: none; counter-increment: todo; display: grid; grid-template-columns: 30px 1fr; gap: 12px; }
.todo ol { margin: 0; padding: 0; display: grid; gap: 10px; }
.todo li::before { content: counter(todo); font: 700 13px var(--mono); color: var(--bg); background: var(--primary); border-radius: 50%; width: 26px; height: 26px; display: grid; place-items: center; margin-top: 2px; }
.todo strong { display: block; }
.todo span { color: var(--fg-muted); font-size: 14px; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.kpi { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.kpi .label { font: 11px var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--fg-dim); }
.kpi .value { font-size: 1.7rem; font-weight: 800; letter-spacing: -.02em; }
.kpi .sub { font-size: 12.5px; color: var(--fg-muted); }
.bar { height: 6px; border-radius: 3px; background: var(--panel); overflow: hidden; margin-top: 8px; display: flex; }
.bar i { display: block; height: 100%; }
.runs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
.run { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.run b { font-size: 1.35rem; letter-spacing: -.02em; }
.run small { display: block; color: var(--fg-muted); font: 12px var(--mono); }
.chip { display: inline-block; font: 600 11px var(--mono); padding: 1px 7px; border-radius: 99px; border: 1px solid var(--border); color: var(--fg-muted); white-space: nowrap; }
.chip.critical { color: var(--fail); border-color: #7f2d3b; }
.chip.major { color: var(--broken); border-color: #6b4a0f; }
.chip.ruido { color: var(--fail); border-color: #7f2d3b; }
.chip.inestable { color: var(--broken); border-color: #6b4a0f; }
.chip.detecta { color: var(--primary); border-color: #1b6f66; }
.chip.estable { color: var(--pass); border-color: #1f6a4d; }
details { background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-top: 12px; }
summary { cursor: pointer; padding: 12px 16px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
summary strong { font-size: 1.02rem; }
summary .n { font: 700 12px var(--mono); color: var(--fg-dim); }
summary .hint { color: var(--fg-muted); font-size: 13px; }
.scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th, td { padding: 6px 10px; text-align: left; border-top: 1px solid var(--border); vertical-align: middle; }
th { font: 600 11px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--fg-dim); white-space: nowrap; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td.name { max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
td.id { font: 12px var(--mono); color: var(--fg-muted); white-space: nowrap; }
.matrix th.tier { text-align: center; border-left: 1px solid var(--border); }
.matrix td.c { width: 30px; text-align: center; padding: 6px 4px; }
.matrix td.c:nth-child(odd) { border-left: 1px solid var(--border); }
.dot { display: inline-block; width: 16px; height: 16px; border-radius: 4px; vertical-align: middle; }
.dot.passed { background: var(--pass); opacity: .85; }
.dot.failed { background: var(--fail); }
.dot.broken { background: var(--broken); }
.dot.none { background: var(--panel); }
.legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12.5px; color: var(--fg-muted); margin: 8px 0 0; }
.legend .dot { width: 12px; height: 12px; margin-right: 5px; }
.split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.stack { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: var(--panel); min-width: 120px; }
.stack i { display: block; }
.note { color: var(--fg-muted); font-size: 13px; margin: 10px 0 0; }
svg text { fill: var(--fg-muted); font: 11px var(--mono); }
svg .val { fill: var(--fg); }
.foot { margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--border); color: var(--fg-dim); font-size: 13px; }
@media (max-width: 820px) { .kpis, .runs { grid-template-columns: repeat(2, 1fr); } .split { grid-template-columns: 1fr; } }
`

const section = (id, title, lede, body) => `
<section id="${id}">
  <h2>${esc(title)}</h2>
  ${lede ? `<p class="lede">${rich(lede)}</p>` : ""}
  ${body}
</section>`

const kpi = (label, value, sub) => `
<div class="kpi"><div class="label">${esc(label)}</div>
<div class="value">${esc(value)}</div><div class="sub">${rich(sub)}</div></div>`

const stack = parts =>
  `<div class="stack">${parts
    .filter(part => part.value > 0)
    .map(
      part =>
        `<i style="width:${part.share * 100}%;background:var(${part.color})" title="${esc(part.title)}"></i>`
    )
    .join("")}</div>`

const priorities = items => `
<div class="card todo"><ol>${items
  .map(
    item =>
      `<li><div><strong>${esc(item.title)}</strong><span>${rich(item.detail)}</span></div></li>`
  )
  .join("")}</ol></div>`

const summary = ({tests, summary: runs}) => {
  const count = kind => tests.filter(test => test.verdict.kind === kind).length
  const total = tests.length

  return `
<div class="kpis">
  ${kpi("Tests", total, `${runs.reduce((sum, run) => sum + run.total, 0)} resultados en ${runs.length} corridas`)}
  ${kpi("Detectan", count("detecta"), "la señal real de los niveles de bugs")}
  ${kpi("Inestables", count("inestable"), "candidatos a flaky")}
  ${kpi("Ruido de base", count("ruido"), "fallan en `off`, no aportan")}
</div>
<div class="runs">${runs
    .map(
      run => `<div class="run">
  <small>${esc(run.tier)} · ${esc(PLATFORM_LABEL[run.platform])}</small>
  <b>${percent(run.passRate)}</b>
  <small>${run.passed} pasan · ${run.failed} fallan</small>
  ${stack([
    {
      value: run.passed,
      share: run.passed / (run.total || 1),
      color: "--pass",
      title: `${run.passed} pasan`,
    },
    {
      value: run.failed,
      share: run.failed / (run.total || 1),
      color: "--fail",
      title: `${run.failed} fallan`,
    },
  ])}
</div>`
    )
    .join("")}</div>`
}

const dot = cell =>
  cell
    ? `<td class="c" title="${esc(`${cell.status}${cell.message ? `: ${cell.message}` : ""}`)}"><span class="dot ${esc(cell.status)}"></span></td>`
    : `<td class="c"><span class="dot none"></span></td>`

const matrixRow = test => `
<tr>
  <td class="id">COCOS-${test.id}</td>
  <td class="name" title="${esc(test.name)}">${esc(test.name.replace(/^COCOS-\d+ · /, ""))}</td>
  <td>${test.severity ? `<span class="chip ${esc(test.severity)}">${esc(test.severity)}</span>` : ""}</td>
  <td>${esc(test.risks.join(" "))}</td>
  <td>${
    test.verdict.kind === "detecta"
      ? `desde <b>${esc(test.verdict.firstTier)}</b>${test.verdict.platforms.length < PLATFORMS.length ? ` · sólo ${esc(PLATFORM_LABEL[test.verdict.platforms[0]])}` : ""}`
      : ""
  }</td>
  ${TIERS.flatMap(tier => PLATFORMS.map(platform => dot(test.cells[tier]?.[platform]))).join("")}
</tr>`

const matrix = tests => {
  const head = `
<thead>
  <tr><th colspan="5"></th>${TIERS.map(tier => `<th class="tier" colspan="2">${esc(tier)}</th>`).join("")}</tr>
  <tr><th>Caso</th><th>Descripción</th><th>Severidad</th><th>Riesgo</th><th>Detección</th>${TIERS.flatMap(() => PLATFORMS.map(p => `<th class="num" title="${esc(PLATFORM_LABEL[p])}">${PLATFORM_SHORT[p]}</th>`)).join("")}</tr>
</thead>`

  const groups = VERDICTS.map(verdict => {
    const inGroup = tests
      .filter(test => test.verdict.kind === verdict.kind)
      .sort(
        (a, b) =>
          (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
          a.id - b.id
      )

    if (inGroup.length === 0) {
      return ""
    }

    return `
<details${verdict.open ? " open" : ""}>
  <summary><span class="chip ${verdict.kind}">${esc(verdict.kind)}</span><strong>${esc(verdict.title)}</strong><span class="n">${inGroup.length}</span><span class="hint">${rich(verdict.hint)}</span></summary>
  <div class="scroll"><table class="matrix">${head}<tbody>${inGroup.map(matrixRow).join("")}</tbody></table></div>
</details>`
  }).join("")

  return `${groups}
<p class="legend">
  <span><span class="dot passed"></span>pasa</span>
  <span><span class="dot failed"></span>failed (expect sin mensaje)</span>
  <span><span class="dot broken"></span>broken (Error de un helper)</span>
  <span>A = Android · i = iOS. Pasá el cursor por una celda para ver el mensaje.</span>
</p>`
}

const curveChart = curve => {
  const width = 560
  const height = 230
  const top = 24
  const base = 190
  const max = Math.max(
    1,
    ...curve.flatMap(p => PLATFORMS.map(pl => p.byPlatform[pl]))
  )
  const step = width / curve.length
  const barWidth = 44

  const bars = curve
    .map((point, index) => {
      const x = index * step + step / 2

      return `${PLATFORMS.map((platform, at) => {
        const value = point.byPlatform[platform]
        const h = ((base - top) * value) / max
        const bx = x - barWidth - 3 + at * (barWidth + 6)

        return `<rect x="${bx}" y="${base - h}" width="${barWidth}" height="${h}" rx="3" fill="var(${platform === "android" ? "--primary" : "--secondary"})"><title>${esc(PLATFORM_LABEL[platform])} · ${esc(point.tier)}: ${value}</title></rect>
<text class="val" x="${bx + barWidth / 2}" y="${base - h - 6}" text-anchor="middle">${value}</text>`
      }).join(
        ""
      )}<text x="${x}" y="${base + 20}" text-anchor="middle">${esc(point.tier)}</text>`
    })
    .join("")

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Fallos por nivel de bugs sin contar el ruido de la línea base" style="width:100%;max-width:${width}px">
<line x1="0" y1="${base}" x2="${width}" y2="${base}" stroke="var(--border)"/>${bars}</svg>`
}

const detection = curve => `
<div class="split">
  <div class="card">${curveChart(curve)}
    <p class="legend"><span><span class="dot" style="background:var(--primary)"></span>Android</span><span><span class="dot" style="background:var(--secondary)"></span>iOS</span></p>
  </div>
  <div class="card scroll"><table>
    <thead><tr><th>Nivel</th><th class="num">Android</th><th class="num">iOS</th><th class="num">Nuevos</th></tr></thead>
    <tbody>${curve
      .map(
        point =>
          `<tr><td><b>${esc(point.tier)}</b></td><td class="num">${point.byPlatform.android}</td><td class="num">${point.byPlatform.ios}</td><td class="num">${point.tier === "off" ? "–" : point.caught}</td></tr>`
      )
      .join("")}</tbody>
  </table>
  <p class="note">Android e iOS: fallos del nivel sin contar el ruido. Nuevos: tests que ese nivel atrapa por primera vez. En <code>off</code> lo que queda es la inestabilidad de la base, no defectos. Si los niveles estuvieran bien ordenados por dificultad, las barras subirían de izquierda a derecha.</p></div>
</div>`

const clusters = groups => `
${groups
  .map(
    group => `
<details${group === groups[0] ? " open" : ""}>
  <summary><strong>${esc(group.category)}</strong><span class="n">${group.count} fallos</span></summary>
  <div class="scroll"><table>
    <thead><tr><th>Mensaje (números normalizados)</th><th class="num">Veces</th><th>Casos</th><th>Niveles</th></tr></thead>
    <tbody>${group.clusters
      .map(
        cluster =>
          `<tr><td>${esc(cluster.message)}</td><td class="num">${cluster.count}</td><td class="id">${esc(cluster.ids.map(id => `COCOS-${id}`).join(", "))}</td><td>${esc(cluster.tiers.join(", "))}</td></tr>`
      )
      .join("")}</tbody>
  </table></div>
</details>`
  )
  .join("")}
<p class="note">Los estados no separan tipos de fallo en esta suite: <code>failed</code> son los <code>expect()</code> sin mensaje y <code>broken</code> cualquier Error lanzado por un helper. Por eso se agrupa por lo que dice el fallo, con las mismas categorías del reporte de Allure.</p>`

const mismatches = list =>
  list.length === 0
    ? '<p class="note">Ningún test da distinto entre plataformas dentro de un mismo nivel.</p>'
    : `<div class="card scroll"><table>
  <thead><tr><th>Caso</th><th>Descripción</th><th>Veredicto</th><th>Niveles donde difieren</th></tr></thead>
  <tbody>${list
    .map(
      entry =>
        `<tr><td class="id">COCOS-${entry.id}</td><td class="name" title="${esc(entry.name)}">${esc(entry.name.replace(/^COCOS-\d+ · /, ""))}</td><td><span class="chip ${esc(entry.kind)}">${esc(entry.kind)}</span></td><td>${esc(entry.tiers.join(", "))}</td></tr>`
    )
    .join("")}</tbody></table></div>`

const risks = list => `
<div class="card scroll"><table>
  <thead><tr><th>Riesgo</th><th class="num">Casos en Qase</th><th class="num">En la suite de UI</th><th>Veredictos de la UI</th></tr></thead>
  <tbody>${list
    .map(entry => {
      const total = entry.ui || 1

      return `<tr><td><b>${esc(entry.risk)}</b></td><td class="num">${entry.cases}</td><td class="num">${entry.ui || '<span class="chip ruido">sin UI</span>'}</td><td>${
        entry.ui
          ? stack([
              {
                value: entry.detecta,
                share: entry.detecta / total,
                color: "--primary",
                title: `${entry.detecta} detectan`,
              },
              {
                value: entry.estable,
                share: entry.estable / total,
                color: "--pass",
                title: `${entry.estable} estables`,
              },
              {
                value: entry.inestable,
                share: entry.inestable / total,
                color: "--broken",
                title: `${entry.inestable} inestables`,
              },
              {
                value: entry.ruido,
                share: entry.ruido / total,
                color: "--fail",
                title: `${entry.ruido} de ruido`,
              },
            ])
          : ""
      }</td></tr>`
    })
    .join("")}</tbody>
</table>
<p class="legend"><span><span class="dot" style="background:var(--primary)"></span>detectan</span><span><span class="dot passed"></span>estables</span><span><span class="dot broken"></span>inestables</span><span><span class="dot failed"></span>ruido</span></p></div>`

const timing = time => `
<div class="split">
  <div class="card scroll"><table>
    <thead><tr><th>Plataforma</th><th class="num">Total</th><th class="num">Mediana</th><th class="num">p95</th></tr></thead>
    <tbody>${time.byPlatform
      .map(
        entry =>
          `<tr><td><b>${esc(PLATFORM_LABEL[entry.platform])}</b></td><td class="num">${minutes(entry.totalMs)}</td><td class="num">${seconds(entry.p50Ms)}</td><td class="num">${seconds(entry.p95Ms)}</td></tr>`
      )
      .join("")}</tbody>
  </table>
  <p class="note">Los tests que fallan en todo se llevan <b>${minutes(time.noiseMs)}</b> (${percent(time.noiseShare)}) de las ${minutes(time.totalMs)} de corrida.</p></div>
  <div class="card scroll"><table>
    <thead><tr><th>Los 10 más lentos</th><th>Corrida</th><th class="num">Tiempo</th></tr></thead>
    <tbody>${time.slowest
      .map(
        entry =>
          `<tr><td class="name" title="${esc(entry.name)}">COCOS-${entry.id}</td><td>${esc(entry.tier)} · ${esc(PLATFORM_LABEL[entry.platform])}</td><td class="num">${seconds(entry.durationMs)}</td></tr>`
      )
      .join("")}</tbody>
  </table></div>
</div>`

export const renderInsights = (
  insights,
  {generatedAt, commit} = {}
) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Insights de la suite E2E</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">Suite E2E · todas las corridas</p>
    <h1>Qué falla, qué pasa y qué es ruido</h1>
    <p class="standfirst">Cuatro niveles de defectos de la API por dos plataformas. El nivel <code>off</code> es la línea base: lo que falla ahí no detecta nada; lo que pasa en <code>off</code> y falla en un nivel superior es una detección real.</p>
    <p class="meta">${esc(generatedAt ?? "")}${commit ? ` · commit ${esc(commit)}` : ""} · ${insights.rows.length} resultados · ${insights.tests.length} tests</p>
  </header>

  ${section("primero", "Qué mirar primero", "", priorities(insights.priorities))}
  ${section("resumen", "Resumen", "Tasa de éxito de cada una de las ocho corridas y cuántos tests caen en cada veredicto.", summary(insights))}
  ${section("matriz", "Matriz de detección", "Cada fila es un test y cada columna una corrida. Se agrupan por veredicto para separar de un vistazo la señal del ruido.", matrix(insights.tests))}
  ${section("curva", "Curva de detección", "Fallos por nivel restando los tests que fallan siempre (el ruido de la línea base).", detection(insights.curve))}
  ${section("fallos", "Qué fallos hay", "Los fallos agrupados por tipo y por mensaje.", clusters(insights.clusters))}
  ${section("plataformas", "Android contra iOS", "Tests que dan distinto en las dos plataformas dentro de un mismo nivel: flaky o un problema propio de una plataforma.", mismatches(insights.mismatches))}
  ${section("riesgos", "Cobertura por riesgo", "Cruza los riesgos del plan de pruebas (etiquetas `riesgo:R` de Qase) con lo que corrió en la UI.", risks(insights.risks))}
  ${section("tiempos", "Dónde se va el tiempo", "", timing(insights.time))}

  <footer class="foot">Generado por <code>scripts/e2e-insights.mjs</code> desde los resultados de Allure y los casos de Qase (<code>e2e/data/qase-cases.json</code>). No hace falta volver a correr la suite para regenerarlo: <code>bun run e2e:report:tiers</code>.</footer>
</div>
</body>
</html>
`
