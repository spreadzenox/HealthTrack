// MONO-CHIFFRES (10/11, leçon de design 11 : « police mono pour les chiffres seulement ») : dans « 6 h 30 » ou
// « 49 ms », la police mono donnait aux espaces et aux unités une chasse fixe (« 6  h  30 », « 10  085 », « 36 , 6 »).
// Seules les suites de chiffres (avec leur signe) passent en mono ; unités, mots, espace des milliers et virgule
// restent dans la police du texte.
// Texte inchangé (les tests et l'accessibilité lisent la même chaîne).
const NUMBER = /([+\-−]?\d+)/
const THOUSANDS = /^[\u202f\u00a0 ]$/

export function monoDigits(text) {
  if (text == null || text === '') return text
  const s = String(text)
  const parts = s.split(NUMBER)
  if (parts.length === 1) return s
  return parts.map((part, i) => {
    if (i % 2 === 0) return part || null
    // Espace des milliers (« 10 085 ») : trop fine dans la police du texte ; le groupe d'avant prend une petite marge
    // (l'espace reste un nœud de texte : nom accessible et texte inchangés).
    const thousands = THOUSANDS.test(parts[i + 1] ?? '') && /^\d{3}$/.test(parts[i + 2] ?? '')
    return <span key={i} className={thousands ? 'mono mono-sep' : 'mono'}>{part}</span>
  }).filter((x) => x !== null)
}
