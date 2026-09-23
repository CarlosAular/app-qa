import {qase} from "wdio-qase-reporter"

/**
 * `qase.step` está tipado como `Promise<undefined>`: se traga el valor que
 * devuelve el cuerpo. Este wrapper lo conserva, que es lo que necesitan los
 * specs para ir encadenando lo que leen de la pantalla.
 *
 * Cada step aparece como un paso en el reporte de Qase, así que los nombres
 * espejan los pasos del caso manual.
 */
export const step = async <T>(
  name: string,
  body: () => Promise<T>
): Promise<T> => {
  let result!: T

  await qase.step(name, async () => {
    result = await body()
  })

  return result
}
