# Cocos QA

Challenge de QA Automation para la app de trading de Cocos (React Native +
Expo). La app ya estaba desarrollada: acá se evalúa su calidad y se automatiza
la validación.

## Dónde está la documentación

Abrir en el navegador, sin servidor ni build. **Empezar por
[`docs/overview.html`](docs/overview.html)** (mapa de cinco minutos).

| Entregable del challenge         | Dónde                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan de pruebas                  | [`docs/plan-de-pruebas.html`](docs/plan-de-pruebas.html)                                                                                     |
| Reporte de bugs                  | [`docs/reporte-de-bugs.html`](docs/reporte-de-bugs.html)                                                                                     |
| Suite automatizada y decisiones  | [`docs/automatizacion.md`](docs/automatizacion.md) (incluye cómo trabajar sin `POST /reset`)                                                 |
| Casos de prueba (copia de Qase)  | [`docs/qase.html`](docs/qase.html)                                                                                                           |
| Cómo levantar todo a mano        | [`docs/puesta-en-marcha.html`](docs/puesta-en-marcha.html)                                                                                   |
| Glosario, contrato de API, stack | [`glosario`](docs/glosario.html), [`api`](docs/api.html), [`tecnologias`](docs/tecnologias.html), [`producto-y-qa`](docs/producto-y-qa.html) |

El proyecto de Qase (`COCOS`) es privado; los HTML de `docs/` son su copia
legible.

## Cómo correr

Requisitos: [Bun](https://bun.sh), Node compatible con Expo SDK 56. Para la UI:
Xcode (iOS, solo macOS) y/o Android Studio con un emulador.

```sh
bun install
cp .env.example .env    # completar EXPO_PUBLIC_CANDIDATE_ID con cualquier texto
```

**Pruebas de API + calidad** (lint, formato, tipos, unitarios, API; ~20 s, sin
dispositivos):

```sh
bun run qa:rapido
bun run test:api:report   # reporte Allure de la suite de API
```

**Smoke** (los 8 casos más críticos, 4 de API y 4 de UI, etiquetados `@smoke`;
es lo que corre el CI en cada push):

```sh
bun run test:api:smoke      # API, unos 5 segundos
bun run e2e:android:smoke   # UI en Android (también e2e:ios:smoke)
bun run smoke               # API + UI en las dos plataformas
```

**Todo, incluida la UI** (Appium en Android e iOS; necesita emulador y
simulador arrancados, el primer build de release tarda 30 a 45 min):

```sh
bun run qa
```

**Solo la UI**: `bun run e2e android` o `bun run e2e ios` (`--build` compila
antes el binario si falta). Reporte: `bun run e2e:report`.

**Levantar la app** para probarla a mano, con el nivel de defectos que se quiera
(`off`, `easy`, `medium`, `hard`):

```sh
bun run dev android off
bun run dev ios hard
```

Todos los comandos, qué necesitan y cuánto tardan:
[`docs/puesta-en-marcha.html`](docs/puesta-en-marcha.html#tests).

## Estructura

- `src/`: la app (sin cambios de funcionalidad).
- `api-tests/`: suite de API (Playwright + Zod, reporte Allure).
- `e2e/`: suite de UI (Appium/WebdriverIO, iOS y Android).
- `docs/`: documentación.
- `.github/workflows/`: CI (`api.yml` y `e2e.yml`: el smoke en cada push y PR, todo de noche).
