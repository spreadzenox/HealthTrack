/**
 * Vérification des mises à jour via GitHub Releases.
 * Compare la version courante avec la dernière release et fournit l'URL de téléchargement (APK).
 */

const GITHUB_API = 'https://api.github.com'
const REPO_OWNER = 'spreadzenox'
const REPO_NAME = 'HealthTrack'

/**
 * Version courante de l'app (injectée au build par Vite).
 */
export const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

/**
 * Récupère la dernière release publique du dépôt.
 * @returns {{ tag_name: string, html_url: string, assets: Array<{ name: string, browser_download_url: string }> } | null}
 */
export async function fetchLatestRelease() {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      { cache: 'no-store', headers: { Accept: 'application/vnd.github.v3+json' } }
    )
    if (!res.ok) return null
    return await res.json()
  } catch (_) {
    return null
  }
}

/**
 * Extrait un numéro de version comparable du tag (ex: "v42" -> 42, "v1.0.0" -> 1.0.0).
 */
function parseVersion(tag) {
  if (!tag || typeof tag !== 'string') return null
  const s = tag.replace(/^v/i, '').trim()
  if (!s) return null
  const num = parseInt(s, 10)
  if (!Number.isNaN(num) && String(num) === s) return num
  return s
}

/**
 * Compare deux versions (nombre ou chaîne semver).
 * @returns true si latest > current
 */
export function isNewerVersion(latestTag, currentVersion) {
  const latest = parseVersion(latestTag)
  const current = parseVersion(currentVersion)
  if (latest == null) return false
  if (current == null || currentVersion === 'dev' || currentVersion === '') return true
  if (typeof latest === 'number' && typeof current === 'number') return latest > current
  if (typeof latest === 'string' && typeof current === 'string') return latest > current
  return String(latest) > String(current)
}

/**
 * Retourne l'URL de téléchargement de l'APK pour la release, ou la page de la release.
 */
export function getUpdateUrl(release) {
  if (!release?.assets?.length) return release?.html_url || null
  const apk = release.assets.find((a) => a.name && a.name.endsWith('.apk'))
  return apk?.browser_download_url || release.html_url || null
}
