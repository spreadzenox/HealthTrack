/**
 * I119 — lire une phrase du soir (« journée crevante mais contente, apéro ») sans créer de cercle (D5).
 *
 * Deux lexiques disjoints :
 * - FEELING_WORDS, le ressenti : ce que la personne dit de son état. Il ne fait que PROPOSER une note
 *   de 0 à 5 et le tag « Stress » ressenti — c'est de l'auto-déclaration, donc côté Y (estimatorInputs.js).
 * - CONTEXT_WORDS, le contexte : ce qu'elle a fait (apéro, dîner tard, malade…). Il ne propose que des
 *   tags de comportement, côté X, que les Analyses comparent ensuite au bien-être.
 * Aucun mot n'est dans les deux (`lexicon.test.js`), sinon un même mot ferait l'humeur et son « facteur ».
 * Rien n'est enregistré sans un geste : l'utilisateur touche la proposition ou l'ignore.
 *
 * Les formes sont écrites normalisées (minuscules, sans accents, apostrophes et ponctuation → espaces) et
 * comparées mot à mot : « vin » ne se trouve pas dans « vingt ». Une négation (« pas », « sans »…) dans les
 * 3 mots qui précèdent retourne un ressenti positif, adoucit un négatif, et annule un contexte.
 */

/** Mots de liaison ignorés par le test de disjonction (ils peuvent apparaître dans les deux lexiques). */
export const FUNCTION_WORDS = ['je', 'me', 'ca', 'va', 'en', 'de', 'd', 'du', 'la', 'le', 'l', 'un', 'une', 'ce', 'cet', 'sous', 'tres']

const NEGATIONS = ['pas', 'jamais', 'aucun', 'aucune', 'sans', 'ni', 'rien']
const INTENSIFIERS = ['tres', 'super', 'vraiment', 'trop', 'hyper', 'tellement', 'completement', 'extremement']
const NEGATION_WINDOW = 3

export const FEELING_WORDS = [
  { valence: 2, forms: ['heureux', 'heureuse', 'heureuses', 'ravi', 'ravie', 'ravis', 'genial', 'geniale', 'joyeux', 'joyeuse', 'epanoui', 'epanouie', 'excellente journee', 'super journee'] },
  { valence: 1, forms: ['content', 'contente', 'contents', 'contentes', 'en forme', 'je vais bien', 'ca va bien', 'me sens bien', 'bonne journee', 'belle journee', 'detendu', 'detendue', 'serein', 'sereine', 'calme', 'apaise', 'apaisee', 'motive', 'motivee', 'satisfait', 'satisfaite', 'zen', 'positif', 'positive', 'repose', 'reposee', 'soulage', 'soulagee', 'fier', 'fiere'] },
  { valence: -1, forms: ['fatigue', 'fatiguee', 'fatigues', 'fatiguees', 'fatigant', 'fatigante', 'creve', 'crevee', 'crevant', 'crevante', 'bof', 'agace', 'agacee', 'enerve', 'enervee', 'irrite', 'irritee', 'las', 'lasse', 'decourage', 'decouragee', 'decu', 'decue', 'inquiet', 'inquiete', 'nul', 'nulle', 'difficile', 'galere', 'morose', 'demotive', 'demotivee', 'triste', 'tristes'] },
  { valence: -1, tag: 'stress', forms: ['stresse', 'stressee', 'stresses', 'stressees', 'stressant', 'stressante', 'stress', 'tendu', 'tendue', 'sous pression', 'anxieux', 'anxieuse', 'deborde', 'debordee', 'nerveux', 'nerveuse'] },
  { valence: -2, forms: ['epuise', 'epuisee', 'epuisant', 'epuisante', 'deprime', 'deprimee', 'horrible', 'affreuse', 'affreux', 'pourrie', 'pourri', 'abattu', 'abattue', 'malheureux', 'malheureuse', 'a bout'] },
  { valence: -2, tag: 'stress', forms: ['angoisse', 'angoissee', 'panique', 'paniquee'] },
]

export const CONTEXT_WORDS = [
  { tag: 'alcohol', forms: ['alcool', 'apero', 'aperos', 'aperitif', 'vin', 'biere', 'bieres', 'cocktail', 'cocktails', 'champagne', 'whisky', 'rhum', 'vodka', 'pinte', 'pintes', 'bu un verre', 'bu des verres'] },
  { tag: 'coffee_late', forms: ['cafe ce soir', 'cafe cet apres midi', 'cafe l apres midi', 'cafe apres midi'] },
  { tag: 'late_meal', forms: ['mange tard', 'diner tard', 'dine tard', 'repas tard', 'repas tardif', 'soupe tard'] },
  { tag: 'late_screen', forms: ['ecran tard', 'telephone tard', 'portable tard', 'serie tard', 'scrolle tard', 'jeu video tard'] },
  { tag: 'evening_sport', forms: ['sport ce soir', 'sport le soir', 'salle ce soir', 'muscu ce soir', 'footing ce soir', 'course ce soir', 'running ce soir', 'piscine ce soir', 'entrainement ce soir'] },
  { tag: 'travel', forms: ['voyage', 'en voyage', 'avion', 'decalage horaire', 'en deplacement'] },
  { tag: 'vaccine', forms: ['vaccin', 'vaccine', 'vaccinee', 'vaccination'] },
  { tag: 'sick', forms: ['malade', 'rhume', 'grippe', 'fievre', 'covid', 'gastro', 'migraine', 'angine', 'mal de tete', 'mal de gorge', 'mal au ventre'] },
]

/** Minuscules, sans accents ; apostrophes et ponctuation séparent les mots. */
export function normalizeWords(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

const toPatterns = (lexicon) =>
  lexicon
    .flatMap((item) => item.forms.map((f) => ({ item, form: f, words: f.split(' ') })))
    .sort((a, b) => b.words.length - a.words.length)

const FEELING_PATTERNS = toPatterns(FEELING_WORDS)
const CONTEXT_PATTERNS = toPatterns(CONTEXT_WORDS)

function matchAt(words, i, patterns) {
  return patterns.find((p) => p.words.every((w, k) => words[i + k] === w))
}

const negatedAt = (words, i) => words.slice(Math.max(0, i - NEGATION_WINDOW), i).some((w) => NEGATIONS.includes(w))

/**
 * Lit une phrase et renvoie des propositions : `score` (0–5, ou null sans ressenti reconnu), `tags`
 * (ordre de BEHAVIOR_TAGS fixé par l'appelant ; ici ordre d'apparition sans doublon) et `words`, les
 * formes reconnues dans l'ordre, pour dire à l'utilisateur sur quoi repose la proposition.
 */
export function readPhrase(text) {
  const words = normalizeWords(text)
  const valences = []
  const tags = []
  const found = []
  let i = 0
  while (i < words.length) {
    const feeling = matchAt(words, i, FEELING_PATTERNS)
    const context = feeling ? null : matchAt(words, i, CONTEXT_PATTERNS)
    const hit = feeling ?? context
    if (!hit) {
      i += 1
      continue
    }
    const negated = negatedAt(words, i)
    found.push(hit.form)
    if (feeling) {
      const boost = INTENSIFIERS.includes(words[i - 1]) ? 1.5 : 1
      let v = Math.max(-2, Math.min(2, hit.item.valence * boost))
      if (negated) v = v > 0 ? -v : -v / 2
      valences.push(v)
      if (hit.item.tag && !negated && !tags.includes(hit.item.tag)) tags.push(hit.item.tag)
    } else if (!negated && !tags.includes(hit.item.tag)) {
      tags.push(hit.item.tag)
    }
    i += hit.words.length
  }
  const score = valences.length
    ? Math.max(0, Math.min(5, Math.round(2.5 + (valences.reduce((a, b) => a + b, 0) / valences.length) * 1.25)))
    : null
  return { score, tags, words: found }
}
