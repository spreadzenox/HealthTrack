import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FEATURES, STORE } from '../config/distribution'
import { dismissLaunchEndNotice, launchEndNotice } from '../services/entitlement'
import { useEntitlement } from '../hooks/useEntitlement'
import './TodayCards.css'

/**
 * Carte de l'Accueil, 3 jours avant la fin de Gold offert pendant le test (FIN-LANCEMENT-1) : dit la date et ce qui
 * reste gratuit, une fois par date de fin. Variante play seulement ; jamais dans l'app iPhone (l'examen d'Apple doit
 * voir l'écran d'achat, pas une carte de fin de test).
 */
export default function LaunchEndCard({ now }) {
  const [ent] = useEntitlement()
  const [closed, setClosed] = useState(false)
  const notice = FEATURES.billing && STORE.id !== 'appstore' && !closed ? launchEndNotice(ent, now ? { now } : {}) : null
  if (!notice) return null
  const close = () => {
    dismissLaunchEndNotice(notice.until)
    setClosed(true)
  }
  return (
    <section className="today-card launch-end-card" role="status" aria-labelledby="launch-end-title">
      <div className="launch-end-head">
        <h3 id="launch-end-title" className="today-card-title">Gold offert jusqu’au {notice.lastDay}</h3>
        <button type="button" className="launch-end-close" onClick={close} aria-label="Fermer">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className="today-card-text">
        Ensuite, le journal, les montres, le bien-être estimé et l’export restent gratuits.
      </p>
      <Link to="/premium" className="launch-end-link" onClick={close}>Voir ce que comprend Gold</Link>
    </section>
  )
}
