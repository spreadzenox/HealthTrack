import './DomainTag.css'

const LABELS = { gut: 'Ventre', wellbeing: 'Bien-être' }

/**
 * VENTRE-BE-1 (retour (3) du 04/11) : ce sur quoi porte une piste, en toutes lettres, au-dessus de son titre.
 * Pêche = ventre, menthe = bien-être (DESIGN.md). Une ligne d'en-tête, pour ne pas se confondre avec les badges.
 */
export default function DomainTag({ domain }) {
  return <span className={`domain-tag domain-tag--${domain}`}>{LABELS[domain]}</span>
}
