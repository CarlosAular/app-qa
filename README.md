# Cocos

React Native trading app built with Expo Router, TypeScript, Uniwind, TanStack
Query, and a multi-tenant dummy trading API.

## Documentación QA

Seis documentos HTML independientes en [`docs/`](docs/). Se abren directo en el
navegador, no necesitan servidor ni build.

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
  cómo está organizado el proyecto `COCOS`, los 50 casos con link a cada ficha y el
  lugar donde se irán registrando las corridas.
- [`docs/api.html`](docs/api.html) — contrato de la API observado con requests
  reales: endpoints, errores, reservas de saldo, resolución de órdenes límite y
  diferencias entre niveles de defectos.

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

| Spec                   | Casos de Qase          | Qué protege                                                                               |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `01-market-buy`        | `COCOS-7`              | Compra a mercado end-to-end: estimado, ejecución al precio vigente, efectivo y posición.  |
| `02-amount-pesos`      | `COCOS-5`, `COCOS-49`  | Conversión de pesos a acciones enteras: nunca redondea hacia arriba, acepta coma decimal. |
| `03-ticket-validation` | `COCOS-6`, `COCOS-47`  | Los tres mensajes de validación del ticket, sin crear ninguna orden.                      |
| `04-sell-partial`      | `COCOS-25`, `COCOS-28` | Venta a mercado y venta parcial: el PPP no cambia al vender.                              |
| `05-order-history`     | `COCOS-10`             | La orden recién enviada aparece primera con sus datos.                                    |

**Un instrumento distinto por caso** (DYCA, CAPX, MIRG, TECO2, PATA, FERR,
SAMI), a propósito: todos los specs de una corrida comparten tenant, así que si
dos casos operaran el mismo ticker el delta de uno mediría el movimiento del
otro.

### Qué NO se automatiza, y por qué

- **Órdenes límite** (`COCOS-8, 29, 45, 46, 48`): la API las resuelve con un
  factor aleatorio ante cualquier request posterior. Son flaky por diseño del
  servicio, no del test.
- **Casos `tipo:visual`** (`COCOS-16, 19, 23, 26, 31`): superposiciones y
  recortes. Appium valida jerarquía, no píxeles.
- **Casos de red caída** (`COCOS-14, 33, 38`): en Android se haría con
  `adb shell svc wifi disable`, pero en el simulador de iOS no hay equivalente.
  Sin paridad entre plataformas, no entran.

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
- **El ticket era inoperable con VoiceOver en iOS** (`COCOS-46`, corregido).
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

`.github/workflows/e2e.yml`: Android en cada push y PR (runner Linux), iOS por
cron nocturno y a pedido (runner macOS, que se factura 10x y tiene 3 vCPU). El
build y la suite de iOS van en el **mismo job** a propósito: separarlos obliga a
un segundo checkout, un segundo `bun install` de 4,1 GB, un round-trip de
artifact que le saca el bit de ejecución al `.app`, y una compilación de
WebDriverAgent en frío.

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
