import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeWithingsCode, fetchAndCacheWithingsUser } from '../services/withingsApi'
import '../Food.css'

/**
 * OAuth2 redirect handler for Withings (redirect_uri must point here).
 */
export default function WithingsCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  // Paramètres de retour invalides : erreur connue dès le premier rendu, sans appel réseau.
  const [paramError] = useState(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const savedState = sessionStorage.getItem('withings_oauth_state')
    if (!code) return 'Code d’autorisation manquant.'
    if (state && savedState && state !== savedState) return 'État OAuth invalide (protection CSRF).'
    return null
  })

  useEffect(() => {
    if (paramError) return
    const code = searchParams.get('code')

    sessionStorage.removeItem('withings_oauth_state')

    ;(async () => {
      try {
        await exchangeWithingsCode(code)
        try {
          await fetchAndCacheWithingsUser()
        } catch {
          // non-blocking
        }
        setStatus('ok')
        window.dispatchEvent(new CustomEvent('health-entries-updated'))
        setTimeout(() => navigate('/connectors', { replace: true }), 1500)
      } catch (e) {
        setStatus('error')
        setError(e.message || 'Connexion impossible')
      }
    })()
  }, [searchParams, navigate, paramError])

  const shownStatus = paramError ? 'error' : status
  const shownError = paramError ?? error

  return (
    <section className="food-page">
      <h2 className="page-title">Connexion Withings</h2>
      {shownStatus === 'loading' && <p>Connexion en cours…</p>}
      {shownStatus === 'ok' && (
        <p className="hint hint-success">
          ✓ Compte Withings connecté. Redirection vers les connecteurs…
        </p>
      )}
      {shownStatus === 'error' && (
        <>
          <p className="hint hint-error" role="alert">{shownError}</p>
          <Link to="/connectors" className="btn btn-secondary">Retour aux connecteurs</Link>
        </>
      )}
    </section>
  )
}
