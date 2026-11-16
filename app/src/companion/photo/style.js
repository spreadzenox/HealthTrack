/**
 * La fiche de style rendue par le relais (`POST /v1/pilou/style`, relay/src/pilou.js) et ce que l'écran en montre.
 * Même schéma que PILOU-DOUBLE.md § 4 ; la fiche est revalidée ici aussi (le relais peut changer avant l'app) :
 * seuls les champs connus passent, une valeur inconnue prend la valeur neutre et devient « À vérifier ». Le lot
 * STUDIO l'enregistre (normaliser, couvre-chef choisi seulement à la main).
 */
export const FIELDS = Object.freeze({
  cheveux: {
    longueur: ['aucun', 'rases', 'tres_courts', 'courts', 'mi_longs', 'longs', 'tres_longs'],
    texture: ['raides', 'ondules', 'boucles', 'frises', 'crepus'],
    coiffure: ['libres', 'frange', 'raie_milieu', 'raie_cote', 'en_arriere', 'queue_de_cheval', 'chignon', 'tresses', 'locks', 'cotes_rases'],
    couleur: ['noir', 'brun_fonce', 'brun', 'chatain', 'chatain_clair', 'blond_fonce', 'blond', 'blond_platine', 'roux', 'auburn', 'poivre_sel', 'gris', 'blanc', 'rose', 'bleu', 'violet', 'vert'],
    meches: ['aucune', 'claires', 'colorees'],
    volume: ['plat', 'moyen', 'volumineux'],
  },
  sourcils: { epaisseur: ['fins', 'moyens', 'epais'], forme: ['droits', 'arques', 'anguleux'] },
  yeux: { couleur: ['marron_fonce', 'marron', 'noisette', 'vert', 'gris', 'bleu', 'bleu_clair'], forme: ['ronds', 'amande', 'allonges'] },
  lunettes: {
    type: ['aucune', 'rondes', 'rectangulaires', 'carrees_epaisses', 'papillon', 'aviateur', 'sans_monture'],
    couleur: ['noir', 'ecaille', 'dore', 'argent', 'transparent', 'colore'],
  },
  barbe: { type: ['aucune', 'ombre', 'moustache', 'bouc', 'collier', 'courte', 'longue'], couleur: ['comme_cheveux', 'plus_claire', 'plus_foncee', 'grise'] },
  peau: { taches_de_rousseur: ['aucune', 'legeres', 'marquees'], grain_de_beaute: ['aucun', 'joue_gauche', 'joue_droite', 'menton', 'levre'] },
  oreilles: { boucles: ['aucune', 'puces', 'anneaux', 'pendantes'], piercing_nez: [false, true] },
})

const REQUIRED = {
  cheveux: ['longueur', 'texture', 'coiffure', 'couleur', 'volume'],
  sourcils: ['epaisseur', 'forme'],
  yeux: ['couleur', 'forme'],
  lunettes: ['type'],
  barbe: ['type'],
  peau: ['taches_de_rousseur', 'grain_de_beaute'],
  oreilles: ['boucles'],
}

/** Le Pilou d'origine (valeurs neutres de traits.js). */
export const DEFAULTS = Object.freeze({
  cheveux: { longueur: 'courts', texture: 'raides', coiffure: 'libres', couleur: 'brun', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'droits' },
  yeux: { couleur: 'marron', forme: 'ronds' },
  lunettes: { type: 'aucune' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'aucune', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'aucune', piercing_nez: false },
})

const FAMILIES = Object.keys(FIELDS)
export const PATHS = Object.freeze(FAMILIES.flatMap((fam) => Object.keys(FIELDS[fam]).map((k) => `${fam}.${k}`)))

/** Réponse du relais → fiche sûre `{ cheveux, …, oreilles, incertains }` (jamais de couvre-chef ni d'autre champ). */
export function normalizeStyle(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const unsure = new Set(Array.isArray(src.incertains) ? src.incertains.filter((p) => PATHS.includes(p)) : [])
  const style = {}
  for (const fam of FAMILIES) {
    const given = src[fam] && typeof src[fam] === 'object' ? src[fam] : {}
    const out = {}
    for (const [key, values] of Object.entries(FIELDS[fam])) {
      const value = given[key]
      const fallback = DEFAULTS[fam][key]
      if (value !== undefined && value !== null && values.includes(value)) {
        out[key] = value
        continue
      }
      if (fallback !== undefined) out[key] = fallback
      if (value !== undefined && value !== null) unsure.add(`${fam}.${key}`)
      else if (REQUIRED[fam].includes(key)) unsure.add(`${fam}.${key}`)
    }
    style[fam] = out
  }
  style.incertains = PATHS.filter((p) => unsure.has(p))
  return style
}

const LIB = {
  rases: 'rasés', tres_courts: 'très courts', courts: 'courts', mi_longs: 'mi-longs', longs: 'longs', tres_longs: 'très longs',
  raides: 'raides', ondules: 'ondulés', boucles: 'bouclés', frises: 'frisés', crepus: 'crépus',
  frange: 'avec une frange', raie_milieu: 'raie au milieu', raie_cote: 'raie sur le côté', en_arriere: 'en arrière',
  queue_de_cheval: 'en queue de cheval', chignon: 'en chignon', tresses: 'en tresses', locks: 'en locks', cotes_rases: 'côtés rasés',
  noir: 'noirs', brun_fonce: 'brun foncé', brun: 'bruns', chatain: 'châtains', chatain_clair: 'châtain clair', blond_fonce: 'blond foncé',
  blond: 'blonds', blond_platine: 'blond platine', roux: 'roux', auburn: 'auburn', poivre_sel: 'poivre et sel', gris: 'gris',
  blanc: 'blancs', rose: 'roses', bleu: 'bleus', violet: 'violets', vert: 'verts',
}
const EYES = { marron_fonce: 'marron foncé', marron: 'marron', noisette: 'noisette', vert: 'verts', gris: 'gris', bleu: 'bleus', bleu_clair: 'bleu clair' }
const GLASSES = { rondes: 'rondes', rectangulaires: 'rectangulaires', carrees_epaisses: 'carrées épaisses', papillon: 'papillon', aviateur: 'aviateur', sans_monture: 'sans monture' }
const BEARD = { ombre: 'Ombre de barbe', moustache: 'Moustache', bouc: 'Bouc', collier: 'Barbe en collier', courte: 'Barbe courte', longue: 'Barbe longue' }
const EARRINGS = { puces: 'Boucles d’oreilles en puces', anneaux: 'Boucles d’oreilles en anneaux', pendantes: 'Boucles d’oreilles pendantes' }

/** Champ incertain → libellé du bandeau (« Vérifiez la couleur des yeux »). */
const UNSURE_NAMES = {
  cheveux: 'les cheveux', 'yeux.couleur': 'la couleur des yeux', 'yeux.forme': 'la forme des yeux', sourcils: 'les sourcils',
  lunettes: 'les lunettes', barbe: 'la barbe', peau: 'les taches et grains de beauté', oreilles: 'les boucles d’oreilles',
}

function unsureOf(style, fam, keys = null) {
  return style.incertains.some((p) => p.startsWith(`${fam}.`) && (!keys || keys.includes(p.split('.')[1])))
}

/**
 * Les traits à montrer un par un pendant la transformation (PILOU-DOUBLE.md § 2.5), dans l'ordre d'apparition de la
 * SPEC (§ 8) : chacun nommé, et marqué « À vérifier » si l'IA a hésité. Les réglages, jamais la personne.
 */
export function traitsToShow(style) {
  const items = []
  const c = style.cheveux
  if (c.longueur === 'aucun') items.push({ id: 'cheveux', label: 'Sans cheveux', unsure: unsureOf(style, 'cheveux') })
  else {
    const parts = [`Cheveux ${LIB[c.longueur]}`]
    if (c.longueur !== 'rases') parts.push(LIB[c.texture])
    parts.push(LIB[c.couleur])
    if (c.coiffure !== 'libres') parts.push(LIB[c.coiffure])
    items.push({ id: 'cheveux', label: parts.join(', '), unsure: unsureOf(style, 'cheveux') })
  }
  items.push({ id: 'sourcils', label: `Sourcils ${style.sourcils.epaisseur === 'epais' ? 'épais' : style.sourcils.epaisseur}`, unsure: unsureOf(style, 'sourcils') })
  items.push({ id: 'yeux', label: `Yeux ${EYES[style.yeux.couleur]}`, unsure: unsureOf(style, 'yeux') })
  if (style.lunettes.type !== 'aucune') items.push({ id: 'lunettes', label: `Lunettes ${GLASSES[style.lunettes.type]}`, unsure: unsureOf(style, 'lunettes') })
  if (style.peau.taches_de_rousseur !== 'aucune') items.push({ id: 'taches', label: 'Taches de rousseur', unsure: unsureOf(style, 'peau', ['taches_de_rousseur']) })
  if (style.peau.grain_de_beaute !== 'aucun') items.push({ id: 'grain', label: 'Grain de beauté', unsure: unsureOf(style, 'peau', ['grain_de_beaute']) })
  if (style.oreilles.boucles !== 'aucune') items.push({ id: 'boucles', label: EARRINGS[style.oreilles.boucles], unsure: unsureOf(style, 'oreilles', ['boucles']) })
  if (style.oreilles.piercing_nez) items.push({ id: 'piercing', label: 'Piercing du nez', unsure: unsureOf(style, 'oreilles', ['piercing_nez']) })
  if (style.barbe.type !== 'aucune') items.push({ id: 'barbe', label: BEARD[style.barbe.type], unsure: unsureOf(style, 'barbe') })
  return items
}

/** Bandeaux « Vérifiez … » du Studio, un par sujet incertain, sans doublon. */
export function checksToShow(style) {
  const seen = new Set()
  const out = []
  for (const path of style.incertains) {
    const name = UNSURE_NAMES[path] ?? UNSURE_NAMES[path.split('.')[0]]
    if (name && !seen.has(name)) {
      seen.add(name)
      out.push(`Vérifiez ${name}`)
    }
  }
  return out
}
