import { useState, useEffect, useCallback } from 'react'
import {
  fetchLatestRelease,
  isNewerVersion,
  getUpdateUrl,
  CURRENT_VERSION,
} from '../services/updateCheck'
import { installUpdate } from '../services/installUpdate'
import './UpdateBanner.css'

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 min

export default function UpdateBanner() {
  const [release, setRelease] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const check = useCallback(async () => {
    const latest = await fetchLatestRelease()
    if (!latest) return
    if (isNewerVersion(latest.tag_name, CURRENT_VERSION)) {
      setRelease(latest)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [check])

  const handleUpdate = async () => {
    const url = getUpdateUrl(release)
    if (!url) return
    setError(null)
    setLoading(true)
    try {
      const result = await installUpdate(url)
      if (!result.ok && result.message) setError(result.message)
    } finally {
      setLoading(false)
    }
  }

  if (!release || dismissed) return null

  const versionLabel = release.tag_name.replace(/^v/i, '')
  const url = getUpdateUrl(release)
  const isApk = url && url.endsWith('.apk')

  return (
    <div className="update-banner" role="alert" aria-live="polite">
      <p className="update-banner-text">
        Une mise à jour est disponible (version {versionLabel}).
        {isApk
          ? ' Mise à jour en un clic : téléchargement puis installation.'
          : ' Ouvrez le lien pour télécharger la dernière version.'}
      </p>
      {error && <p className="update-banner-error">{error}</p>}
      <div className="update-banner-actions">
        <button
          type="button"
          className="btn update-banner-btn"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? 'Téléchargement…' : isApk ? 'Mise à jour en 1 clic' : 'Voir la mise à jour'}
        </button>
        <button
          type="button"
          className="btn btn-secondary update-banner-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
