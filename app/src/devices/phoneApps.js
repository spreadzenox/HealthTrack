/**
 * Apps du téléphone : détection des apps santé installées et ouverture d'une app. Partagé par « Mes appareils »
 * et le diagnostic de la montre Huawei.
 * - Détection : un seul appel natif (AppManager.installedPackages, tous les paquets du catalogue d'un coup),
 *   sinon `@capacitor/app-launcher` paquet par paquet (APK plus ancien).
 * - Ouverture : `@capacitor/app-launcher`.
 */
import { registerPlugin } from '@capacitor/core'
import { allCatalogPackages, detectInstalledApps } from './healthApps'
import { withTimeout } from '../utils/withTimeout'

/** Délais (ms) : appel natif groupé, une vérification de paquet, puis toute la détection (au-delà : échec expliqué, jamais bloqué). */
export const NATIVE_TIMEOUT_MS = 3_000
export const CHECK_TIMEOUT_MS = 2_000
export const DETECT_TIMEOUT_MS = 6_000

const NativeAppManager = registerPlugin('AppManager')

function isNative() {
  return typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true
}

/**
 * Plugin AppLauncher **dans un objet**. Un plugin Capacitor est un Proxy qui répond à toute propriété, `then`
 * compris : rendu tel quel par une fonction `async`, la promesse l'appelle comme une méthode native inexistante et
 * ne se règle jamais. C'est ce qui faisait « apps du téléphone : délai dépassé (8 s) » (capture du 18/10/2026, 15:03).
 */
async function loadAppLauncher() {
  try {
    return { launcher: (await import('@capacitor/app-launcher')).AppLauncher }
  } catch {
    return { launcher: null }
  }
}

/**
 * Apps santé du catalogue installées, ou null quand la détection est impossible (navigateur). Dans l'app, lève une
 * erreur qui dit pourquoi la détection a échoué (affichée par le diagnostic de la montre).
 */
export async function detectPhoneApps({ appManager = NativeAppManager, loadLauncher = loadAppLauncher, native = isNative() } = {}) {
  // Outil de captures (`npm run visual -- --devices`) : apps « installées » simulées dans le navigateur.
  const fake = typeof window !== 'undefined' ? window.__healthtrackFakeInstalledPackages : null
  if (Array.isArray(fake)) return detectInstalledApps(async (pkg) => fake.includes(pkg))
  if (!native) return null
  let nativeError = null
  try {
    return await detectWithAppManager(appManager)
  } catch (e) {
    nativeError = e
  }
  const { launcher } = await loadLauncher()
  if (!launcher) throw new Error(`détection native impossible (${nativeError?.message || nativeError}) et AppLauncher absent`)
  const apps = await detectWithLauncher(launcher)
  if (apps === null) throw new Error(`détection native impossible (${nativeError?.message || nativeError}), puis paquet par paquet trop longue (> ${DETECT_TIMEOUT_MS / 1000} s)`)
  return apps
}

/** Un seul aller-retour natif : `installedPackages({ packages })` → { installed: [...] } (PackageManager, sans activités). */
export async function detectWithAppManager(appManager, { timeoutMs = NATIVE_TIMEOUT_MS } = {}) {
  const res = await withTimeout(Promise.resolve().then(() => appManager.installedPackages({ packages: allCatalogPackages() })), timeoutMs, 'liste des apps')
  if (!Array.isArray(res?.installed)) throw new Error('réponse native illisible')
  const installed = new Set(res.installed)
  return detectInstalledApps(async (pkg) => installed.has(pkg))
}

/**
 * Détection via `canOpenUrl`, bornée : un paquet qui ne répond pas compte comme absent, et une détection
 * qui dépasse `totalMs` rend null (inconnu) plutôt que de bloquer l'écran qui l'attend.
 */
export async function detectWithLauncher(launcher, { checkMs = CHECK_TIMEOUT_MS, totalMs = DETECT_TIMEOUT_MS } = {}) {
  const detection = detectInstalledApps(async (pkg) => (await withTimeout(launcher.canOpenUrl({ url: pkg }), checkMs))?.value === true)
  return withTimeout(detection, totalMs).catch(() => null)
}

export async function openPhoneApp(pkg, { loadLauncher = loadAppLauncher } = {}) {
  const { launcher } = await loadLauncher()
  await launcher?.openUrl({ url: pkg })
}
