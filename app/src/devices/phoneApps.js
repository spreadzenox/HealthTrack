/**
 * Apps du téléphone : détection des apps santé installées et ouverture d'une app, via
 * `@capacitor/app-launcher` (sans plugin natif maison). Partagé par « Mes appareils » et le
 * diagnostic de la montre Huawei.
 */
import { detectInstalledApps } from './healthApps'
import { withTimeout } from '../utils/withTimeout'

/** Délais (ms) : une vérification de paquet, puis toute la détection (au-delà : « inconnu », jamais bloqué). */
export const CHECK_TIMEOUT_MS = 2_000
export const DETECT_TIMEOUT_MS = 6_000

function isNative() {
  return typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true
}

async function getAppLauncher() {
  try {
    return (await import('@capacitor/app-launcher')).AppLauncher
  } catch {
    return null
  }
}

/** Apps santé du catalogue installées, ou null quand la détection est impossible (navigateur). */
export async function detectPhoneApps() {
  // Outil de captures (`npm run visual -- --devices`) : apps « installées » simulées dans le navigateur.
  const fake = typeof window !== 'undefined' ? window.__healthtrackFakeInstalledPackages : null
  if (Array.isArray(fake)) return detectInstalledApps(async (pkg) => fake.includes(pkg))
  if (!isNative()) return null
  const launcher = await getAppLauncher()
  if (!launcher) return null
  return detectWithLauncher(launcher)
}

/**
 * Détection via `canOpenUrl`, bornée : un paquet qui ne répond pas compte comme absent, et une détection
 * qui dépasse `totalMs` rend null (inconnu) plutôt que de bloquer l'écran qui l'attend.
 */
export async function detectWithLauncher(launcher, { checkMs = CHECK_TIMEOUT_MS, totalMs = DETECT_TIMEOUT_MS } = {}) {
  const detection = detectInstalledApps(async (pkg) => (await withTimeout(launcher.canOpenUrl({ url: pkg }), checkMs))?.value === true)
  return withTimeout(detection, totalMs).catch(() => null)
}

export async function openPhoneApp(pkg) {
  const launcher = await getAppLauncher()
  await launcher?.openUrl({ url: pkg })
}
