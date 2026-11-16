/**
 * Icônes des bulles (trait, 24 × 24, comme LineIcon) : celles qui manquent à LineIcon sont dessinées ici, dans le
 * dossier du lot, pour ne pas toucher au jeu partagé.
 */
import LineIcon from '../../components/LineIcon'

const OWN = {
  lotus: <path d="M12 18c-3.5 0-7-1.6-8.5-4 2.6-.6 5.6.2 8.5 4zm0 0c3.5 0 7-1.6 8.5-4-2.6-.6-5.6.2-8.5 4zm0 0c-2.2-2.4-2.6-6.6 0-11 2.6 4.4 2.2 8.6 0 11z" />,
  book: <path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5m0-13c2-1.5 5-1.9 8-1.5v13c-3-.4-6 0-8 1.5m0-13v13" />,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zm0 0l8-8" />,
  stretch: <path d="M12 6.5a1.6 1.6 0 1 0 0-.1zM5 9.5l7 1.5 7-1.5M12 11v4l-3 5m3-5l3 5" />,
  gift: <path d="M4 10h16v4H4zm1.5 4h13v6h-13zM12 10v10M12 10c-1.5-3.5-5-4-5-1.8 0 1.4 2.3 1.8 5 1.8zm0 0c1.5-3.5 5-4 5-1.8 0 1.4-2.3 1.8-5 1.8z" />,
}

export default function BubbleIcon({ name, size = 22 }) {
  if (!OWN[name]) return <LineIcon name={name} size={size} />
  return (
    <svg className="line-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {OWN[name]}
    </svg>
  )
}
