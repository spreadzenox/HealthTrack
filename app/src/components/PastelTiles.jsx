import { Link } from 'react-router-dom'
import LineIcon from './LineIcon'

/**
 * Gestes d'un état vide en tuiles pastel (POL-PLAY-46, POL-PLAY-48) : plus visuel qu'une phrase grise.
 * Pastel du thème (DESIGN) : menthe = bien-être, pêche = ventre et repas, lilas = sources.
 * Avec `onClick` au lieu de `to`, la tuile est un bouton qui agit sur place (POL-PLAY-87 : ouvrir la note de
 * bien-être plutôt que renvoyer à l'Accueil, où il fallait la chercher).
 * @param {{ tiles: { to?: string, onClick?: () => void, theme: 'mint'|'peach'|'lilac', icon: string, label: string }[] }} props
 */
export default function PastelTiles({ tiles }) {
  return (
    <ul className="pastel-tiles">
      {tiles.map((t) => (
        <li key={t.label}>
          {t.onClick ? (
            <button type="button" className="pastel-tile" data-theme={t.theme} onClick={t.onClick}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </button>
          ) : (
            <Link to={t.to} className="pastel-tile" data-theme={t.theme}>
              <LineIcon name={t.icon} size={22} />
              <span>{t.label}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
