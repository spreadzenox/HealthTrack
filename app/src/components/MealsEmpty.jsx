import LineIcon from './LineIcon'
import { gutCardMode } from '../settings/onboarding'

/**
 * Repas vierges (POL-PLAY-88) : une carte pêche en trois étapes au lieu d'une phrase grise seule (« un peu triste »,
 * retour 6 du 24/10). Le ventre n'est nommé que si sa carte est proposée (gutCardMode) ; sinon « vos jours ».
 */
export default function MealsEmpty() {
  const gut = gutCardMode() !== 'hide'
  const steps = [
    { icon: 'camera', label: 'Une photo ou quelques mots' },
    { icon: 'sparkle', label: 'L’heure et les aliments notés' },
    { icon: 'document', label: gut ? 'Comparés à votre ventre' : 'Comparés à vos jours' },
  ]
  return (
    <div className="meals-empty">
      <p className="meals-empty-title">Aucun repas enregistré pour l’instant</p>
      <ol className="meals-empty-steps">
        {steps.map((s, i) => (
          <li key={s.label}>
            <span className="meals-empty-num">{String(i + 1).padStart(2, '0')}</span>
            <LineIcon name={s.icon} size={20} />
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
