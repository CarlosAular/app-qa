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
