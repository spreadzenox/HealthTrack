/**
 * Les traits du double numérique de Pilou (refonte « Compagnon », étape 14 ; brief § 9, PILOU-DOUBLE.md,
 * specs/double.SPEC.md). Repris du module de référence du kit (`double/traits.js`), partie sans 3D : le schéma de la
 * fiche (identique au schéma imposé au relais), les libellés, les palettes curatées, les règles de compatibilité,
 * `normaliser`, le tirage « Surprenez-moi » et le décompte des combinaisons.
 *
 * Jamais dans la fiche : âge, genre, couleur de peau, origine, émotions, santé, identité. `sanitizeFiche` ne garde que
 * les champs du schéma ; le couvre-chef n'est choisi qu'à la main (il n'est pas dans le schéma envoyé à l'IA).
 */

export const FICHE_VERSION = 1

export const SCHEMA = {
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
  lunettes: { type: ['aucune', 'rondes', 'rectangulaires', 'carrees_epaisses', 'papillon', 'aviateur', 'sans_monture'], couleur: ['noir', 'ecaille', 'dore', 'argent', 'transparent', 'colore'] },
  barbe: { type: ['aucune', 'ombre', 'moustache', 'bouc', 'collier', 'courte', 'longue'], couleur: ['comme_cheveux', 'plus_claire', 'plus_foncee', 'grise'] },
  peau: { taches_de_rousseur: ['aucune', 'legeres', 'marquees'], grain_de_beaute: ['aucun', 'joue_gauche', 'joue_droite', 'menton', 'levre'] },
  oreilles: { boucles: ['aucune', 'puces', 'anneaux', 'pendantes'], piercing_nez: [false, true] },
}
/** Ajouté par l'app, jamais par l'IA : choisi seulement à la main dans le Studio (PILOU-DOUBLE.md § 3). */
export const COUVRE_CHEFS = ['aucun', 'bonnet', 'casquette', 'bandeau', 'foulard', 'chapeau', 'serre_tete']
export const FAMILLES = Object.keys(SCHEMA)

export const DEFAUT = {
  cheveux: { longueur: 'courts', texture: 'raides', coiffure: 'libres', couleur: 'brun', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'droits' },
  yeux: { couleur: 'marron', forme: 'ronds' },
  lunettes: { type: 'aucune' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'aucune', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'aucune', piercing_nez: false },
}

/** Libellés de l'app, par champ (une même valeur peut se dire autrement selon le champ). */
const LIB = {
  aucun: 'Aucun', aucune: 'Aucune', rases: 'Rasés', tres_courts: 'Très courts', courts: 'Courts', mi_longs: 'Mi-longs', longs: 'Longs', tres_longs: 'Très longs',
  raides: 'Raides', ondules: 'Ondulés', boucles: 'Bouclés', frises: 'Frisés', crepus: 'Crépus',
  libres: 'Libres', frange: 'Frange', raie_milieu: 'Raie au milieu', raie_cote: 'Raie sur le côté', en_arriere: 'En arrière', queue_de_cheval: 'Queue de cheval', chignon: 'Chignon', tresses: 'Tresses', locks: 'Locks', cotes_rases: 'Côtés rasés',
  noir: 'Noir', brun_fonce: 'Brun foncé', brun: 'Brun', chatain: 'Châtain', chatain_clair: 'Châtain clair', blond_fonce: 'Blond foncé', blond: 'Blond', blond_platine: 'Blond platine', roux: 'Roux', auburn: 'Auburn', poivre_sel: 'Poivre et sel', gris: 'Gris', blanc: 'Blanc', rose: 'Rose', bleu: 'Bleu', violet: 'Violet', vert: 'Vert',
  claires: 'Claires', colorees: 'Colorées', plat: 'Plat', moyen: 'Moyen', volumineux: 'Volumineux',
  fins: 'Fins', moyens: 'Moyens', epais: 'Épais', droits: 'Droits', arques: 'Arqués', anguleux: 'Anguleux',
  marron_fonce: 'Marron foncé', marron: 'Marron', noisette: 'Noisette', bleu_clair: 'Bleu clair', ronds: 'Ronds', amande: 'Amande', allonges: 'Allongés',
  rondes: 'Rondes', rectangulaires: 'Rectangulaires', carrees_epaisses: 'Carrées épaisses', papillon: 'Papillon', aviateur: 'Aviateur', sans_monture: 'Sans monture',
  ecaille: 'Écaille', dore: 'Doré', argent: 'Argent', transparent: 'Transparent', colore: 'Colorée',
  ombre: 'Ombre de barbe', moustache: 'Moustache', bouc: 'Bouc', collier: 'Collier', courte: 'Courte', longue: 'Longue',
  comme_cheveux: 'Comme les cheveux', plus_claire: 'Plus claire', plus_foncee: 'Plus foncée', grise: 'Grise',
  legeres: 'Légères', marquees: 'Marquées', joue_gauche: 'Joue gauche', joue_droite: 'Joue droite', menton: 'Menton', levre: 'Lèvre',
  puces: 'Puces', anneaux: 'Anneaux', pendantes: 'Pendantes',
  bonnet: 'Bonnet', casquette: 'Casquette', bandeau: 'Bandeau', foulard: 'Foulard', chapeau: 'Chapeau', serre_tete: 'Serre-tête',
}
export function libelle(valeur, champ) {
  if (champ === 'oreilles.piercing_nez') return valeur ? 'Oui' : 'Non'
  if (champ === 'peau.taches_de_rousseur' && valeur === 'aucune') return 'Aucune'
  if (champ === 'yeux.couleur' && valeur === 'vert') return 'Vert'
  return LIB[valeur] ?? String(valeur)
}

/** Nom des champs, pour les bandeaux « Vérifiez … » et les intitulés du Studio. */
export const NOMS_CHAMPS = {
  'cheveux.longueur': 'la longueur des cheveux', 'cheveux.texture': 'la texture des cheveux', 'cheveux.coiffure': 'la coiffure',
  'cheveux.couleur': 'la couleur des cheveux', 'cheveux.meches': 'les mèches', 'cheveux.volume': 'le volume des cheveux',
  'sourcils.epaisseur': "l'épaisseur des sourcils", 'sourcils.forme': 'la forme des sourcils',
  'yeux.couleur': 'la couleur des yeux', 'yeux.forme': 'la forme des yeux',
  'lunettes.type': 'les lunettes', 'lunettes.couleur': 'la couleur des lunettes',
  'barbe.type': 'la barbe', 'barbe.couleur': 'la couleur de la barbe',
  'peau.taches_de_rousseur': 'les taches de rousseur', 'peau.grain_de_beaute': 'le grain de beauté',
  'oreilles.boucles': "les boucles d'oreilles", 'oreilles.piercing_nez': 'le piercing du nez',
}
const CHAMPS = new Set(Object.keys(NOMS_CHAMPS))

/* ---------- palettes curatées (pas de couleur libre) : base, ombre, reflet, sourcil ---------- */
export const PAL_CHEVEUX = {
  noir: ['#36302F', '#1E1A1A', '#6A6878', '#262122'],
  brun_fonce: ['#4E3125', '#2F1D16', '#80594A', '#35221A'],
  brun: ['#6E4632', '#4A2E20', '#A0705A', '#4A2E20'],
  chatain: ['#996443', '#6B432A', '#D09A6A', '#5A3A26'],
  chatain_clair: ['#AA7C52', '#7E5838', '#D8AC7E', '#6E4A30'],
  blond_fonce: ['#C09458', '#977140', '#E0C08A', '#86643C'],
  blond: ['#E6C47C', '#C29C58', '#F4DEA4', '#A2804C'],
  blond_platine: ['#F0E4C6', '#D2C29C', '#FBF4E2', '#B09C78'],
  roux: ['#CC6532', '#9A4420', '#F09A60', '#8E4020'],
  auburn: ['#923E2C', '#66261A', '#C26C56', '#5E281C'],
  poivre_sel: ['#948D86', '#605A55', '#D6D0C8', '#5A5552'],
  gris: ['#B2ABA3', '#8E877F', '#D8D2C9', '#6E6A66'],
  blanc: ['#EFEAE2', '#CFC7BC', '#FBF8F2', '#A9A49D'],
  rose: ['#F49CBA', '#CF6A8E', '#FFD3E2', '#7A4A3A'],
  bleu: ['#7096E0', '#4867B6', '#B8CEF8', '#5A4A4A'],
  violet: ['#9E80E0', '#6C50B4', '#D0C0F8', '#5A4450'],
  vert: ['#3F8058', '#28583C', '#7DB892', '#3E4A3A'],
}
export const NATURELLES = ['noir', 'brun_fonce', 'brun', 'chatain', 'chatain_clair', 'blond_fonce', 'blond', 'blond_platine', 'roux', 'auburn', 'poivre_sel', 'gris', 'blanc']
/** foncé (haut de l'iris), clair (bas), anneau, reflet teinté (vu en petit) */
export const PAL_YEUX = {
  marron_fonce: ['#4C2E1E', '#7E5236', '#2A1A12', 'rgba(150,100,70,.45)'],
  marron: ['#6E4024', '#B0743E', '#3A2214', 'rgba(190,125,70,.48)'],
  noisette: ['#6A5626', '#BB9A48', '#3A2E14', 'rgba(200,170,80,.5)'],
  vert: ['#3A6638', '#7DB064', '#1E3A1E', 'rgba(130,190,110,.5)'],
  gris: ['#5A6870', '#AAB6BE', '#2E3840', 'rgba(180,195,205,.5)'],
  bleu: ['#2C5698', '#72A4DE', '#18305A', 'rgba(120,170,230,.52)'],
  bleu_clair: ['#4A88C2', '#AAD6F4', '#26507A', 'rgba(170,215,245,.55)'],
}
export const PAL_MONTURE = {
  noir: ['#2E2725', '#6A5E58'], ecaille: ['#8A5530', '#D49A55'], dore: ['#D8A63C', '#FFE9A8'], argent: ['#AEB6BF', '#F2F5F8'],
  transparent: ['#E6DDD0', '#FFFFFF'], colore: ['#E0557A', '#FFB0C4'],
}
export const PAL_COUVRE = { bonnet: '#E8A63A', casquette: '#4F67C4', bandeau: '#FF8A73', foulard: '#A08CF7', chapeau: '#E9CC8E', serre_tete: '#E0557A' }
export const PAL_DIVERS = { taches: 'rgba(196,118,74,', grain: '#5A3A2E', bijou: '#E7B44A', bijouReflet: '#FFF3C4', ras: '#78D8B4', goutte: '#7FD0F0' }

function hexVersRgb(h) {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
/** Mélange deux couleurs hexadécimales (p = 0 : a ; p = 1 : b). */
export function mixHex(a, b, p) {
  const A = hexVersRgb(a), B = hexVersRgb(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join('')
}
export function couleursCheveux(f) {
  const c = PAL_CHEVEUX[f?.cheveux?.couleur] ? f.cheveux.couleur : 'chatain'
  const [base, ombre, reflet, sourcil] = PAL_CHEVEUX[c]
  const meche = f?.cheveux?.meches === 'colorees' ? (c === 'rose' ? '#8FB4F2' : '#F49CBA') : mixHex(reflet, '#FFF4DC', 0.45)
  return { base, ombre, reflet, sourcil, meche }
}
export function couleursBarbe(f) {
  const h = couleursCheveux(f), b = f?.barbe?.couleur || 'comme_cheveux'
  if (b === 'grise') return { base: '#ADA69E', ombre: '#8A837B', reflet: '#D4CEC6' }
  if (b === 'plus_claire') return { base: h.reflet, ombre: h.base, reflet: mixHex(h.reflet, '#FFFFFF', 0.4) }
  if (b === 'plus_foncee') return { base: h.ombre, ombre: mixHex(h.ombre, '#1A1210', 0.5), reflet: h.base }
  return { base: h.base, ombre: h.ombre, reflet: h.reflet }
}

/* ---------- compatibilité : toute fiche (IA, Studio, tirage) passe par normaliser() ---------- */
const LONG_IDX = (l) => SCHEMA.cheveux.longueur.indexOf(l)
const RASSEMBLEES = ['queue_de_cheval', 'chignon', 'tresses']
export const REGLES = [
  ['Sans cheveux ou rasés : coiffure libre, volume plat', (f) => LONG_IDX(f.cheveux.longueur) <= 1 && (f.cheveux.coiffure !== 'libres' || f.cheveux.volume !== 'plat'), (f) => { f.cheveux.coiffure = 'libres'; f.cheveux.volume = 'plat'; f.cheveux.meches = 'aucune' }],
  ['Queue de cheval, chignon, tresses : au moins mi-longs', (f) => RASSEMBLEES.includes(f.cheveux.coiffure) && LONG_IDX(f.cheveux.longueur) < 4, (f) => { f.cheveux.longueur = 'mi_longs' }],
  ['Locks : au moins courts', (f) => f.cheveux.coiffure === 'locks' && LONG_IDX(f.cheveux.longueur) < 3, (f) => { f.cheveux.longueur = 'courts' }],
  ['Côtés rasés : de très courts à mi-longs sur le dessus', (f) => f.cheveux.coiffure === 'cotes_rases' && (LONG_IDX(f.cheveux.longueur) < 2 || LONG_IDX(f.cheveux.longueur) > 4), (f) => { f.cheveux.longueur = LONG_IDX(f.cheveux.longueur) < 2 ? 'tres_courts' : 'mi_longs' }],
  ['Frange et raies : au moins courts', (f) => ['frange', 'raie_milieu', 'raie_cote'].includes(f.cheveux.coiffure) && LONG_IDX(f.cheveux.longueur) < 3, (f) => { f.cheveux.coiffure = 'libres' }],
  ['Crépus : le volume remplace la longueur', (f) => f.cheveux.texture === 'crepus' && f.cheveux.longueur === 'tres_longs' && f.cheveux.coiffure === 'libres', (f) => { f.cheveux.longueur = 'longs' }],
  ['Pas de lunettes : pas de couleur', (f) => f.lunettes.type === 'aucune' && f.lunettes.couleur, (f) => { delete f.lunettes.couleur }],
  ['Lunettes sans couleur : noir', (f) => f.lunettes.type !== 'aucune' && !f.lunettes.couleur, (f) => { f.lunettes.couleur = f.lunettes.type === 'aviateur' ? 'dore' : 'noir' }],
  ['Pas de barbe : pas de couleur', (f) => f.barbe.type === 'aucune' && f.barbe.couleur, (f) => { delete f.barbe.couleur }],
  ['Barbe sans couleur : comme les cheveux', (f) => f.barbe.type !== 'aucune' && !f.barbe.couleur, (f) => { f.barbe.couleur = 'comme_cheveux' }],
  ['Barbe « comme les cheveux » sans cheveux : couleur naturelle', (f) => f.barbe.type !== 'aucune' && f.barbe.couleur === 'comme_cheveux' && LONG_IDX(f.cheveux.longueur) === 0 && !NATURELLES.includes(f.cheveux.couleur), (f) => { f.cheveux.couleur = 'brun' }],
]

/**
 * Ne garde que les champs du schéma, aux valeurs connues. Une valeur inconnue prend la valeur par défaut et le champ
 * est ajouté à `incertains` ; tout autre champ (âge, genre…) est retiré. Puis les règles de compatibilité.
 * @returns {{ fiche: object, corrections: string[] }}
 */
export function normaliser(brute) {
  const src = brute && typeof brute === 'object' && !Array.isArray(brute) ? brute : {}
  const incertains = new Set(Array.isArray(src.incertains) ? src.incertains.filter((c) => CHAMPS.has(c)) : [])
  const f = { version: FICHE_VERSION }
  for (const fam of FAMILLES) {
    const s = src[fam] && typeof src[fam] === 'object' ? src[fam] : {}
    f[fam] = {}
    for (const k of Object.keys(SCHEMA[fam])) {
      const v = s[k], chemin = `${fam}.${k}`
      if (v === undefined || v === null) {
        if (DEFAUT[fam][k] !== undefined) f[fam][k] = DEFAUT[fam][k]
      } else if (SCHEMA[fam][k].includes(v)) {
        f[fam][k] = v
      } else {
        if (DEFAUT[fam][k] !== undefined) f[fam][k] = DEFAUT[fam][k]
        incertains.add(chemin)
      }
    }
  }
  if (!f.cheveux.meches) f.cheveux.meches = 'aucune'
  f.couvre_chef = COUVRE_CHEFS.includes(src.couvre_chef) ? src.couvre_chef : 'aucun'
  const corrections = []
  for (const [nom, viole, corrige] of REGLES) if (viole(f)) { corrige(f); corrections.push(nom) }
  f.incertains = [...incertains]
  return { fiche: f, corrections }
}

/** Fiche propre ou null (« Pilou d'origine ») : pour la lecture du stockage et l'import d'une sauvegarde. */
export function sanitizeFiche(brute) {
  if (!brute || typeof brute !== 'object' || Array.isArray(brute)) return null
  if (!FAMILLES.some((fam) => brute[fam] && typeof brute[fam] === 'object')) return null
  return normaliser(brute).fiche
}

/**
 * Pourquoi une valeur est grisée dans le Studio (null si elle est possible avec le reste de la fiche).
 * On essaie la valeur : si les règles la corrigent, c'est qu'elle ne tient pas avec les autres choix.
 */
export function incompatibilite(fiche, chemin, valeur) {
  const [fam, k] = chemin.split('.')
  if (!SCHEMA[fam]?.[k]?.includes(valeur)) return 'Valeur inconnue'
  const essai = JSON.parse(JSON.stringify(fiche))
  essai[fam][k] = valeur
  for (const [nom, viole, corrige] of REGLES) {
    if (!viole(essai)) continue
    const avant = essai[fam][k]
    corrige(essai)
    if (essai[fam][k] !== avant) return nom
  }
  return null
}

/** Change un champ, applique les règles et confirme le champ (il sort des « À vérifier »). */
export function changer(fiche, chemin, valeur) {
  const [fam, k] = chemin.split('.')
  const brute = JSON.parse(JSON.stringify(fiche))
  if (fam === 'couvre_chef') brute.couvre_chef = valeur
  else brute[fam][k] = valeur
  brute.incertains = (brute.incertains || []).filter((c) => c !== chemin)
  return normaliser(brute).fiche
}

/* ---------- combien de Pilou ? et tirage à graine (« Surprenez-moi ») ---------- */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function compter() {
  const C = SCHEMA.cheveux
  const cheveux = C.longueur.length * C.texture.length * C.coiffure.length * C.couleur.length * C.meches.length * C.volume.length
  let coherents = 0
  for (const longueur of C.longueur) for (const texture of C.texture) for (const coiffure of C.coiffure) for (const volume of C.volume) for (const meches of C.meches) {
    const f = { cheveux: { longueur, texture, coiffure, couleur: 'brun', meches, volume }, lunettes: { type: 'aucune' }, barbe: { type: 'aucune' } }
    if (!REGLES.slice(0, 6).some(([, v]) => v(f))) coherents += C.couleur.length
  }
  const barbe = (SCHEMA.barbe.type.length - 1) * SCHEMA.barbe.couleur.length + 1
  const lunettes = (SCHEMA.lunettes.type.length - 1) * SCHEMA.lunettes.couleur.length + 1
  const sourcils = 9, yeux = 21, peau = 15, oreilles = 8, couvre = COUVRE_CHEFS.length
  const autres = barbe * sourcils * yeux * lunettes * peau * oreilles * couvre
  return { cheveux, coherents, total: cheveux * autres, totalCoherent: coherents * autres }
}
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length]
/** Tirage d'une fiche cohérente, pondéré pour donner des Pilou portables (couvre-chef rare). */
export function tirer(seed) {
  const r = rng(seed * 2654435761 + 97)
  const w = (pairs) => {
    let s = 0
    for (const [, p] of pairs) s += p
    let x = r() * s
    for (const [v, p] of pairs) { x -= p; if (x <= 0) return v }
    return pairs[0][0]
  }
  const f = {
    cheveux: {
      longueur: w([['aucun', 0.5], ['rases', 0.8], ['tres_courts', 1.2], ['courts', 1.6], ['mi_longs', 1.5], ['longs', 1.3], ['tres_longs', 0.5]]),
      texture: pick(r, SCHEMA.cheveux.texture), coiffure: pick(r, SCHEMA.cheveux.coiffure),
      couleur: r() < 0.78 ? pick(r, NATURELLES) : pick(r, ['rose', 'bleu', 'violet', 'vert']),
      meches: w([['aucune', 4], ['claires', 1], ['colorees', 0.7]]), volume: pick(r, SCHEMA.cheveux.volume),
    },
    sourcils: { epaisseur: pick(r, SCHEMA.sourcils.epaisseur), forme: pick(r, SCHEMA.sourcils.forme) },
    yeux: { couleur: pick(r, SCHEMA.yeux.couleur), forme: pick(r, SCHEMA.yeux.forme) },
    lunettes: { type: w([['aucune', 3], ...SCHEMA.lunettes.type.slice(1).map((t) => [t, 0.5])]), couleur: pick(r, SCHEMA.lunettes.couleur) },
    barbe: { type: w([['aucune', 4], ...SCHEMA.barbe.type.slice(1).map((t) => [t, 0.45])]), couleur: w([['comme_cheveux', 3], ['plus_claire', 1], ['plus_foncee', 1], ['grise', 1]]) },
    peau: { taches_de_rousseur: w([['aucune', 3], ['legeres', 1], ['marquees', 0.7]]), grain_de_beaute: w([['aucun', 5], ['joue_gauche', 0.5], ['joue_droite', 0.5], ['menton', 0.4], ['levre', 0.4]]) },
    oreilles: { boucles: w([['aucune', 3], ['puces', 1], ['anneaux', 0.8], ['pendantes', 0.6]]), piercing_nez: r() < 0.12 },
    couvre_chef: w([['aucun', 6], ...COUVRE_CHEFS.slice(1).map((c) => [c, 0.5])]),
  }
  if (f.lunettes.type === 'aucune') delete f.lunettes.couleur
  if (f.barbe.type === 'aucune') delete f.barbe.couleur
  return normaliser(f).fiche
}

/* ---------- description lue par le lecteur d'écran (des réglages, jamais une personne) ---------- */
const accordCouleur = { noir: 'noirs', brun_fonce: 'brun foncé', brun: 'bruns', chatain: 'châtains', chatain_clair: 'châtain clair', blond_fonce: 'blond foncé', blond: 'blonds', blond_platine: 'blond platine', roux: 'roux', auburn: 'auburn', poivre_sel: 'poivre et sel', gris: 'gris', blanc: 'blancs', rose: 'roses', bleu: 'bleus', violet: 'violets', vert: 'verts' }
export function decrire(fiche, nom = 'Pilou') {
  if (!fiche) return `${nom}, tel qu'à l'origine`
  const p = []
  const c = fiche.cheveux
  if (c.longueur === 'aucun') p.push('sans cheveux')
  else p.push(`cheveux ${accordCouleur[c.couleur]} ${libelle(c.longueur).toLowerCase()}${c.coiffure !== 'libres' ? `, ${libelle(c.coiffure).toLowerCase()}` : ''}`)
  p.push(`yeux ${libelle(fiche.yeux.couleur, 'yeux.couleur').toLowerCase()}`)
  if (fiche.lunettes.type !== 'aucune') p.push(`lunettes ${libelle(fiche.lunettes.type).toLowerCase()}`)
  if (fiche.barbe.type !== 'aucune') p.push(libelle(fiche.barbe.type).toLowerCase())
  if (fiche.peau.taches_de_rousseur !== 'aucune') p.push('taches de rousseur')
  if (fiche.oreilles.boucles !== 'aucune') p.push("boucles d'oreilles")
  if (fiche.couvre_chef !== 'aucun') p.push(libelle(fiche.couvre_chef).toLowerCase())
  return `${nom} : ${p.join(', ')}`
}

/* ---------- apparitions (SPEC § 8) : durée par famille, en ms ---------- */
export const APPARITION = { cheveux: 1400, sourcils: 420, yeux: 600, lunettes: 900, taches: 700, grain: 700, boucles: 500, barbe: 800, couvre: 650 }
/** La famille animée quand un champ change dans le Studio. */
export function familleDe(chemin) {
  if (chemin === 'couvre_chef') return 'couvre'
  if (chemin.startsWith('peau.taches')) return 'taches'
  if (chemin.startsWith('peau.grain')) return 'grain'
  if (chemin.startsWith('oreilles.')) return 'boucles'
  return chemin.split('.')[0]
}
