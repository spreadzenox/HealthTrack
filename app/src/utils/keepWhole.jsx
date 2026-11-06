// KEEP-WHOLE (06/11) : un mot composé (« bien-être », « peut-être ») ne se coupe pas au trait d'union dans un titre
// court (« Vos pistes du bien- / être » à 360 px). Le texte reste identique : seul un span insécable l'entoure.
const COMPOUND = /(\p{L}+(?:-\p{L}+)+)/u

export function keepWhole(text) {
  if (!text || !COMPOUND.test(text)) return text
  return text.split(COMPOUND).map((part, i) =>
    i % 2 === 1 ? <span key={i} style={{ whiteSpace: 'nowrap' }}>{part}</span> : part,
  )
}

// KEEP-SEGMENTS (06/11 13:35, revue C1 en grande police à 360 px) : une ligne de chiffres « a · b · c » ne se coupe
// qu'aux points médians (« 6 notes / à la main » ou « 76 / jours de données » sinon). Texte inchangé.
export function keepSegments(parts, sep = ' · ') {
  const list = parts.filter(Boolean)
  return list.flatMap((part, i) => [
    i > 0 ? sep : null,
    <span key={i} style={{ whiteSpace: 'nowrap' }}>{part}</span>,
  ]).filter((x) => x !== null)
}
