/**
 * Divulgation avant une autorisation sensible (jalon 3b) : une feuille modale qui dit ce qui est lu, pourquoi
 * et ce qui sort du téléphone, avec un bouton d'accord explicite. Textes dans config/permissionDisclosures.js,
 * styles dans App.css (chargé d'emblée).
 *
 * Usage (hooks/useDisclosure.jsx) : `const [disclosure, askConsent] = useDisclosure()` ; rendre `{disclosure}` ; puis
 * `if (!(await askConsent('camera'))) return` juste avant la demande à Android.
 */
import { disclosureFor } from '../config/permissionDisclosures'

export function PermissionDisclosure({ kind, onAccept, onDecline }) {
  const d = disclosureFor(kind)
  const titleId = `disclosure-${kind}-title`
  return (
    <div className="disclosure-backdrop" role="presentation">
      <div className="disclosure-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="disclosure-title">{d.title}</h2>
        <ul className="disclosure-points">
          {d.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p className="disclosure-leaves">{d.leaves}</p>
        <div className="disclosure-actions">
          <button type="button" className="btn btn-primary disclosure-btn" onClick={onAccept}>{d.accept}</button>
          <button type="button" className="btn btn-secondary disclosure-btn" onClick={onDecline}>{d.decline}</button>
        </div>
      </div>
    </div>
  )
}
