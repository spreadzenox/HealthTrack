/**
 * « ⋯ » : les actions d'une saisie (Refaire, Modifier, Supprimer) restent repliées derrière un seul bouton discret,
 * plutôt que visibles sur chaque ligne (POL-PLAY-27 pour le Journal, POL-PLAY-50 pour la page Repas).
 */
export default function EntryActionsToggle({ open, label, onToggle }) {
  return (
    <div className={`entry-edit${open ? ' entry-actions-close' : ''}`}>
      <button
        type="button"
        className="entry-delete-btn entry-actions-toggle"
        aria-expanded={open}
        aria-label={open ? `Fermer les actions de ${label}` : `Actions pour ${label}`}
        onClick={onToggle}
      >
        <span aria-hidden>{open ? '✕' : '⋯'}</span>
      </button>
    </div>
  )
}
