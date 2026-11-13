import './LineIcon.css'

/**
 * Icônes trait 24 × 24 dans le style de la barre d'onglets (VC-15 : pas d'émojis hors identité visuelle).
 * Décoratives : le texte voisin porte le sens, d'où aria-hidden.
 */
const PATHS = {
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  pen: <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3" />,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  // Bandeau d'ajout de l'Accueil (07/11) : un visage pour le bien-être, une courbe douce pour la digestion
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.2a4.2 4.2 0 0 0 7 0" />
      <circle cx="9.3" cy="9.8" r="0.6" />
      <circle cx="14.7" cy="9.8" r="0.6" />
    </>
  ),
  digestion: <path d="M9 3.5v3.2c0 1.6-3.5 2.3-3.5 6.3 0 4.4 3.3 7.5 7.4 7.5 3.6 0 6.1-2.5 6.1-5.4 0-2.7-2-4.3-4.4-4.3-1.9 0-3.1 1.2-3.1 2.8M15 3.5v2" />,
  // « Vos données du jour » (AUJ-3, leçon 9 : une icône pour toutes les mesures)
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  heart: <path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3z" />,
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  // Séance de sport (POLISH-SIM-58) : un haltère, jamais le tracé de la VFC
  dumbbell: <path d="M3.5 9.5v5M6.5 7v10M6.5 12h11M17.5 7v10M20.5 9.5v5" />,
  steps: (
    <>
      <path d="M8 3.5c1.7 0 2.6 1.9 2.6 4.2 0 2-.8 3.6-.8 5.3H6.4c0-1.7-.9-3.2-.9-5.3C5.5 5.4 6.3 3.5 8 3.5zM6.5 15.5h3.2v1.6a1.6 1.6 0 0 1-3.2 0z" />
      <path d="M16 7.5c1.7 0 2.5 1.9 2.5 4.2 0 2.1-.9 3.6-.9 5.3h-3.4c0-1.7-.8-3.3-.8-5.3 0-2.3.9-4.2 2.6-4.2zM14.3 19.5h3.2v.4a1.6 1.6 0 0 1-3.2 0z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.5h2" />
    </>
  ),
  meal: <path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1-3 3.5-3 6.5V13h3" />,
  cigarette: (
    <>
      <rect x="3" y="13" width="15" height="4" rx="1" />
      <path d="M15 13v4M20.5 13v4M20.5 10c0-2-2-2-2-4M17.5 10c0-1.5-1.5-1.5-1.5-3" />
    </>
  ),
  // Journal › Jours (ORG-2) : une icône pour chaque mesure
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  drop: <path d="M12 3.5s6 6.6 6 10.9a6 6 0 0 1-12 0c0-4.3 6-10.9 6-10.9z" />,
  wind: <path d="M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 13h15a2.5 2.5 0 1 1-2.5 2.5M3 17h7" />,
  thermo: (
    <>
      <path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z" />
      <path d="M12 10v6" />
    </>
  ),
  gauge: <path d="M4.5 17a8 8 0 1 1 15 0M12 13l3.5-4" />,
  flame: <path d="M12 3.5c.5 3-2.5 4.5-2.5 7.5a2.5 2.5 0 0 0 5 0c0-1-.5-2-1-2.5 2.5 1 4.5 3.5 4.5 6.5a6 6 0 0 1-12 0c0-5 6-6.5 6-11.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  dots: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
}

export default function LineIcon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={'line-icon ' + className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      {PATHS[name]}
    </svg>
  )
}

LineIcon.names = Object.keys(PATHS)
