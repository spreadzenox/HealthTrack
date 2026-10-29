import { Link } from 'react-router-dom'
import LineIcon from './LineIcon'
import { gutCardMode } from '../settings/onboarding'

/**
 * Journal vierge (POL-PLAY-46) : trois tuiles pastel (repas, ventre ou bien-être, source) au lieu d'une phrase grise
 * (« un peu triste », retour 6 du 24/10). Le ventre n'est proposé que si sa carte est sur l'Accueil (gutCardMode) ;
 * sinon, la note de bien-être de la carte « Bien-être estimé ».
 */
export default function JournalEmpty() {
  const gut = gutCardMode() === 'show'
  const tiles = [
    { to: '/food', theme: 'peach', icon: 'camera', label: 'Photographier un repas' },
    gut
      ? { to: '/', theme: 'peach', icon: 'pen', label: 'Noter votre ventre' }
      : { to: '/', theme: 'mint', icon: 'pen', label: 'Noter votre bien-être' },
    { to: '/connectors', theme: 'lilac', icon: 'plus', label: 'Ajouter une source' },
  ]
  return (
    <div className="journal-empty">
      <p className="journal-empty-title">Rien de noté pour l’instant</p>
      <p className="journal-empty-text">Vos jours s’afficheront ici, en couleur.</p>
      <ul className="journal-empty-tiles">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link to={t.to} className="journal-empty-tile" data-theme={t.theme}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
