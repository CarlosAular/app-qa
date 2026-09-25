/**
 * Los niveles de defectos de la API (EXPO_PUBLIC_BUGS_TIER) y las plataformas
 * de la suite de UI, en el orden en que se corren y se muestran. Los comparten
 * scripts/e2e-tiers.mjs y los que arman el reporte de todas las corridas.
 */
export const TIERS = ["off", "easy", "medium", "hard"]
export const PLATFORMS = ["android", "ios"]

export const PLATFORM_NAMES = {android: "Android", ios: "iOS"}

/**
 * Cómo se llama una corrida en los reportes: "1 · off · Android". El número es
 * el orden en que se corren (nivel y luego plataforma): como Allure ordena los
 * árboles por nombre, sin él quedarían easy, hard, medium, off.
 */
export const runName = (tier, platform) =>
  `${TIERS.indexOf(tier) * PLATFORMS.length + PLATFORMS.indexOf(platform) + 1} · ` +
  `${tier} · ${PLATFORM_NAMES[platform]}`
