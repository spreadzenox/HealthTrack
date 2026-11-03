import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FEATURES, STORE } from '../config/distribution'
import { dismissLaunchEndNotice, dismissLaunchEndedNotice, launchEndNotice, launchEndedNotice } from '../services/entitlement'
import { useEntitlement } from '../hooks/useEntitlement'
import './TodayCards.css'

/**
 * Carte de l'Accueil, 3 jours avant la fin de Gold offert pendant le test (FIN-LANCEMENT-1) : dit la date et ce qui
 * reste gratuit, une fois par date de fin. Variante play seulement ; jamais dans l'app iPhone (l'examen d'Apple doit
 * voir l'écran d'achat, pas une carte de fin de test).
 * Après la fin, une seule fois : « Le test est terminé. Merci ! » (FIN-LANCEMENT-2).
 */
export default function LaunchEndCard({ now }) {
  const [ent] = useEntitlement()
  const [closed, setClosed] = useState(false)
  const enabled = FEATURES.billing && STORE.id !== 'appstore' && !closed
  const opts = now ? { now } : {}
  const notice = enabled ? launchEndNotice(ent, opts) : null
  const ended = enabled && !notice ? launchEndedNotice(ent, opts) : null
  if (!notice && !ended) return null
  const close = () => {
    if (notice) dismissLaunchEndNotice(notice.until)
    else dismissLaunchEndedNotice(ended.until)
    setClosed(true)
  }
  return (
    <section className="today-card launch-end-card" role="status" aria-labelledby="launch-end-title">
      <div className="launch-end-head">
        <h3 id="launch-end-title" className="today-card-title">
          {notice ? `Gold offert jusqu’au ${notice.lastDay}` : 'Le test est terminé. Merci !'}
        </h3>
        <button type="button" className="launch-end-close" onClick={close} aria-label="Fermer">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className="today-card-text">
        {notice
          ? 'Ensuite, le journal, les montres, le bien-être estimé et l’export restent gratuits.'
          : 'Rien n’est effacé : votre journal et vos mesures restent dans l’app.'}
      </p>
      <Link to="/premium" className="launch-end-link" onClick={close}>
        {notice ? 'Voir ce que comprend Gold' : 'Voir les formules'}
      </Link>
    </section>
  )
}
