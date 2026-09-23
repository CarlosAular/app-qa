/**
 * El accessibilityLabel no se llama igual en cada plataforma: en Android baja
 * como `content-desc` y en iOS como `label`. Las filas de lista de esta app
 * exponen TODOS sus datos ahí, así que leerlo bien es media suite.
 */
type AttributeReader = {getAttribute(name: string): Promise<string | null>}

export const labelOf = async (element: AttributeReader): Promise<string> => {
  const attribute = driver.isAndroid ? "content-desc" : "label"
  return (await element.getAttribute(attribute)) ?? ""
}

/** Los textos de todos los elementos que matchean un selector. */
export const textsOf = async (selector: string): Promise<string[]> => {
  const elements = await $$(selector)
  const texts: string[] = []

  for (const element of elements) {
    texts.push(await element.getText())
  }

  return texts
}
