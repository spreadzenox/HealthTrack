import './MethodNote.css'

/**
 * Explication de méthode repliée (« Comment c'est calculé ») : les cartes de l'accueil répétaient
 * chacune un paragraphe et « une observation, pas un diagnostic » (nettoyage du 12/10/2026).
 */
export default function MethodNote({ children }) {
  return (
    <details className="method-note">
      <summary>Comment c’est calculé</summary>
      <p className="baseline-footnote">{children}</p>
    </details>
  )
}
