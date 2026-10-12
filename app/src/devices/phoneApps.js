/**
 * Apps du téléphone : détection des apps santé installées et ouverture d'une app, via
 * `@capacitor/app-launcher` (sans plugin natif maison). Partagé par « Mes appareils » et le
 * diagnostic de la montre Huawei.
 */
import { detectInstalledApps } from './healthApps'

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
  return detectInstalledApps(async (pkg) => (await launcher.canOpenUrl({ url: pkg }))?.value === true)
}

export async function openPhoneApp(pkg) {
  const launcher = await getAppLauncher()
  await launcher?.openUrl({ url: pkg })
}
