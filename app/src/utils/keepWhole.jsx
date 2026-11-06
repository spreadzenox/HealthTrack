// KEEP-WHOLE (06/11) : un mot composé (« bien-être », « peut-être ») ne se coupe pas au trait d'union dans un titre
// court (« Vos pistes du bien- / être » à 360 px). Le texte reste identique : seul un span insécable l'entoure.
const COMPOUND = /(\p{L}+(?:-\p{L}+)+)/u

export function keepWhole(text) {
  if (!text || !COMPOUND.test(text)) return text
  return text.split(COMPOUND).map((part, i) =>
    i % 2 === 1 ? <span key={i} style={{ whiteSpace: 'nowrap' }}>{part}</span> : part,
  )
}
