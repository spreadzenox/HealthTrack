/**
 * Découpage simple d'un nom en syllabes françaises, pour les sauts de Pilou quand on le nomme (SPEC comprendre § 3) :
 * un groupe de voyelles = une syllabe, le « e » muet final ne compte pas. Au-delà de 3 syllabes, deux sauts (début et
 * fin). Chiffres, emojis, nom composé : au moins un saut, jamais d'erreur.
 */
const VOWELS = /[aeiouyàâäéèêëîïôöùûüœæ]+/gi

export function syllableCount(name) {
  const word = String(name || '').toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüœæç]+/g, ' ').trim()
  if (!word) return 1
  return word.split(' ').reduce((sum, w) => {
    // hiatus avec « é » (Zoé, Léa) : deux syllabes
    const groups = w.replace(/([aeiouyàâ])([éè])/g, '$1-$2').replace(/([éè])([aeiouyà])/g, '$1-$2').match(VOWELS) || []
    let n = groups.length
    // « e » muet final (Lune, Pomme), sauf mot d'une seule syllabe (Le)
    if (n > 1 && /[^aeiouy]e?s?$/.test(w) && /e$|es$/.test(w) && !/[éèêë]s?$/.test(w)) n -= 1
    return sum + Math.max(1, n)
  }, 0)
}

/** Nombre de sauts : un par syllabe jusqu'à 3, sinon 2. */
export function hopsFor(name) {
  const n = syllableCount(name)
  return n <= 3 ? n : 2
}
