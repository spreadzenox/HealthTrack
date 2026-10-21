import { Link, useLocation } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries } from '../services/whatsNew'

/** Pages rangées derrière le bouton « Réglages » (en haut à droite, jalon 2c). */
const SETTINGS_PATHS = ['/plus', '/data', '/settings', '/nouveautes']

export default function SettingsButton({ changelog = CHANGELOG }) {
  // Relu à chaque navigation (la page Nouveautés marque tout comme vu).
  const { pathname } = useLocation()
  const hasUnseen = getUnseenEntries(changelog, getLastSeenId()).length > 0
  const active = SETTINGS_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <Link
      to="/plus"
      className={'settings-button' + (active ? ' active' : '')}
      aria-label={hasUnseen ? 'Réglages (nouveautés non lues)' : 'Réglages'}
      aria-current={active ? 'page' : undefined}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
      {hasUnseen && <span className="settings-button-badge" />}
    </Link>
  )
}
