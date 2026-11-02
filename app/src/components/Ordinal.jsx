/**
 * Nombre ordinal français avec son exposant : « 1er », « 21e » (POL-PLAY-101). Figtree n’a pas les lettres en exposant
 * d’Unicode (U+1D49, U+02B3) : l'exposant passe par <sup>, stylé dans index.css (.ordinal sup).
 */
export default function Ordinal({ n }) {
  return (
    <span className="ordinal">
      {n}
      <sup>{n === 1 ? 'er' : 'e'}</sup>
    </span>
  )
}
