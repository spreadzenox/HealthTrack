/**
 * Deux encarts de la carte menthe du statut du jour (TESTEUR-1c) : le rappel de la lecture au déverrouillage
 * (POL-PLAY-84) et la calibration de départ (BE-BIAIS-2). Sortis de l'ancienne carte « Bien-être estimé »,
 * supprimée avec TESTEUR-1d-b (courbe et détails sont dans l'historique du bien-être).
 */
import { Link } from 'react-router-dom'
import './WellbeingNudges.css'

/**
 * Rappel discret, une seule fois (POL-PLAY-84) : pour qui a répondu « Plus tard » à la lecture au déverrouillage
 * dans l'onboarding. Le lien mène à Sources, où l'activation reste derrière sa divulgation ; la croix le ferme pour
 * de bon. Aucun chiffre de précision.
 */
export function UnlockReminder({ onDismiss }) {
  return (
    <div className="mood-unlock-reminder" role="note">
      <p>
        À chaque déverrouillage, bien plus de lectures : une estimation plus solide.{' '}
        <Link to="/connectors" onClick={onDismiss}>Voir dans Sources</Link>
      </p>
      <button type="button" className="mood-unlock-close" onClick={onDismiss} aria-label="Ne plus afficher ce rappel">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

const jours = (n) => `${n} ${n > 1 ? 'jours' : 'jour'}`

/**
 * Calibration de départ (BE-BIAIS-2, retour (5) du 04/11) : tant que 3 jours n'ont pas à la fois une note et une
 * lecture, la carte demande la note du jour, avec la progression. Jamais bloquant ; une fois la note du jour donnée,
 * une ligne discrète suffit.
 */
export function StartCalibration({ cal, onAddManual }) {
  const steps = (
    <span className="mood-calib-steps" aria-hidden="true">
      {Array.from({ length: cal.needed }, (_, i) => <span key={i} className={i < cal.done ? 'is-on' : ''} />)}
    </span>
  )
  if (cal.notedToday || !onAddManual) {
    return (
      <p className="mood-calib is-quiet">
        {steps}
        Réglage sur vous : {jours(cal.done)} sur {cal.needed}. Prochaine note demain.
      </p>
    )
  }
  return (
    <div className="mood-calib" role="note">
      <p className="mood-calib-title">{steps}Réglage sur vous : {jours(cal.done)} sur {cal.needed}</p>
      <p className="mood-calib-text">
        Chaque visage se lit un peu différemment. Une note par jour pendant {cal.needed} jours cale l’estimation sur vous.
      </p>
      <button type="button" className="mood-calib-button" onClick={onAddManual}>Noter mon bien-être du jour</button>
    </div>
  )
}
