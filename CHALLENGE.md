# Challenge QA Automation

**Resumen:**
Tenés una app de trading en React Native (Expo) ya desarrollada, que consume una
API de instrumentos, portafolio y órdenes. Tu trabajo no es agregarle
funcionalidad: es evaluar su calidad y automatizar su validación.

Tiempo estimado: **una semana**.

## Cómo levantar el proyecto

Seguí el [README](README.md). Necesitás Bun, un simulador de iOS o un emulador
de Android, y un archivo `.env` copiado de `.env.example`.

Dos variables importantes:

- `EXPO_PUBLIC_CANDIDATE_ID`: poné un valor propio (por ejemplo tu nombre). La
  API usa ese id para aislar tu estado del de otros candidatos.
- `EXPO_PUBLIC_BUGS_TIER`: **dejalo en `off`**. La API expone otros valores que
  activan defectos intencionales; quedan fuera del alcance de este challenge.

## Qué hace la app

- **Instrumentos**: listado con ticker, nombre, último precio y retorno diario
  calculado a partir de `last_price` y `close_price`.
- **Portafolio**: efectivo disponible y posiciones con ticker, cantidad, valor de
  mercado, ganancia y rendimiento total.
- **Búsqueda**: buscador de instrumentos por ticker.
- **Envío de órdenes**: formulario en un bottom sheet, con `BUY` o `SELL`,
  `MARKET` o `LIMIT`, cantidad en acciones exactas o en un monto en pesos, y
  precio sólo cuando es `LIMIT`. Muestra el id y el estado devuelto.
- **Órdenes**: historial de órdenes enviadas, con su estado, y una acción para
  reiniciar la cuenta.

## Reglas de negocio de la API

Las necesitás para poder escribir aserciones sobre resultados esperados.

- Cada candidato arranca con **1.000.000 ARS** y sin posiciones. El portafolio
  (efectivo y tenencias) se **deriva de tus órdenes en estado `FILLED`**: no hay
  saldo guardado aparte.
- Las órdenes `MARKET` se ejecutan al `last_price` del instrumento.
- Una `LIMIT` de compra se ejecuta si el precio enviado es **mayor o igual** al
  `last_price`; una `LIMIT` de venta se ejecuta si es **menor o igual**. Si no,
  queda en `PENDING`.
- El estado de una orden es `FILLED` o `PENDING`.
- La API rechaza con **HTTP 400** y un cuerpo `{ "error": "..." }` cuando el
  instrumento no existe, falta el precio en una `LIMIT`, la cantidad no es un
  entero positivo, no alcanza el efectivo en una compra, o no alcanzan las
  acciones en una venta. Las órdenes rechazadas no se persisten.
- Los precios están en pesos y no se admiten fracciones de acciones.
- `avg_cost_price` es el precio promedio ponderado de compra. El valor de
  mercado de una posición es `quantity * last_price`.
- Tu estado **persiste** entre corridas. `POST /reset` lo borra, lo cual puede
  servirte para preparar o limpiar escenarios.

### Endpoints

Base: `https://dummy-api-topaz.vercel.app`

| Método | Path           | Descripción                                     |
| ------ | -------------- | ----------------------------------------------- |
| GET    | `/instruments` | Listado completo de instrumentos.               |
| GET    | `/search`      | Filtra instrumentos por el query param `query`. |
| GET    | `/portfolio`   | Efectivo y tenencias derivadas de tus órdenes.  |
| GET    | `/orders`      | Tu historial de órdenes.                        |
| POST   | `/orders`      | Valida, ejecuta y persiste una orden.           |
| POST   | `/reset`       | Borra tu estado para empezar de cero.           |

Todos los requests necesitan el header `X-Enable-Bugs: off`. Los endpoints de
portafolio, órdenes y reset además necesitan `X-Candidate-Id`.

## Qué esperamos de vos

El alcance es abierto a propósito. **Vos decidís**:

- Qué niveles de test cubrir (UI en dispositivo, API, unitarios) y por qué.
- Con qué herramientas trabajar.
- Qué entregar al final.

Queremos ver cómo pensás una estrategia de calidad sobre un código que no
escribiste, no que adivines una solución que ya tenemos en mente.

## Consideraciones

- La app puede tener problemas de calidad, incluyendo cosas que **dificulten la
  automatización**. Detectarlos y documentarlos es parte del challenge.
- Si necesitás modificar la app para poder automatizarla, hacelo. Documentá qué
  cambiaste y por qué.
- Si encontrás bugs, reportalos con pasos de reproducción, resultado esperado,
  resultado obtenido y una severidad.
- Pensá en el aislamiento entre tests: varias corridas sobre el mismo estado
  persistido pueden interferir entre sí.
- Un test que falla de forma intermitente es un problema en sí mismo. Nos
  interesa que tus tests sean determinísticos.

## Entrega

Un repositorio con tu trabajo y un `README` propio que explique cómo correrlo,
qué decisiones tomaste y qué dejarías para una siguiente iteración.
