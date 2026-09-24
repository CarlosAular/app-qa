# Cocos

React Native trading app built with Expo Router, TypeScript, Uniwind, TanStack
Query, and a multi-tenant dummy trading API.

## Documentación QA

Siete documentos HTML independientes en [`docs/`](docs/). Se abren directo en el
navegador, no necesitan servidor ni build.

- [`docs/plan-de-pruebas.html`](docs/plan-de-pruebas.html) — el plan de pruebas:
  alcance y fuera de alcance, estrategia por niveles, priorización por riesgo,
  trazabilidad de los 52 casos con sus resultados, decisiones de automatización
  (incluye cómo se trabaja sin `POST /reset`), defectos y pendientes.
- [`docs/glosario.html`](docs/glosario.html) — qué significa cada término de la
  app, la API y el resto de la documentación. Escrito desde cero, sin asumir
  conocimiento del mundo financiero.
- [`docs/puesta-en-marcha.html`](docs/puesta-en-marcha.html) — cómo levantar la
  app a mano paso a paso, los dos obstáculos que frenan el primer intento, y el
  stack de tecnología con las versiones exactas verificadas.
- [`docs/producto-y-qa.html`](docs/producto-y-qa.html) — vista funcional:
  pantallas, reglas de negocio, matriz de riesgo, hallazgos con evidencia y
  limitaciones de testabilidad.
- [`docs/tecnologias.html`](docs/tecnologias.html) — inventario vivo del stack: qué
  tecnología usa la app, qué usamos nosotros para QA, para qué sirve cada pieza y
  con qué versión se verificó.
- [`docs/qase.html`](docs/qase.html) — el catálogo de casos de prueba: qué es Qase,
  cómo está organizado el proyecto `COCOS`, los 52 casos con link a cada ficha y las
  corridas registradas, manuales y automatizadas.
- [`docs/api.html`](docs/api.html) — contrato de la API observado con requests
  reales: endpoints, errores, reservas de saldo, resolución de órdenes límite y
  diferencias entre niveles de defectos.

## Correr todo

Un solo comando:

```sh
bun install
bun run qa
```

Corre, en este orden: lint, formato, tipos, tests unitarios, la suite de API y
la de UI en Android y en iOS. La de UI necesita un emulador de Android y un
simulador de iOS ya arrancados, y compila antes los binarios que falten: un
build de release en frío tarda entre 30 y 45 minutos, y las corridas siguientes
reusan el binario. iOS solo corre en macOS.

Sin dispositivos:

```sh
bun run qa:rapido   # todo menos la UI: unos 20 segundos
```

## Suite E2E automatizada (Appium)

Suite de regresión en TypeScript sobre **Appium + WebdriverIO**, con un Page
Object Model compartido entre iOS y Android, linkeada a los casos de Qase del
proyecto `COCOS`.

### Ejecución

```sh
bun install
bun run e2e:build:android   # compila el APK de release y hornea el candidate id
bun run e2e:android         # corre la suite contra el emulador
```

Para iOS:

```sh
bun run e2e:build:ios
bun run e2e:ios
```

Las dos plataformas, una después de la otra:

```sh
bun run e2e
```

Reporte HTML (Allure):

```sh
bun run e2e:report
```

> **Si la sesión de iOS nunca arranca**, con Appium reportando
> `Failed to start the preinstalled WebDriverAgent` mientras el proceso del
> runner aparece corriendo en el simulador, es un desajuste entre Xcode y el
> runtime del simulador: el runner se compila contra el stack de Swift Testing
> del toolchain y ese stack no existe en un runtime de versión anterior
> (acá: Xcode 26.6 con el único runtime iOS 26.5). El arreglo de fondo es
> instalar el runtime que matchea, con `xcodebuild -downloadPlatform iOS`
> (~8 GB). Mientras tanto:
>
> ```sh
> node scripts/e2e-ios-wda-fix.mjs
> ```
>
> Copia los frameworks desde el platform de simulador de Xcode dentro del bundle
> del runner. Hay que volver a correrlo cada vez que Appium reconstruya o
> reinstale WebDriverAgent.

> **La primera corrida de iOS es lenta y no es un problema.** Appium compila
> WebDriverAgent desde cero la primera vez —y si detecta un upgrade de módulo lo
> limpia y vuelve a empezar—, así que la creación de la sesión puede tardar más
> de diez minutos. Por eso `connectionRetryTimeout` es de 20 minutos en iOS y de
> 5 en Android. Las corridas siguientes reusan el `derivedDataPath` fijo y
> arrancan en unos treinta segundos.

Requisitos: un emulador Android corriendo (`Pixel_8_API_36`) o un simulador de
iPhone booteado. El script de build resuelve solo el JDK 17, el SDK de Android y
la ABI del emulador; el de iOS elige el simulador disponible más nuevo en tiempo
de ejecución.

### Por qué Appium y no Maestro ni Detox

- Es el único de los tres que habla W3C WebDriver contra iOS y Android, así que
  **un mismo test corre en las dos plataformas** y el POM es compartido de
  verdad, no duplicado.
- Los casos elegidos **exigen aritmética dentro del test**: `COCOS-5` y
  `COCOS-49` verifican que `floor(monto / precio)` nunca redondee hacia arriba, y
  todas las aserciones son por delta sobre importes en formato `es-AR`
  (`$ 45,72`). Maestro es YAML declarativo: no puede parsear ese string ni
  calcular el esperado.
- Permite mezclar UI y HTTP en el mismo test, que es lo que hace viable el
  aislamiento por tenant sin `POST /reset`: se siembra el estado por API y se
  verifica por UI.
- Tiene reporter oficial de Qase, más Allure y JUnit.

### Casos automatizados

| Spec                      | Casos de Qase               | Qué protege                                                                                                                             |
| ------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `01-market-buy`           | `COCOS-7`                   | Compra a mercado end-to-end: estimado, ejecución al precio vigente, efectivo y posición.                                                |
| `02-amount-pesos`         | `COCOS-5`, `COCOS-49`       | Conversión de pesos a acciones enteras: nunca redondea hacia arriba, acepta coma decimal.                                               |
| `03-ticket-validation`    | `COCOS-6`, `COCOS-47`       | Los tres mensajes de validación del ticket, sin crear ninguna orden.                                                                    |
| `04-sell-partial`         | `COCOS-25`, `COCOS-28`      | Venta a mercado y venta parcial: el PPP no cambia al vender.                                                                            |
| `05-order-history`        | `COCOS-10`                  | La orden recién enviada aparece primera con sus datos.                                                                                  |
| `06-search`               | `COCOS-1`, `17`, `18`, `43` | Buscar por ticker, por sugerencia, por nombre de empresa (hallazgo O3, falla por un defecto de la app) y distinguir ACCIONES de MONEDA. |
| `07-market-catalog`       | `COCOS-3`, `2`              | Abrir la ficha desde el panel; precio y retorno diario coinciden entre panel y ficha.                                                   |
| `08-ticket-setup`         | `COCOS-4`, `22`             | El panel abre con los valores por defecto correctos, y sobre el instrumento correcto desde los tres accesos.                            |
| `09-ticket-limit-pricing` | `COCOS-21`                  | El estimado de una orden límite usa el precio límite, no el de mercado.                                                                 |
| `10-ticket-non-stock`     | `COCOS-41`                  | ARS no debería poder comprarse (hallazgo O8, falla por un defecto de la app).                                                           |
| `11-order-integrity`      | `COCOS-9`, `44`             | No comprar por más efectivo del disponible; el precio confirmado es el que se ejecuta.                                                  |
| `12-order-resubmission`   | `COCOS-36`, `37`, `40`      | Doble toque, arrastre de estado entre instrumentos y reenvío fantasma al reabrir.                                                       |
| `13-portfolio-derived`    | `COCOS-11`, `12`, `30`      | Efectivo/posiciones reflejan el servicio; signo de la ganancia en cero (rendimiento en rojo, mismo defecto de formato que O4).          |
| `14-account-behavior`     | `COCOS-34`, `15`            | Cambiar de pestaña conserva el estado; formato argentino (hallazgo O4, porcentaje en rojo).                                             |
| `15-order-history-order`  | `COCOS-48`                  | Con doce órdenes seguidas, el historial muestra las más nuevas primero y en orden inverso al de envío.                                  |
| `16-limit-orders`         | `COCOS-8`, `29`, `46`       | Órdenes límite no ejecutables: nunca se ejecutan, terminan rechazadas y liberan la reserva de efectivo o de acciones.                   |
| `17-account-reset`        | `COCOS-13`, `50`            | Reiniciar deja el saldo inicial y borra las órdenes límite pendientes. Corre último: nuclea la cuenta compartida.                       |

**Un instrumento distinto por caso** (DYCA, CAPX, MIRG, TECO2, PATA, FERR,
SAMI, y dieciséis más agregados para los specs `06`–`16`), a propósito: todos los
specs de una corrida comparten tenant, así que si dos casos operaran el mismo
ticker el delta de uno mediría el movimiento del otro.

### Casos que fallan por un defecto de la app

Cuatro casos automatizan el comportamiento **correcto** de un defecto que sigue
abierto en la app: hoy fallan, y se ponen en verde solos el día que se arregle.
No son bugs de la suite.

- `COCOS-18`: buscar por el nombre de la empresa no devuelve nada (hallazgo O3).
- `COCOS-41`: ARS se puede comprar, la API la ejecuta como cualquier acción
  (hallazgo O8).
- `COCOS-15`: el retorno diario se muestra con punto decimal en vez de coma
  (hallazgo O4, defecto #25 en Qase).
- `COCOS-30`: el rendimiento del portafolio tiene el mismo problema de formato,
  ya incluido en ese defecto #25 (lista Mercados, Portafolio y el detalle de la
  posición). El signo de la ganancia sólo se verifica en cero, porque la API
  dummy nunca mueve los precios.

### Estado por plataforma

**Android** (Pixel 8, API 36): los 34 casos, 30 verdes y los 4 rojos de arriba.
La primera corrida completa de los primeros 30 casos en una sola sesión (27
minutos) dio además dos fallos propios de la suite, `COCOS-36` y `COCOS-50`; se
estabilizaron y pasan en verde por separado, y los cuatro casos siguientes
(`COCOS-48`, `8`, `29` y `46`) también se verificaron por spec. No se repitió la
corrida completa de los 34, que ronda los 45 minutos.

**iOS** (iPhone 17 Pro, iOS 26.5): los 26 casos nuevos se verificaron spec por
spec, no en una sola corrida, y dan lo mismo que en Android.

- Verdes (22): `COCOS-1, 2, 3, 4, 8, 9, 11, 12, 13, 17, 21, 22, 29, 34, 36, 37,
40, 43, 44, 46, 48, 50`.
- Fallan por un defecto de la app (4), los mismos que en Android: `COCOS-15`, `18`, `30` y `41`.
- Los 8 casos originales no se volvieron a correr en esta ronda. Sus 4 fallos se
  habían atribuido al desajuste entre Xcode y el runtime; puede que los arreglos
  de abajo también cambien ese resultado, pero no está verificado.

Qué costó llegar ahí en iOS, para no redescubrirlo. Todos fueron defectos de la
suite, no del simulador:

- **La barra de pestañas se colapsa** (`minimizeBehavior="onScrollDown"`, iOS 26):
  tras scrollear una lista queda en dos círculos y el toque por geometría caía
  sobre una fila. `TabBar` la expande tocando el círculo de la pestaña activa.
  Expandirla scrolleando hacia arriba movía la lista y rompía `COCOS-34`.
- **La ficha de la posición colgaba la suite minutos**: `mobile: scroll` no
  converge en esa pantalla y XCUITest marca "Operar esta posición" como
  `visible="false"` mientras el frame de la barra lo cubra, aunque el botón esté
  libre. Se scrollea con swipes desde el margen izquierdo (el gráfico de Skia se
  come los del centro), se busca el botón por presencia y se toca por
  coordenadas con la barra colapsada.
- **Refrescar Órdenes con filas nuevas** las inserta arriba y el encabezado queda
  fuera de pantalla (`COCOS-48`).
- **La venta límite cierra el ticket sola** en iOS unos segundos después de
  enviarse y muestra el toast "Orden enviada" (la compra límite deja el ticket
  abierto en "Enviar otra orden"). La orden llega: el servicio la muestra
  pendiente. Los flujos límite aceptan el sheet cerrado como "procesada" y lo
  demás se verifica contra la API. No se confirmó la causa; queda como
  comportamiento observado, no como defecto abierto.

En Android apareció un problema parecido de temporización: cambiar de pestaña
justo después de cerrar el ticket y salir de la ficha del instrumento dejaba a la
app en Mercados, porque el backdrop del sheet todavía estaba atenuando la
pantalla y recibía el clic. `TabBar` ahora verifica que la pestaña quedó
seleccionada y reintenta. Sólo se veía corriendo el spec `16` completo (`COCOS-46`,
el tercero), no cada caso por separado.

La config elige el simulador que ya esté booteado; si hay varios, se fija con
`E2E_IOS_UDID` (más `E2E_IOS_DEVICE_NAME` y `E2E_IOS_RUNTIME`).

### Qué NO se automatiza, y por qué

- **Doble reserva de acciones** (`COCOS-45`): exige que la primera venta límite
  siga pendiente cuando se envía la segunda, y la API resuelve las límite al
  leer la cuenta, con un factor aleatorio: cualquier lectura intermedia la
  deshace. Se cubre mejor a nivel API, sin lecturas entre las dos órdenes.
- **Casos `tipo:visual`** (`COCOS-16, 19, 23, 26, 31`): superposiciones y
  recortes. Appium valida jerarquía, no píxeles.
- **Prueba con VoiceOver** (`COCOS-52`): Appium lee el árbol de accesibilidad
  pero no lo escucha, y el simulador de iOS no soporta VoiceOver: hace falta un
  iPhone físico. El caso está documentado en Qase, con sus pasos, y todavía sin
  ejecutar.
- **Casos de red caída** (`COCOS-14, 33, 38`): en Android se haría con
  `adb shell svc wifi disable`, pero en el simulador de iOS no hay equivalente.
  Sin paridad entre plataformas, no entran.

### Órdenes límite: invariantes, no estados

La API resuelve las órdenes límite al **leer** la cuenta y con un factor
aleatorio, así que un estado puntual (pendiente, ejecutada, rechazada) no se
puede afirmar. Lo que sí se mantiene es un invariante que se midió: una orden
**no ejecutable** (compra por debajo del mercado, venta por encima) nunca se
ejecuta (0 de 40 observadas) y termina rechazada. Los specs `16-limit-orders` y
`15-order-history-order` se apoyan en eso:

- Los pasos intermedios afirman **pertenencia a un conjunto**: el efectivo o las
  acciones están reservados **o** ya liberados, y se deja constancia en Qase de
  cuál de los dos se vio.
- Los pasos finales afirman el estado terminal: rechazada, nunca ejecutada, y
  efectivo y cantidad exactamente iguales a los del principio.
- Para llegar al estado final se sondea la API (unos 300 ms por lectura, hasta
  40): es lo mismo que refrescar la pantalla, pero sin pagar ~5 s por refresco.
- `COCOS-48` no depende de esto: son doce órdenes a mercado, determinísticas.

### Aislamiento sin `POST /reset`

La consigna prohíbe `POST /reset`. `EXPO_PUBLIC_CANDIDATE_ID` se **inlinea al
bundlear**, así que el tenant contra el que habla la app queda congelado en el
binario y no puede variar por test. De ahí sale todo el diseño:

1. `scripts/e2e-build.mjs` genera un candidate id por build
   (`local-<sha>-<timestamp>-<plataforma>` o `ci-<sha>-<run>-<intento>-<plataforma>`),
   lo hornea, **verifica con grep que haya quedado dentro del bundle** y lo deja
   escrito en `e2e/.build-info.<plataforma>.json`.
2. El proceso de test lee ese archivo: su cliente HTTP apunta al mismo tenant que
   la app. Nunca se recalcula del lado del test.
3. Las aserciones son **por delta**, nunca absolutas contra el millón inicial.
4. Cada spec **se autoabastece**: el que necesita una posición la siembra por
   `POST /orders` en su `before`.
5. `maxInstances: 1` y `specFileRetries: 0`. Paralelizar haría que los deltas de
   un worker midan los movimientos de otro, y reintentar un spec mediría deltas
   sobre una cuenta que el intento anterior ya movió.

Para forzar una cuenta virgen, basta recompilar: cada build nuevo es una cuenta
nueva. Con `--reuse` se conserva el candidate id anterior.

### Binarios de release, no de debug

Release embebe el bundle JS (la suite no depende de Metro), no tiene LogBox
—que en debug tapa la barra de pestañas y se traga los toques, incluido "Operar
ahora"— ni dev menu, y `expo-updates` está desactivado, así que no hay fetch OTA
compitiendo con la sesión de Appium.

### Defectos conocidos que la suite contempla

La suite asserta lo que el golden path sí garantiza; los defectos siguen
viviendo en Qase y no se codifican como fallas esperadas.

- En Android el toast **"Orden ejecutada" nunca aparece**: la confirmación
  cross-platform es que el botón pase a "Enviar otra orden" más la orden en el
  historial. El toast se verifica sólo en iOS.
- En iOS **un rechazo del servicio no muestra nada**: el rechazo por acciones
  insuficientes se verifica por estado (no se creó orden, la tenencia no se
  movió), no por mensaje.
- **El ticket era inoperable con VoiceOver en iOS** (defecto #46 de Qase,
  corregido en el código).
  `@gorhom/bottom-sheet` pone `accessible={true}` por defecto en el contenedor
  del sheet, y en iOS eso COLAPSA todo el subárbol en un solo elemento sin
  hijos: ni los toggles, ni el campo de cantidad, ni "Enviar orden", ni los
  mensajes de validación existían en el árbol de accesibilidad. En Android no se
  nota, porque el dump sigue viendo los `TextView` hijos — por eso el defecto
  pasa desapercibido si sólo se prueba en Android. Lo encontró esta suite al
  intentar correr en iOS. El arreglo es una prop en
  `src/components/modals/ModalContext.tsx`: `accessible={false}`.
- El botón **"Operar esta posición" es inalcanzable en Android**: queda
  completamente por debajo del borde superior de la barra de pestañas (medido:
  control en `y=2211..2337`, barra desde `y=2126`) con el scroll ya al fondo. El
  flujo cae al acceso por Mercados —que abre el mismo ticket— y deja constancia
  en el log y en el resultado de Qase.
- **La última fila de toda lista queda tapada** por la barra de pestañas:
  `support/gestures.ts` levanta el elemento antes de tocarlo y, si no hay franja
  alcanzable, falla nombrando el defecto en vez de dar un timeout genérico.

### Estructura

```
e2e/
  config/     configuración de WDIO, resolución de dispositivo y build-info
  support/    selectores por plataforma, gestos, dinero es-AR, lectura del árbol
  data/       instrumentos y strings exactos de la app
  api/        cliente HTTP del test: siembra y snapshots por delta
  screens/    page objects
  components/ ticket, barra de pestañas, toasts
  flows/      métodos compartidos de negocio
  specs/      un archivo por grupo de casos
```

**La única capa que sabe en qué plataforma corre es `support/selectors.ts`.** De
ahí para arriba el código es único. La app no expone un solo `testID`: la suite
se apoya en los `accessibilityLabel` que ya existen, sin tocar el código de la
app bajo prueba.

### Integración con Qase

Cada test declara su caso con `qase(7, "COCOS-7 · ...")`, y el ID va también en
el título para que la traza se vea igual en Allure y JUnit con Qase apagado. Los
pasos del caso manual se reproducen como `step(...)`, así el reporte de Qase
muestra el mismo desglose.

Local no publica nada (`QASE_MODE=off`). Para publicar:

```sh
QASE_MODE=testops QASE_TESTOPS_API_TOKEN=<token> bun run e2e:android
```

En CI el workflow lo hace solo con el secret `QASE_TESTOPS_API_TOKEN`.

### CI

Dos workflows.

`.github/workflows/api.yml`: calidad (lint, formato, tipos y tests unitarios) y
la suite de API en el nivel `off`, en cada push y PR. Es rápido porque no
necesita dispositivo: solo el cliente HTTP de Playwright. Publica el reporte de
Allure y el de JUnit como artefacto, y solo publica en Qase si se lo pide a mano.
De noche y a pedido corre además los niveles con defectos inyectados y los tests
`@defecto`: fallan porque el servicio no cumple lo que afirman, así que ese job
no rompe el build y solo deja los reportes.

`.github/workflows/e2e.yml`: Android en cada push y PR (runner Linux), iOS por
cron nocturno y a pedido (runner macOS, que se factura 10x y tiene 3 vCPU). El
build y la suite de iOS van en el **mismo job** a propósito: separarlos obliga a
un segundo checkout, un segundo `bun install` de 4,1 GB, un round-trip de
artifact que le saca el bit de ejecución al `.app`, y una compilación de
WebDriverAgent en frío.

## Suite de API (Playwright)

Suite **separada** de la de UI: prueba la API directamente, sin simulador ni
dispositivo, con **Playwright Test** (sólo el cliente HTTP, sin navegador) y
reporte **Allure**. Vive en `api-tests/` y está linkeada a los casos `tipo:api`
de Qase.

```bash
bun run test:api            # tier `off` (línea base): debe pasar en verde
bun run test:api:easy       # también :medium y :hard — los fallos son hallazgos
bun run test:api:tiers      # los cuatro tiers en una sola corrida
bun run test:api:defectos   # defectos conocidos en `off`: fallan porque el servicio no los cumple
bun run test:api:report     # genera y abre el reporte de Allure
```

- **Un test por caso de Qase:** cada test declara su caso con
  `qase(id, "COCOS-N · ...")` y cada paso del caso es un `test.step`, igual que
  los E2E. Cubren COCOS-20, 24, 27, 32, 35, 39 y 51, más COCOS-42, que va como defecto
  (`@defecto`, falla porque el servicio no lo cumple): 8 casos de Qase.
- **Tiers como proyectos:** cada valor de `X-Enable-Bugs` es un proyecto de
  Playwright. La misma suite pasa en `off` y va fallando al subir el tier
  (en `easy` ya falla el catálogo y el saldo). `API_TIERS=off,hard bun run test:api`
  elige cuáles.
- **Sin `POST /reset`:** cada test genera su propio `X-Candidate-Id` (cuenta
  virgen de 1.000.000 ARS), así que no hay estado compartido ni hace falta
  limpiar. Sirve igual en un entorno donde `/reset` no exista.
- **LIMIT no determinístico:** no se asierta el estado final, sino invariantes
  (nunca FILLED si no es ejecutable, saldo neto de reserva o liberado) y se
  relee con reintentos hasta que deje de estar PENDING.
- **Contrato:** cada respuesta se valida con `zod` (`api-tests/schemas.ts`).
- **Defectos conocidos en `off`** (tests `@defecto`, fuera de la corrida base):
  cantidad `"1e3"`/`true` coaccionada, `LIMIT` con `price` ≤ 0 aceptado y orden
  sobre ARS aceptada. Se corren con `test:api:defectos` y en Qase quedan como
  _failed_ hasta que el servicio se corrija.
- `API_URL` cambia la URL base (por defecto `https://dummy-api-topaz.vercel.app`).

### Publicar en Qase

Como los E2E: apagado por defecto. Para publicar, el token va en el `.env`
(ignorado por git) y se activa el modo `testops`:

```bash
# .env
QASE_TESTOPS_API_TOKEN=<token>
```

```bash
bun run publish:api            # publica el tier off
bun run publish:api:easy       # también :medium y :hard
bun run publish:api:defectos   # los defectos conocidos en off
```

Los `test:api*` **nunca** publican: corren en local. Sólo los `publish:api*`
activan `QASE_MODE=testops`, y cada uno crea su propia run en Qase.

`bun run` no le pasa el `.env` a Playwright, así que
`api-tests/playwright.config.ts` lo carga solo. Un token exportado en la shell
tiene precedencia sobre el del `.env`.

La run se llama `Playwright API · tier off` (o `· defectos conocidos`). Con
`QASE_MODE=report` deja el resultado local en `api-tests/reports/qase-report`.

## Correr la app y la API con cada nivel de bugs

`X-Enable-Bugs` se fija con `EXPO_PUBLIC_BUGS_TIER` (app) o `API_TIERS` (suite de
API). Hay un script por nivel:

| Nivel    | App (Metro)            | iOS                  | Android                  | API                       |
| -------- | ---------------------- | -------------------- | ------------------------ | ------------------------- |
| `off`    | `bun run start:off`    | `bun run ios:off`    | `bun run android:off`    | `bun run test:api:off`    |
| `easy`   | `bun run start:easy`   | `bun run ios:easy`   | `bun run android:easy`   | `bun run test:api:easy`   |
| `medium` | `bun run start:medium` | `bun run ios:medium` | `bun run android:medium` | `bun run test:api:medium` |
| `hard`   | `bun run start:hard`   | `bun run ios:hard`   | `bun run android:hard`   | `bun run test:api:hard`   |

Los `start:*` limpian la caché de Metro (`--clear`), porque las variables
`EXPO_PUBLIC_*` se incrustan al empaquetar. La suite E2E (Appium) está
calibrada para el golden path: se compila y corre en `off`.

## Requirements

- Bun
- Node.js compatible with Expo SDK 56
- Xcode for iOS simulator or Android Studio for Android emulator

## Setup

```sh
bun i
cp .env.example .env
bun prebuild
bun run ios
# or
bun run android
```

`.env` drives every API request:

| Variable                   | Required | Description                                                                                      |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`      | yes      | Base URL of the dummy API.                                                                       |
| `EXPO_PUBLIC_CANDIDATE_ID` | yes      | Isolates orders, cash, and holdings on the multi-tenant API. Must be a non-empty string.         |
| `EXPO_PUBLIC_BUGS_TIER`    | no       | `off`, `easy`, `medium`, or `hard`. Defaults to `off`. Any other value also falls back to `off`. |

Env vars are read at bundle time, so restart Metro after changing `.env`.

Keep `EXPO_PUBLIC_BUGS_TIER=off` for the normal golden path. Higher tiers
activate intentional API defects used in QA scenarios — see
[CHALLENGE.md](CHALLENGE.md).

Start Metro alone on the default port:

```sh
bun run start
```

For a clean Metro restart after native, Babel, or React Compiler config changes:

```sh
npx expo start --clear
```

## Verification

```sh
bun test
bunx tsc --noEmit
bun run lint
bun run format:check
```

Native UI verification should use the Argent workflow against Metro on port
`8081`.

## API

The app consumes these stateful endpoints:

- `GET /instruments`
- `GET /search?query=DYC`
- `GET /portfolio`
- `GET /orders`
- `POST /orders`
- `POST /reset`

`GET /` is a health check and is not consumed by the app.

The base URL and shared request headers are configured in
`src/config/api.config.ts`.

Every request carries two headers the API requires:

- `X-Enable-Bugs` — the tier from `EXPO_PUBLIC_BUGS_TIER`. Requests without a
  valid value are rejected with `400`.
- `X-Candidate-Id` — from `EXPO_PUBLIC_CANDIDATE_ID`. The app fails to start if that value is missing, empty, or not a string.
