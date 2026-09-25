# Cocos QA

Challenge de QA Automation para la app de trading de Cocos (React Native +
Expo). La app ya estaba desarrollada: acá se evalúa su calidad y se automatiza
la validación.

## Resultado en una mirada

- **53 casos de prueba** en Qase: 43 automatizados (9 de API con Playwright y 34
  de UI con Appium, en iOS y Android) y 10 manuales.
- **19 defectos** reportados, con pasos, esperado, obtenido, severidad y
  evidencia: 18 abiertos y 1 resuelto.
- **12 corridas** publicadas en Qase (API y UI, en los cuatro niveles de
  defectos de la API), cada una con su reporte público.
- **Corrida completa de UI en `off`: 28 de 34** en cada plataforma. Cuatro casos
  fallan porque la app no cumple (COCOS-15, 18, 30 y 41; el test es correcto) y
  otros dos son casos inestables de la suite (COCOS-13 y 36 en Android, 8 y 28
  en iOS). Está dicho sin maquillaje en el
  [plan de pruebas](https://carlosaular.github.io/app-qa/plan-de-pruebas.html#pendientes).

## Dónde está la documentación

Los documentos son HTML. **Ya renderizados, en
<https://carlosaular.github.io/app-qa/>** (empezar por
[el mapa de cinco minutos](https://carlosaular.github.io/app-qa/overview.html)).
En local se abren directo desde `docs/`, sin servidor ni build.

| Entregable del challenge         | Dónde                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan de pruebas                  | [`plan-de-pruebas`](https://carlosaular.github.io/app-qa/plan-de-pruebas.html)                                                                                                                                                                                               |
| Reporte de bugs                  | [`reporte-de-bugs`](https://carlosaular.github.io/app-qa/reporte-de-bugs.html)                                                                                                                                                                                               |
| Suite automatizada y decisiones  | [`docs/automatizacion.md`](docs/automatizacion.md) (incluye cómo trabajar sin `POST /reset`)                                                                                                                                                                                 |
| Casos de prueba (copia de Qase)  | [`qase`](https://carlosaular.github.io/app-qa/qase.html)                                                                                                                                                                                                                     |
| Cómo levantar todo a mano        | [`puesta-en-marcha`](https://carlosaular.github.io/app-qa/puesta-en-marcha.html)                                                                                                                                                                                             |
| Glosario, contrato de API, stack | [`glosario`](https://carlosaular.github.io/app-qa/glosario.html), [`api`](https://carlosaular.github.io/app-qa/api.html), [`tecnologias`](https://carlosaular.github.io/app-qa/tecnologias.html), [`producto-y-qa`](https://carlosaular.github.io/app-qa/producto-y-qa.html) |

El proyecto de Qase (`COCOS`) es privado; los HTML de `docs/` son su copia
legible. Para entrar al proyecto existen credenciales de un rol _viewer_ (solo
lectura), que se comparten por mail. Los reportes de las 12 corridas son
públicos y abren sin cuenta (links en [`docs/qase.html`](docs/qase.html#corridas)).

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

## Decisiones tomadas

El criterio propio de qué probar y qué no está en el
[plan de pruebas](https://carlosaular.github.io/app-qa/plan-de-pruebas.html#riesgo).
Las decisiones técnicas, resumidas (el detalle y la justificación están en
[`docs/automatizacion.md`](docs/automatizacion.md)):

- **Dos niveles de prueba.** API con Playwright + Zod (contrato, saldos,
  reservas; corre en segundos y sin dispositivo) y UI con Appium (los flujos de
  dinero de punta a punta). Appium porque es el único que habla WebDriver contra
  iOS y Android: un solo Page Object Model para las dos plataformas.
- **Sin `POST /reset`.** Cada build hornea su propio `candidate id` y las
  aserciones son por delta, nunca absolutas contra el millón inicial. Sirve en un
  entorno donde el reset no existe (el requisito explícito del challenge).
- **Órdenes límite no determinísticas.** No se afirma un estado, sino un
  invariante: una orden no ejecutable nunca se ejecuta. Lo demás usa órdenes a
  mercado, que sí son determinísticas.
- **Binarios de release, no de debug**, para que la suite no dependa de Metro ni
  de LogBox. La suite usa los `accessibilityLabel` que la app ya tiene.
- **Un solo cambio en la app**: `accessible={false}` en el bottom sheet
  ([`ModalContext.tsx`](src/components/modals/ModalContext.tsx)). En iOS el sheet
  colapsaba todo el ticket en un único elemento de accesibilidad: era inoperable
  con VoiceOver (defecto #46) y no se podía automatizar. El resto de `src/` es
  del repositorio base.
- **Los tests afirman el comportamiento correcto**, así que cuatro casos de UI y
  dos de API fallan hoy por defectos de la app o del servicio, y se ponen en
  verde solos cuando se corrijan.
- **CI proporcional.** Calidad y API en cada push; de UI solo el smoke (4 casos
  de API y 4 de UI marcados `@smoke`). La suite completa de UI y iOS corren a
  pedido.
- **Qase como repositorio de casos**, privado; los HTML de `docs/` son su copia
  legible, y los reportes de las 12 corridas son públicos.

## Qué dejaría para una siguiente iteración

1. **Estabilizar los casos inestables**: COCOS-13 y 36 (Android) y COCOS-8 y 28
   (iOS). Hoy son la razón por la que la suite completa da 28 de 34.
2. **iOS en la CI**: que WebDriverAgent arranque en el runner de macOS.
3. **Reponer la corrida completa nocturna** (se quitó porque siempre daba rojo),
   con los casos que dependen de un defecto etiquetados `@defecto`, como ya se
   hizo en API.
4. **VoiceOver en un iPhone físico** (COCOS-52) y los casos de red caída
   (COCOS-14, 33 y 38).
5. **COCOS-45 por API** (doble reserva de acciones) y una colección
   Postman/REST Client para el contrato.

Detalle en la [sección 11 del plan de pruebas](https://carlosaular.github.io/app-qa/plan-de-pruebas.html#pendientes).

## Estructura

- `src/`: la app (sin cambios de funcionalidad; el único ajuste está en «Decisiones tomadas»).
- `api-tests/`: suite de API (Playwright + Zod, reporte Allure).
- `e2e/`: suite de UI (Appium/WebdriverIO, iOS y Android).
- `docs/`: documentación.
- `.github/workflows/`: CI (`api.yml`: calidad y API; `e2e.yml`: UI en Android). El smoke corre en cada push y PR; el resto, a pedido y, en API, de noche.
