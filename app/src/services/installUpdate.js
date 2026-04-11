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
  } catch {
    // Fallback si Capacitor non dispo (web)
  }

  // Web ou pas d'APK : ouvrir dans le navigateur
  window.open(apkOrReleaseUrl, '_blank', 'noopener,noreferrer')
  return { ok: true }
}

/**
 * Télécharge l'APK puis lance l'installateur Android (1 clic).
 *
 * Utilise CapacitorHttp (requête HTTP native) au lieu du fetch() du WebView
 * pour éviter les erreurs CORS/redirect lors du téléchargement depuis GitHub CDN.
 * CapacitorHttp.get avec responseType 'arraybuffer' retourne la donnée encodée
 * en base64, prête à être écrite via Filesystem.writeFile.
 */
async function installApkOnAndroid(apkUrl) {
  const { CapacitorHttp } = await import('@capacitor/core')
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { AppInstallPlugin } = await import('@m430/capacitor-app-install')

  const path = 'HealthTrack-update.apk'

  try {
    const { granted } = await AppInstallPlugin.canInstallUnknownApps()
    if (!granted) {
      await AppInstallPlugin.openInstallUnknownAppsSettings()
      return {
        ok: false,
        message: "Autorisez l'installation depuis cette source dans les réglages, puis réessayez.",
      }
    }

    // CapacitorHttp contourne les restrictions CORS du WebView Android.
    // responseType 'arraybuffer' indique au plugin natif de retourner la réponse
    // encodée en base64 — format attendu par Filesystem.writeFile.
    const response = await CapacitorHttp.get({
      url: apkUrl,
      responseType: 'arraybuffer',
    })
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Téléchargement échoué: ${response.status}`)
    }

    await Filesystem.writeFile({
      path,
      data: response.data,
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
      message: e?.message || "Erreur lors du téléchargement ou de l'installation.",
    }
  }
}
