/**
 * Ligne « Synchro dès que la montre se reconnecte » de la carte montre (D3 d quater, I72) : un bouton
 * « Activer » ouvre la boîte Android d'appareil compagnon ; ensuite, la ligne dit quand la montre a été vue.
 * Rien n'est affiché si Android ne le permet pas (avant Android 13, navigateur). Logique : services/watchPresence.js.
 */
import { useEffect, useState } from 'react'
import { findBondedWatch } from '../devices/huawei/pairing'
import { classicPlugin } from '../services/watchAutoSync'
import { describePresence, enableWatchPresence, getWatchPresence } from '../services/watchPresence'
import { formatAgo } from '../utils/timeAgo'

export default function WatchPresence() {
  const [presence, setPresence] = useState(null)
  const [watch, setWatch] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const classic = classicPlugin()
      const w = classic ? await findBondedWatch(classic).catch(() => null) : null
      const p = await getWatchPresence({ watch: w })
      if (!alive) return
      setWatch(w)
      setPresence(p)
    }
    load()
    // événement de présence, association créée, retour de la boîte Android
    const onVisible = () => document.visibilityState === 'visible' && load()
    window.addEventListener('watch-presence-updated', load)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.removeEventListener('watch-presence-updated', load)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const line = describePresence(presence, { formatAgo })
  if (!line) return null

  const enable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await enableWatchPresence({ watch })
      setPresence(await getWatchPresence({ watch }))
    } catch (e) {
      setMessage(`Non activé : ${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="watch-presence" aria-label="Synchro à la reconnexion de la montre">
      <p className="my-device-meta">{line.text}</p>
      {!line.enabled && watch && (
        <div className="my-device-actions">
          <button type="button" className="btn btn-secondary connector-btn" onClick={enable} disabled={busy}>
            {busy ? 'Activation…' : 'Activer'}
          </button>
        </div>
      )}
      {message && <p className="my-device-message">{message}</p>}
    </div>
  )
}
