/**
 * Lance la mise à jour : sur Android (Capacitor), télécharge l'APK et ouvre l'installateur.
 * Sinon ouvre l'URL dans le navigateur.
 *
 * @param {string} apkOrReleaseUrl - URL directe de l'APK ou de la page de release
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function installUpdate(apkOrReleaseUrl) {
  if (!apkOrReleaseUrl) return { ok: false, message: 'Aucune URL' }

  const isApk = apkOrReleaseUrl.toLowerCase().endsWith('.apk')

  try {
    const cap = await import('@capacitor/core').then((m) => m.Capacitor).catch(() => null)
    const isNative = cap?.isNativePlatform?.() ?? false
    const isAndroid = cap?.getPlatform?.() === 'android'

    if (isAndroid && isApk && isNative) {
      return await installApkOnAndroid(apkOrReleaseUrl)
    }
  } catch (_) {
    // Fallback si Capacitor non dispo (web)
  }

  // Web ou pas d'APK : ouvrir dans le navigateur
  window.open(apkOrReleaseUrl, '_blank', 'noopener,noreferrer')
  return { ok: true }
}

/**
 * Télécharge l'APK puis lance l'installateur Android (1 clic).
 */
async function installApkOnAndroid(apkUrl) {
  const { Capacitor } = await import('@capacitor/core')
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { AppInstallPlugin } = await import('@m430/capacitor-app-install')

  const path = 'HealthTrack-update.apk'

  try {
    const { granted } = await AppInstallPlugin.canInstallUnknownApps()
    if (!granted) {
      await AppInstallPlugin.openInstallUnknownAppsSettings()
      return {
        ok: false,
        message: 'Autorisez l’installation depuis cette source dans les réglages, puis réessayez.',
      }
    }

    const res = await fetch(apkUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Téléchargement échoué: ${res.status}`)

    const blob = await res.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = arrayBufferToBase64(new Uint8Array(arrayBuffer))

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    })

    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    const filePath = uri.startsWith('file://') ? uri.slice(7) : uri

    const result = await AppInstallPlugin.installApk({ filePath })
    if (result?.completed) return { ok: true }
    return { ok: false, message: result?.message || 'Installation non terminée' }
  } catch (e) {
    return {
      ok: false,
      message: e?.message || 'Erreur lors du téléchargement ou de l’installation.',
    }
  }
}

function arrayBufferToBase64(bytes) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
