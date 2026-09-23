export const DEFAULT_TIMEOUT = 15_000
export const SHORT_TIMEOUT = 2_500

type WaitOptions = {timeout?: number; message?: string}

/** Espera a que el selector esté visible y devuelve el elemento. */
export const waitForVisible = async (
  selector: string,
  {timeout = DEFAULT_TIMEOUT, message}: WaitOptions = {}
) => {
  const element = await $(selector)

  await element.waitForDisplayed({
    timeout,
    timeoutMsg: message ?? `No apareció ${selector} en ${timeout}ms`,
  })

  return element
}

/** Chequeo rápido: ¿está visible AHORA? No lanza si no está. */
export const isVisible = async (selector: string, timeout = SHORT_TIMEOUT) => {
  try {
    const element = await $(selector)
    return await element.waitForDisplayed({timeout})
  } catch {
    return false
  }
}

/** Espera a que el selector deje de estar visible. */
export const waitForGone = async (
  selector: string,
  {timeout = DEFAULT_TIMEOUT, message}: WaitOptions = {}
) => {
  const element = await $(selector)

  await element.waitForDisplayed({
    reverse: true,
    timeout,
    timeoutMsg: message ?? `${selector} seguía visible tras ${timeout}ms`,
  })
}

/** Texto visible de un selector, ya esperado. */
export const textOf = async (selector: string, options: WaitOptions = {}) => {
  const element = await waitForVisible(selector, options)
  return (await element.getText()).trim()
}

/** Reintenta una aserción hasta que pase o se agote el tiempo. */
export const eventually = async <T>(
  fn: () => Promise<T>,
  {
    timeout = DEFAULT_TIMEOUT,
    interval = 400,
  }: {timeout?: number; interval?: number} = {}
): Promise<T> => {
  const deadline = Date.now() + timeout
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      await browser.pause(interval)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
