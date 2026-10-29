import { Link } from 'react-router-dom'
import LineIcon from './LineIcon'

/**
 * Gestes d'un état vide en tuiles pastel (POL-PLAY-46, POL-PLAY-48) : plus visuel qu'une phrase grise.
 * Pastel du thème (DESIGN) : menthe = bien-être, pêche = ventre et repas, lilas = sources.
 * @param {{ tiles: { to: string, theme: 'mint'|'peach'|'lilac', icon: string, label: string }[] }} props
 */
export default function PastelTiles({ tiles }) {
  return (
    <ul className="pastel-tiles">
      {tiles.map((t) => (
        <li key={t.label}>
          <Link to={t.to} className="pastel-tile" data-theme={t.theme}>
            <LineIcon name={t.icon} size={22} />
            <span>{t.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
