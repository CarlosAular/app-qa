/**
 * Lectura geométrica del árbol, en UNA sola llamada.
 *
 * Por qué no alcanza con XPath: en las tarjetas de resumen la app dibuja
 * <View><Text>Efectivo</Text><Text>$ 999.039,88</Text></View>, pero Android
 * aplana el Row y expone PRIMERO las tres etiquetas y DESPUÉS los tres valores:
 *
 *   TextView 'Costo invertido'   [132,1215][361,1299]
 *   TextView 'Efectivo'          [426,1215][656,1257]
 *   TextView 'Posiciones'        [720,1215][949,1257]
 *   TextView '$ 960,12'          [132,1310][361,1363]
 *   TextView '$ 999.039,88'      [426,1268][656,1321]
 *   TextView '1'                 [720,1268][949,1321]
 *
 * `following-sibling::*[1]` devuelve "Posiciones", no el importe. Lo que sí es
 * estable en las dos plataformas es la geometría: el valor es el texto que está
 * inmediatamente DEBAJO de su etiqueta y alineado con ella.
 */

export type TextNode = {
  text: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Se matchea CUALQUIER tag porque hay dos formatos en juego:
 *   - `adb shell uiautomator dump` -> <node class="android.widget.TextView" .../>
 *   - Appium getPageSource()       -> <android.widget.TextView .../>
 * En el segundo el nombre del tag ES la clase.
 */
const ANY_TAG = /<([\w.$]+)\b([^>]*?)\/?>/g

const attribute = (raw: string, name: string): string => {
  const match = raw.match(new RegExp(`${name}="([^"]*)"`))
  return match?.[1] ?? ""
}

const decode = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code))
    )

const parseAndroid = (xml: string): TextNode[] => {
  const nodes: TextNode[] = []

  for (const match of xml.matchAll(ANY_TAG)) {
    const tag = match[1] ?? ""
    const raw = match[2] ?? ""
    const className = attribute(raw, "class") || tag

    if (!className.includes("TextView")) {
      continue
    }

    const text = decode(attribute(raw, "text")).trim()

    if (!text) {
      continue
    }

    const bounds = attribute(raw, "bounds").match(
      /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/
    )

    if (!bounds) {
      continue
    }

    const [x1, y1, x2, y2] = bounds.slice(1).map(Number) as [
      number,
      number,
      number,
      number,
    ]

    nodes.push({text, x: x1, y: y1, width: x2 - x1, height: y2 - y1})
  }

  return nodes
}

const parseIos = (xml: string): TextNode[] => {
  const nodes: TextNode[] = []

  for (const match of xml.matchAll(ANY_TAG)) {
    const tag = match[1] ?? ""
    const raw = match[2] ?? ""

    if (
      !tag.includes("StaticText") &&
      attribute(raw, "type") !== "XCUIElementTypeStaticText"
    ) {
      continue
    }

    const text = decode(
      attribute(raw, "label") ||
        attribute(raw, "name") ||
        attribute(raw, "value")
    ).trim()

    if (!text) {
      continue
    }

    nodes.push({
      text,
      x: Number(attribute(raw, "x")),
      y: Number(attribute(raw, "y")),
      width: Number(attribute(raw, "width")),
      height: Number(attribute(raw, "height")),
    })
  }

  return nodes
}

/** Todos los textos visibles con su geometría, en una sola llamada al driver. */
export const readTextNodes = async (): Promise<TextNode[]> => {
  const xml = await driver.getPageSource()
  const nodes = driver.isAndroid ? parseAndroid(xml) : parseIos(xml)

  if (nodes.length === 0) {
    // Un árbol sin un solo texto casi siempre significa que el formato del
    // page source cambió, no que la pantalla esté vacía: que el error lo diga.
    throw new Error(
      `No pude leer ningún texto del árbol (${xml.length} bytes). ` +
        `Primeros 400 caracteres: ${xml.slice(0, 400)}`
    )
  }

  return nodes
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

/**
 * El valor que la app dibuja debajo de una etiqueta.
 *
 * La comparación de la etiqueta ignora mayúsculas y acentos porque varias
 * llevan la clase `uppercase` de Tailwind, que RN aplica como textTransform y
 * llega al árbol nativo ya convertida ("Valor total" -> "VALOR TOTAL").
 */
export const valueUnderLabel = (
  nodes: TextNode[],
  label: string,
  {tolerance = 24}: {tolerance?: number} = {}
): string => {
  const wanted = normalize(label)
  const labelNode = nodes.find(node => normalize(node.text) === wanted)

  if (!labelNode) {
    throw new Error(
      `No encontré la etiqueta "${label}" en pantalla. Textos visibles: ` +
        nodes
          .map(node => node.text)
          .slice(0, 40)
          .join(" | ")
    )
  }

  const below = nodes
    .filter(node => node !== labelNode)
    .filter(node => Math.abs(node.x - labelNode.x) <= tolerance)
    .filter(node => node.y >= labelNode.y + labelNode.height - 4)
    .sort((a, b) => a.y - b.y)

  const value = below[0]

  if (!value) {
    throw new Error(
      `Encontré la etiqueta "${label}" en (${labelNode.x}, ${labelNode.y}) pero ningún valor debajo alineado con ella.`
    )
  }

  return value.text
}

/** Azúcar: leer la etiqueta y su valor en una sola pasada. */
export const readValueUnderLabel = async (label: string): Promise<string> =>
  valueUnderLabel(await readTextNodes(), label)
