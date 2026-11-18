/**
 * LANT-1 : les lanternes du défi (DECOUPAGE-RITUEL-LANTERNES.md § 3), une par jour « avec ». Allumée = tenu (l'ambre
 * du point de l'antenne de Pilou, halo qui respire) ; éteinte = pas tenu ; contour = à venir ou tenue inconnue.
 */
import { appLocale } from '../i18n/locale.js'

const STATE_WORDS = { lit: 'tenu', out: 'pas tenu', pending: 'à venir' }

export default function TrialLanterns({ items }) {
  if (!items.length) return null
  const day = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long' })
  return (
    <ol className="trial-lanterns" aria-label="Lanternes des jours avec">
      {items.map((l) => (
        <li key={l.date} className={`trial-lantern is-${l.state}`} aria-label={`${day(l.date)} : ${STATE_WORDS[l.state]}`}>
          <svg viewBox="0 0 24 32" aria-hidden="true" focusable="false">
            {l.state === 'lit' && <circle className="trial-lantern-halo" cx="12" cy="18" r="11" />}
            <path className="trial-lantern-hook" d="M12 1v4" />
            <rect className="trial-lantern-cap" x="7" y="5" width="10" height="3" rx="1.5" />
            <rect className="trial-lantern-body" x="5" y="8" width="14" height="18" rx="5" />
            <rect className="trial-lantern-base" x="8" y="26" width="8" height="3" rx="1.5" />
          </svg>
        </li>
      ))}
    </ol>
  )
}
