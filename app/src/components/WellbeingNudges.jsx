/**
 * Deux encarts de la carte menthe du statut du jour (TESTEUR-1c) : le rappel de la lecture au déverrouillage
 * (POL-PLAY-84) et la calibration de départ (BE-BIAIS-2). Sortis de l'ancienne carte « Bien-être estimé »,
 * supprimée avec TESTEUR-1d-b (courbe et détails sont dans l'historique du bien-être).
 */
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/brand'
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
 * Calibration de départ (BE-BIAIS-2, retour (5) du 04/11 ; AUJ-2b, revue du 07/11) : tant que 3 jours n'ont pas à la
 * fois une note et une lecture, le bloc demande la note du jour, avec la progression, et deux gestes : « Remplir
 * maintenant » (bouton plein, l'action principale) et « Recevoir un rappel » le soir. Jamais bloquant ; une fois la
 * note du jour donnée, une ligne discrète suffit.
 */
export function StartCalibration({ cal, onAddManual, onReminder }) {
  const steps = (
    <span className="mood-calib-steps" aria-hidden="true">
      {Array.from({ length: cal.needed }, (_, i) => <span key={i} className={i < cal.done ? 'is-on' : ''} />)}
    </span>
  )
  const title = `Calibration du bien-être : ${jours(cal.done)} sur ${cal.needed}`
  if (cal.notedToday || !onAddManual) {
    return (
      <p className="mood-calib is-quiet">
        {steps}
        {title}. Prochaine note demain.
      </p>
    )
  }
  return (
    <div className="mood-calib" role="note">
      <p className="mood-calib-title">{steps}{title}</p>
      <p className="mood-calib-text">
        Notez votre bien-être chaque jour pendant {cal.needed} jours : {APP_NAME} règle la lecture de votre visage sur vous.
      </p>
      <button type="button" className="mood-calib-button" onClick={onAddManual}>Remplir maintenant</button>
      {onReminder && (
        <button type="button" className="mood-calib-button is-secondary" onClick={onReminder}>Recevoir un rappel</button>
      )}
    </div>
  )
}
