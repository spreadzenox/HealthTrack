import { Link } from 'react-router-dom'
import LineIcon from './LineIcon'
import MealPhotoButton from './MealPhotoButton'

/**
 * Gestes d'un état vide en tuiles pastel (POL-PLAY-46, POL-PLAY-48) : plus visuel qu'une phrase grise.
 * Pastel du thème (DESIGN) : menthe = bien-être, pêche = digestion et repas, gris = sources (AUJ-8).
 * Avec `onClick` au lieu de `to`, la tuile est un bouton qui agit sur place (POL-PLAY-87 : ouvrir la note de
 * bien-être plutôt que renvoyer à l'Accueil, où il fallait la chercher).
 * Avec `state`, le lien le passe à la page d'arrivée (ex. `{ open: 'digestion' }` : Aujourd'hui ouvre « Ma digestion »).
 * Avec `mealPhoto`, la tuile ouvre directement l'appareil photo (TESTEUR-4b).
 * @param {{ tiles: { to?: string, state?: object, mealPhoto?: boolean, onClick?: () => void, theme: 'mint'|'peach'|'lilac'|'stone', icon: string, label: string }[] }} props
 */
export default function PastelTiles({ tiles }) {
  return (
    <ul className="pastel-tiles">
      {tiles.map((t) => (
        <li key={t.label}>
          {t.mealPhoto ? (
            <MealPhotoButton className="pastel-tile" theme={t.theme}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </MealPhotoButton>
          ) : t.onClick ? (
            <button type="button" className="pastel-tile" data-theme={t.theme} onClick={t.onClick}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </button>
          ) : (
            <Link to={t.to} state={t.state} className="pastel-tile" data-theme={t.theme}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
