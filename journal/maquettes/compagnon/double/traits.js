// traits.js — « Pilou, votre double numérique » : les traits de la personne, portés par Pilou.
//
// Module séparé du personnage (pilou.js) : il ne connaît du corps que son profil (bodyR, H, BY) et un « kit »
// (matière toon, contour, groupes où s'attacher). On peut donc le rebrancher plus tard sur un Pilou au rendu plus
// réaliste : il suffit de fournir le même kit (une fonction de matière, un groupe « corps », le bras qui porte la montre).
//
// Deux familles de traits (PILOU-DOUBLE.md § 6) :
//   • PEINTURE DU VISAGE (coût nul) : sourcils, iris, forme des yeux, taches de rousseur, grain de beauté, piercing du nez,
//     ombre de barbe, moustache, bouc, collier, barbe courte. Le visage du chapitre 1 est dessiné en 2D puis projeté :
//     ce sont de simples paramètres de dessin (peintre.peindre(ctx, X, Y, k, F, phase)).
//   • PIÈCES 3D MODULAIRES (≤ 1 par famille, ≤ 2 000 triangles chacune) : calotte de cheveux (+ queue, chignon, tresses,
//     locks), montures, barbe longue, boucles d'oreilles, couvre-chefs. L'antenne sort toujours entre les mèches ; les
//     couvre-chefs sont percés pour elle.
//
// Tout est déterministe : la fiche + la graine + le temps donnent l'image. Les animations d'apparition sont décrites
// par APPARITION (durées, courbes) et pilotées par un objet « révélation » { cheveux, sourcils, yeux, … } ∈ [0 ; ~1,1].
import { THREE, clamp, lerp, sstep, seg, bodyR, rAtY, H, BY } from './pilou.js';

/* =====================================================================================================================
   1. LE SCHÉMA (identique au responseSchema imposé à Gemini, § 4) ET LES LIBELLÉS DE L'APP
   ===================================================================================================================== */
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
};
// Ajouté par l'app, jamais par l'IA : choisi seulement à la main dans le Studio (§ 3).
export const COUVRE_CHEFS = ['aucun', 'bonnet', 'casquette', 'bandeau', 'foulard', 'chapeau', 'serre_tete'];

export const LIB = {
  aucun: 'Aucun', aucune: 'Aucune', rases: 'Rasés', tres_courts: 'Très courts', courts: 'Courts', mi_longs: 'Mi-longs', longs: 'Longs', tres_longs: 'Très longs',
  raides: 'Raides', ondules: 'Ondulés', boucles: 'Bouclés', frises: 'Frisés', crepus: 'Crépus',
  libres: 'Libres', frange: 'Frange', raie_milieu: 'Raie au milieu', raie_cote: 'Raie sur le côté', en_arriere: 'En arrière', queue_de_cheval: 'Queue de cheval', chignon: 'Chignon', tresses: 'Tresses', locks: 'Locks', cotes_rases: 'Côtés rasés',
  noir: 'Noir', brun_fonce: 'Brun foncé', brun: 'Brun', chatain: 'Châtain', chatain_clair: 'Châtain clair', blond_fonce: 'Blond foncé', blond: 'Blond', blond_platine: 'Blond platine', roux: 'Roux', auburn: 'Auburn', poivre_sel: 'Poivre et sel', gris: 'Gris', blanc: 'Blanc', rose: 'Rose', bleu: 'Bleu', violet: 'Violet', vert: 'Vert',
  claires: 'Claires', colorees: 'Colorées', plat: 'Plat', moyen: 'Moyen', volumineux: 'Volumineux',
  fins: 'Fins', moyens: 'Moyens', epais: 'Épais', droits: 'Droits', arques: 'Arqués', anguleux: 'Anguleux',
  marron_fonce: 'Marron foncé', marron: 'Marron', noisette: 'Noisette', gris_y: 'Gris', bleu_clair: 'Bleu clair', ronds: 'Ronds', amande: 'Amande', allonges: 'Allongés',
  rondes: 'Rondes', rectangulaires: 'Rectangulaires', carrees_epaisses: 'Carrées épaisses', papillon: 'Papillon', aviateur: 'Aviateur', sans_monture: 'Sans monture',
  ecaille: 'Écaille', dore: 'Doré', argent: 'Argent', transparent: 'Transparent', colore: 'Colorée',
  ombre: 'Ombre de barbe', moustache: 'Moustache', bouc: 'Bouc', collier: 'Collier', courte: 'Courte', longue: 'Longue',
  comme_cheveux: 'Comme les cheveux', plus_claire: 'Plus claire', plus_foncee: 'Plus foncée', grise: 'Grise',
  legeres: 'Légères', marquees: 'Marquées', joue_gauche: 'Joue gauche', joue_droite: 'Joue droite', menton: 'Menton', levre: 'Lèvre',
  puces: 'Puces', anneaux: 'Anneaux', pendantes: 'Pendantes',
  bonnet: 'Bonnet', casquette: 'Casquette', bandeau: 'Bandeau', foulard: 'Foulard', chapeau: 'Chapeau', serre_tete: 'Serre-tête',
};

// La fiche de Léa (ce que renvoie le relais pour sa photo ; « yeux.couleur » est incertain).
export const FICHE_LEA = {
  cheveux: { longueur: 'mi_longs', texture: 'ondules', coiffure: 'raie_cote', couleur: 'chatain', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'arques' },
  yeux: { couleur: 'noisette', forme: 'amande' },
  lunettes: { type: 'rondes', couleur: 'ecaille' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'legeres', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'puces', piercing_nez: false },
  incertains: ['yeux.couleur'],
};
export const clone = f => JSON.parse(JSON.stringify(f));

/* =====================================================================================================================
   2. PALETTES CURATÉES (pas de couleur libre) : base, ombre, reflet (+ sourcil pour les cheveux)
   Choisies pour rester harmonieuses avec le menthe #78D8B4 et lisibles à 60 px : aucune teinte de cheveux n'est un
   vert proche du corps (le « vert » est un vert sapin), les blonds gardent une ombre assez soutenue pour se détacher.
   ===================================================================================================================== */
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
};
export const NATURELLES = ['noir', 'brun_fonce', 'brun', 'chatain', 'chatain_clair', 'blond_fonce', 'blond', 'blond_platine', 'roux', 'auburn', 'poivre_sel', 'gris', 'blanc'];
export const PAL_YEUX = { // fonce (haut de l'iris), clair (bas), anneau, reflet teinté (vu en petit)
  marron_fonce: ['#4C2E1E', '#7E5236', '#2A1A12', 'rgba(150,100,70,.45)'],
  marron: ['#6E4024', '#B0743E', '#3A2214', 'rgba(190,125,70,.48)'],
  noisette: ['#6A5626', '#BB9A48', '#3A2E14', 'rgba(200,170,80,.5)'],
  vert: ['#3A6638', '#7DB064', '#1E3A1E', 'rgba(130,190,110,.5)'],
  gris: ['#5A6870', '#AAB6BE', '#2E3840', 'rgba(180,195,205,.5)'],
  bleu: ['#2C5698', '#72A4DE', '#18305A', 'rgba(120,170,230,.52)'],
  bleu_clair: ['#4A88C2', '#AAD6F4', '#26507A', 'rgba(170,215,245,.55)'],
};
export const PAL_MONTURE = { // base, reflet (écaille : texture peinte, voir texEcaille)
  noir: ['#2E2725', '#6A5E58'], ecaille: ['#8A5530', '#D49A55'], dore: ['#D8A63C', '#FFE9A8'], argent: ['#AEB6BF', '#F2F5F8'],
  transparent: ['#E6DDD0', '#FFFFFF'], colore: ['#E0557A', '#FFB0C4'],
};
export const PAL_COUVRE = { bonnet: '#E8A63A', casquette: '#4F67C4', bandeau: '#FF8A73', foulard: '#A08CF7', chapeau: '#E9CC8E', serre_tete: '#E0557A' };
export const PAL_DIVERS = { taches: 'rgba(196,118,74,', grain: '#5A3A2E', bijou: '#E7B44A', bijouReflet: '#FFF3C4', ras: '#78D8B4' };

const hex = h => new THREE.Color(h);
export function couleursCheveux(f) {
  const c = f?.cheveux?.couleur || 'chatain';
  const [base, ombre, reflet, sourcil] = PAL_CHEVEUX[c];
  // mèches claires : reflet éclairci ; colorées : rose (ou bleu si les cheveux sont déjà roses)
  const meche = f?.cheveux?.meches === 'colorees' ? (c === 'rose' ? '#8FB4F2' : '#F49CBA') : mixHex(reflet, '#FFF4DC', .45);
  return { base, ombre, reflet, sourcil, meche };
}
export function couleursBarbe(f) {
  const h = couleursCheveux(f), b = f?.barbe?.couleur || 'comme_cheveux';
  if (b === 'grise') return { base: '#ADA69E', ombre: '#8A837B', reflet: '#D4CEC6' };
  if (b === 'plus_claire') return { base: h.reflet, ombre: h.base, reflet: mixHex(h.reflet, '#FFFFFF', .4) };
  if (b === 'plus_foncee') return { base: h.ombre, ombre: mixHex(h.ombre, '#1A1210', .5), reflet: h.base };
  return { base: h.base, ombre: h.ombre, reflet: h.reflet };
}
export function mixHex(a, b, p) { const A = hex(a), B = hex(b); A.lerp(B, p); return '#' + A.getHexString(); }

/* =====================================================================================================================
   3. COMPATIBILITÉ : toute fiche (IA, Studio, tirage) passe par normaliser() avant d'être portée
   ===================================================================================================================== */
const LONG_IDX = l => SCHEMA.cheveux.longueur.indexOf(l);
export const REGLES = [
  ['Sans cheveux ou cheveux rasés : coiffure « libres », texture et volume sans effet', f => LONG_IDX(f.cheveux.longueur) <= 1 && (f.cheveux.coiffure !== 'libres' || f.cheveux.volume !== 'plat'), f => { f.cheveux.coiffure = 'libres'; f.cheveux.volume = 'plat'; f.cheveux.meches = 'aucune'; }],
  ['Queue de cheval, chignon, tresses : au moins mi-longs', f => ['queue_de_cheval', 'chignon', 'tresses'].includes(f.cheveux.coiffure) && LONG_IDX(f.cheveux.longueur) < 4, f => { f.cheveux.longueur = 'mi_longs'; }],
  ['Locks : au moins courts', f => f.cheveux.coiffure === 'locks' && LONG_IDX(f.cheveux.longueur) < 3, f => { f.cheveux.longueur = 'courts'; }],
  ['Côtés rasés : de très courts à mi-longs sur le dessus', f => f.cheveux.coiffure === 'cotes_rases' && (LONG_IDX(f.cheveux.longueur) < 2 || LONG_IDX(f.cheveux.longueur) > 4), f => { f.cheveux.longueur = LONG_IDX(f.cheveux.longueur) < 2 ? 'tres_courts' : 'mi_longs'; }],
  ['Frange et raies : au moins courts', f => ['frange', 'raie_milieu', 'raie_cote'].includes(f.cheveux.coiffure) && LONG_IDX(f.cheveux.longueur) < 3, f => { f.cheveux.coiffure = 'libres'; }],
  ['Crépus : le volume remplace la longueur (ils ne pendent pas sous les épaules)', f => f.cheveux.texture === 'crepus' && f.cheveux.longueur === 'tres_longs' && f.cheveux.coiffure === 'libres', f => { f.cheveux.longueur = 'longs'; }],
  ['Pas de lunettes : couleur sans effet', f => f.lunettes.type === 'aucune' && f.lunettes.couleur, f => { delete f.lunettes.couleur; }],
  ['Lunettes sans couleur : noir', f => f.lunettes.type !== 'aucune' && !f.lunettes.couleur, f => { f.lunettes.couleur = f.lunettes.type === 'aviateur' ? 'dore' : 'noir'; }],
  ['Pas de barbe : couleur sans effet', f => f.barbe.type === 'aucune' && f.barbe.couleur, f => { delete f.barbe.couleur; }],
  ['Barbe « comme les cheveux » sans cheveux : brun', f => f.barbe.type !== 'aucune' && (!f.barbe.couleur || f.barbe.couleur === 'comme_cheveux') && LONG_IDX(f.cheveux.longueur) === 0, f => { f.barbe.couleur = 'comme_cheveux'; f.cheveux.couleur = NATURELLES.includes(f.cheveux.couleur) ? f.cheveux.couleur : 'brun'; }],
  ['Foulard : il couvre les cheveux et les oreilles (rien n\'est perdu, juste caché)', () => false, () => {}],
  ['Bonnet, chapeau, casquette : le volume des cheveux passe dessous (au plus « moyen »), le chignon est caché', () => false, () => {}],
];
export function normaliser(fiche) {
  const f = clone(fiche), corrections = [];
  const def = { cheveux: { longueur: 'courts', texture: 'raides', coiffure: 'libres', couleur: 'brun', meches: 'aucune', volume: 'moyen' }, sourcils: { epaisseur: 'moyens', forme: 'droits' }, yeux: { couleur: 'marron', forme: 'ronds' }, lunettes: { type: 'aucune' }, barbe: { type: 'aucune' }, peau: { taches_de_rousseur: 'aucune', grain_de_beaute: 'aucun' }, oreilles: { boucles: 'aucune', piercing_nez: false } };
  f.incertains = Array.isArray(f.incertains) ? f.incertains.slice() : [];
  for (const fam in def) {
    f[fam] = Object.assign({}, def[fam], f[fam] || {});
    for (const k in SCHEMA[fam]) if (f[fam][k] !== undefined && !SCHEMA[fam][k].includes(f[fam][k])) { // valeur inconnue → défaut + « incertain »
      f[fam][k] = def[fam][k]; if (f[fam][k] === undefined) delete f[fam][k]; f.incertains.push(fam + '.' + k);
    }
  }
  if (!COUVRE_CHEFS.includes(f.couvre_chef)) f.couvre_chef = 'aucun';
  for (const [nom, viole, corrige] of REGLES) if (viole(f)) { corrige(f); corrections.push(nom); }
  return { fiche: f, corrections };
}

/* =====================================================================================================================
   4. COMBIEN DE PILOU ? et TIRAGE À GRAINE (« Surprenez-moi », mosaïque)
   ===================================================================================================================== */
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function compter() {
  const C = SCHEMA.cheveux;
  const cheveux = C.longueur.length * C.texture.length * C.coiffure.length * C.couleur.length * C.meches.length * C.volume.length;
  let coherents = 0; // combinaisons qui passent normaliser() sans correction
  for (const longueur of C.longueur) for (const texture of C.texture) for (const coiffure of C.coiffure) for (const volume of C.volume) for (const meches of C.meches) {
    const f = { cheveux: { longueur, texture, coiffure, couleur: 'brun', meches, volume }, lunettes: { type: 'aucune' }, barbe: { type: 'aucune' } };
    if (!REGLES.slice(0, 6).some(([, v]) => v(f))) coherents += C.couleur.length;
  }
  const barbe = (SCHEMA.barbe.type.length - 1) * SCHEMA.barbe.couleur.length + 1;
  const sourcils = 9, yeux = 21, lunettes = (SCHEMA.lunettes.type.length - 1) * SCHEMA.lunettes.couleur.length + 1, peau = 15, oreilles = 8, couvre = COUVRE_CHEFS.length;
  const autres = barbe * sourcils * yeux * lunettes * peau * oreilles * couvre;
  return { cheveux, coherents, barbe, sourcils, yeux, lunettes, peau, oreilles, couvre, total: cheveux * autres, totalCoherent: coherents * autres };
}
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
// Tirage d'une fiche cohérente. « force » impose des valeurs (tirage stratifié de la mosaïque) ; le reste suit la graine.
// Les probabilités sont pondérées pour que « Surprenez-moi » donne des Pilou portables (pas 1 sur 2 avec un chapeau).
export function tirer(seed, force = {}) {
  const r = rng(seed * 2654435761 + 97);
  const w = (pairs) => { let s = 0; for (const [, p] of pairs) s += p; let x = r() * s; for (const [v, p] of pairs) { x -= p; if (x <= 0) return v; } return pairs[0][0]; };
  const f = {
    cheveux: {
      longueur: w([['aucun', .5], ['rases', .8], ['tres_courts', 1.2], ['courts', 1.6], ['mi_longs', 1.5], ['longs', 1.3], ['tres_longs', .5]]),
      texture: pick(r, SCHEMA.cheveux.texture), coiffure: pick(r, SCHEMA.cheveux.coiffure),
      couleur: r() < .78 ? pick(r, NATURELLES) : pick(r, ['rose', 'bleu', 'violet', 'vert']),
      meches: w([['aucune', 4], ['claires', 1], ['colorees', .7]]), volume: pick(r, SCHEMA.cheveux.volume),
    },
    sourcils: { epaisseur: pick(r, SCHEMA.sourcils.epaisseur), forme: pick(r, SCHEMA.sourcils.forme) },
    yeux: { couleur: pick(r, SCHEMA.yeux.couleur), forme: pick(r, SCHEMA.yeux.forme) },
    lunettes: { type: w([['aucune', 3], ...SCHEMA.lunettes.type.slice(1).map(t => [t, .5])]), couleur: pick(r, SCHEMA.lunettes.couleur) },
    barbe: { type: w([['aucune', 4], ...SCHEMA.barbe.type.slice(1).map(t => [t, .45])]), couleur: w([['comme_cheveux', 3], ['plus_claire', 1], ['plus_foncee', 1], ['grise', 1]]) },
    peau: { taches_de_rousseur: w([['aucune', 3], ['legeres', 1], ['marquees', .7]]), grain_de_beaute: w([['aucun', 5], ['joue_gauche', .5], ['joue_droite', .5], ['menton', .4], ['levre', .4]]) },
    oreilles: { boucles: w([['aucune', 3], ['puces', 1], ['anneaux', .8], ['pendantes', .6]]), piercing_nez: r() < .12 },
    couvre_chef: w([['aucun', 6], ...COUVRE_CHEFS.slice(1).map(c => [c, .5])]),
    incertains: [],
  };
  for (const k in force) { const [fam, ch] = k.split('.'); if (ch) f[fam][ch] = force[k]; else f[fam] = force[k] && typeof force[k] === 'object' && !Array.isArray(force[k]) ? Object.assign(f[fam] || {}, force[k]) : force[k]; }
  return normaliser(f).fiche;
}

/* =====================================================================================================================
   5. ANIMATIONS D'APPARITION (transformation, Studio) : durées en ms, courbes nommées comme dans anim.js
   ===================================================================================================================== */
export const APPARITION = {
  cheveux: { duree: 1400, courbe: 'ressort cheveux (raideur 140, amortissement 11) : pousse depuis l\'antenne, dépasse de 6 % puis se pose', },
  sourcils: { duree: 420, courbe: 'sortie', dit: 'tracés de l\'intérieur vers l\'extérieur' },
  yeux: { duree: 600, courbe: 'sortie', dit: 'l\'iris s\'élargit depuis la pupille, puis un clignement' },
  lunettes: { duree: 900, courbe: 'rebond', dit: 'descendent de 0,55, se posent (écrasement de Pilou −0,05), reflet qui balaie en 300 ms' },
  taches: { duree: 700, courbe: 'rebond', dit: 'du centre des joues vers l\'extérieur, 30 ms d\'écart' },
  boucles: { duree: 500, courbe: 'rebond', dit: 'pop × 1,35 puis éclat (étoile 400 ms)' },
  barbe: { duree: 800, courbe: 'sortie', dit: 'peinte en fondu pointillé, la barbe longue descend (ressort doux)' },
  couvre: { duree: 650, courbe: 'rebond', dit: 'tombe de 0,5, écrase Pilou de −0,06, ressort vif' },
};

/* =====================================================================================================================
   6. PEINTURE DU VISAGE
   ===================================================================================================================== */
const FRK = (() => { // positions graine des taches de rousseur (unités du visage), triées du centre des joues vers l'extérieur
  const r = rng(4242), pts = [];
  for (let i = 0; i < 64; i++) {
    const s = i % 2 ? 1 : -1, a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = s * (.3 + Math.cos(a) * .135 * d), y = .8 + Math.sin(a) * .06 * d;
    const ex = (x - s * .2) / .095, ey = (y - .9) / .118; if (ex * ex + ey * ey < 1) continue; // pas sur les yeux
    pts.push({ x, y, rr: .0062 + r() * .0042, a: .55 + r() * .35, d, nez: false });
  }
  for (let i = 0; i < 14; i++) { const x = (r() * 2 - 1) * .11, y = .805 + r() * .035; pts.push({ x, y, rr: .005 + r() * .003, a: .5 + r() * .3, d: .5 + Math.abs(x) * 2, nez: true }); }
  return pts.sort((p, q) => p.d - q.d);
})();
const MOLE = { joue_gauche: [-.33, .72], joue_droite: [.33, .72], menton: [.07, .64], levre: [.105, .775] };

export function creerPeintre() {
  let f = null, rv = {};
  const P = {
    fiche: () => f,
    set(fiche, revelation) { f = fiche; rv = revelation || {}; },
    aSourcils: () => !!f && (rv.sourcils ?? 1) > .01,
    iris() {
      if (!f) return null; const a = clamp(rv.yeux ?? 1); if (a <= 0) return null;
      const [fonce, clair, anneau, reflet] = PAL_YEUX[f.yeux.couleur];
      return { a, fonce, clair, anneau, reflet };
    },
    // forme des yeux : appliquée aux paramètres du visage avant le dessin
    formeYeux(F) {
      if (!f) return; const a = clamp(rv.yeux ?? 1);
      const fo = f.yeux.forme, sx = fo === 'amande' ? 1.07 : fo === 'allonges' ? 1.14 : 1, sy = fo === 'amande' ? .9 : fo === 'allonges' ? .82 : 1;
      F.esx *= lerp(1, sx, a); F.esy *= lerp(1, sy, a);
      if (fo !== 'ronds') F.lidTop = Math.max(F.lidTop, lerp(F.lidTop, F.lidTop + .06, a));
    },
    peindre(ctx, X, Y, k, F, phase) {
      if (!f) return;
      if (phase === 'sous') peindreBarbe(ctx, X, Y, k, F, f, clamp(rv.barbe ?? 1), 'sous');
      else if (phase === 'peau') peindrePeau(ctx, X, Y, k, F, f, rv.taches ?? 1, rv.grain ?? 1);
      else if (phase === 'sourcils') peindreSourcils(ctx, X, Y, k, F, f, clamp(rv.sourcils ?? 1));
      else if (phase === 'dessus') { peindreBarbe(ctx, X, Y, k, F, f, clamp(rv.barbe ?? 1), 'dessus'); peindrePiercing(ctx, X, Y, k, f, clamp(rv.boucles ?? 1)); }
    },
  };
  return P;
}
const pop = p => p <= 0 ? 0 : p >= 1 ? 1 : 1 + 2.56 * Math.pow(p - 1, 3) + 1.56 * Math.pow(p - 1, 2); // « rebond » approché


function peindreSourcils(ctx, X, Y, k, F, f, a) {
  const col = couleursCheveux(f).sourcil;
  const T = { fins: .012, moyens: .018, epais: .026 }[f.sourcils.epaisseur];
  const fo = f.sourcils.forme;
  // profil vertical le long du sourcil (u = 0 côté nez → 1 côté tempe). Jamais l'intérieur plus haut que l'extérieur
  // relevé en pente (lecture « triste ») : l'extrémité intérieure reste la plus basse ou à égalité.
  const prof = u => fo === 'arques' ? .019 * Math.sin(Math.PI * Math.min(1, u * 1.08)) - .002 * u
    : fo === 'anguleux' ? (u < .64 ? .022 * u / .64 : .022 - .03 * (u - .64) / .36) : .005 * Math.sin(Math.PI * u) - .002 * u;
  const N = 18, L = .145;
  ctx.fillStyle = col;
  for (const s of [-1, 1]) {
    const ey = .9 + F.lookY * .036 + .098 * F.es * F.esy;
    const by = ey + .05 + (f.lunettes.type !== 'aucune' ? .026 : 0) + F.browY + (s < 0 ? F.browYL : F.browYR) + .004 * F.lookY;
    const bx = s * .207 + F.lookX * .015;
    ctx.save(); ctx.translate(X(bx), Y(by)); ctx.rotate(-F.browA * s);
    const up = [], lo = [];
    const n = Math.max(2, Math.round(N * a));
    for (let j = 0; j <= n; j++) {
      const u = (j / N), x = s * (-L / 2 + u * L), y = prof(u), w = T * (1.08 - .55 * u) * (u < .08 ? .75 + 3 * u : 1);
      up.push([x * k, -(y + w / 2) * k]); lo.push([x * k, -(y - w / 2) * k]);
    }
    ctx.beginPath(); up.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    for (let j = lo.length - 1; j >= 0; j--) ctx.lineTo(lo[j][0], lo[j][1]);
    ctx.closePath(); ctx.fill();
    // bout arrondi côté nez
    ctx.beginPath(); ctx.arc(up[0][0], (up[0][1] + lo[0][1]) / 2, Math.abs(up[0][1] - lo[0][1]) / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function peindrePeau(ctx, X, Y, k, F, f, aT, aG) {
  const t = f.peau.taches_de_rousseur;
  if (t !== 'aucune' && aT > 0) {
    let i = 0; const n = t === 'legeres' ? 28 : 999;
    for (const p of FRK) {
      if (t === 'legeres' && p.nez) continue; if (i++ >= n) break;
      const q = clamp((aT - p.d * .5) / .5), sc = pop(q); if (sc <= .01) continue;
      ctx.fillStyle = PAL_DIVERS.taches + (p.a * (t === 'legeres' ? .8 : 1) * Math.min(1, q * 3)) + ')';
      ctx.beginPath(); ctx.ellipse(X(p.x), Y(p.y), p.rr * k * sc, p.rr * k * .86 * sc, .4, 0, Math.PI * 2); ctx.fill();
    }
  }
  const g = f.peau.grain_de_beaute;
  if (g !== 'aucun' && aG > 0) {
    const [x, y] = MOLE[g], sc = pop(clamp(aG));
    ctx.fillStyle = PAL_DIVERS.grain; ctx.beginPath(); ctx.arc(X(x), Y(y), .0105 * k * sc, 0, Math.PI * 2); ctx.fill();
  }
}

// régions de barbe (unités du visage) : contour extérieur commun, bord supérieur sous les joues (les joues restent)
function cheminBarbe(ctx, X, Y, type, my) {
  ctx.beginPath();
  if (type === 'bouc') { ctx.ellipse(X(0), Y(.654 + my * .6), .062 * (X(1) - X(0)), .04 * (X(1) - X(0)), 0, 0, Math.PI * 2); return; }
  ctx.moveTo(X(-.455), Y(.9));
  ctx.bezierCurveTo(X(-.47), Y(.72), X(-.31), Y(.605), X(0), Y(.592));
  ctx.bezierCurveTo(X(.31), Y(.605), X(.47), Y(.72), X(.455), Y(.9));
  if (type === 'collier') {
    ctx.lineTo(X(.425), Y(.9)); ctx.bezierCurveTo(X(.437), Y(.74), X(.29), Y(.628), X(0), Y(.622));
    ctx.bezierCurveTo(X(-.29), Y(.628), X(-.437), Y(.74), X(-.425), Y(.9));
  } else {
    ctx.lineTo(X(.405), Y(.9)); ctx.bezierCurveTo(X(.4), Y(.79), X(.35), Y(.712), X(.25), Y(.703));
    ctx.bezierCurveTo(X(.15), Y(.696), X(.1), Y(.752 + my), X(0), Y(.768 + my));
    ctx.bezierCurveTo(X(-.1), Y(.752 + my), X(-.15), Y(.696), X(-.25), Y(.703));
    ctx.bezierCurveTo(X(-.35), Y(.712), X(-.4), Y(.79), X(-.405), Y(.9));
  }
  ctx.closePath();
}
const STUB = (() => { const r = rng(777), a = []; for (let i = 0; i < 520; i++) a.push([(r() * 2 - 1) * .48, .57 + r() * .37, r()]); return a; })();
const POILS = (() => { const r = rng(91), a = []; for (let i = 0; i < 260; i++) a.push([(r() * 2 - 1) * .48, .57 + r() * .37, r() * 2 - 1, r()]); return a; })();
function peindreBarbe(ctx, X, Y, k, F, f, a, phase) {
  const ty = f.barbe.type; if (ty === 'aucune' || a <= 0) return;
  const c = couleursBarbe(f), my = F.my || 0;
  if (phase === 'sous') {
    if (ty === 'moustache') return;
    const region = ty === 'longue' ? 'courte' : ty === 'ombre' ? 'courte' : ty;
    ctx.save(); cheminBarbe(ctx, X, Y, region, my); ctx.clip();
    if (ty === 'ombre') {
      ctx.globalAlpha = .2 * a; ctx.fillStyle = c.ombre; ctx.fillRect(0, 0, X(1) * 2, X(1) * 2);
      ctx.globalAlpha = .55 * a; ctx.fillStyle = c.ombre;
      for (const [x, y, q] of STUB) if (q < a) { ctx.beginPath(); ctx.arc(X(x), Y(y), .0032 * k, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = c.base; ctx.fillRect(0, 0, X(1) * 2, X(1) * 2);
      // petites mèches : ombre et reflet (texture lisible en gros plan, fondue en petit)
      ctx.lineWidth = .0075 * k; ctx.lineCap = 'round';
      for (const [x, y, d, q] of POILS) { if (q > a) continue; ctx.strokeStyle = q < .5 ? c.ombre : c.reflet; ctx.globalAlpha = .55 * a;
        ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x + d * .012), Y(y - .026)); ctx.stroke(); }
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // contour doux du bord (même brun que le contour de Pilou, très léger) : seulement barbes pleines
    if (ty !== 'ombre') { ctx.save(); ctx.globalAlpha = .28 * a; ctx.strokeStyle = c.ombre; ctx.lineWidth = .008 * k; cheminBarbe(ctx, X, Y, region, my); ctx.stroke(); ctx.restore(); }
  } else if (['moustache', 'bouc', 'courte', 'longue'].includes(ty)) {
    // moustache, posée au-dessus de la bouche (elle suit le centre de la bouche)
    const mx = F.mx || 0, yc = .745 + my, sc = ty === 'bouc' ? .74 : 1;
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.4);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(mx), Y(yc + .056 * sc));
      ctx.bezierCurveTo(X(mx + s * .05 * sc), Y(yc + .066 * sc), X(mx + s * .11 * sc), Y(yc + .05 * sc), X(mx + s * .13 * sc), Y(yc + .006));
      ctx.bezierCurveTo(X(mx + s * .1 * sc), Y(yc + .02), X(mx + s * .05 * sc), Y(yc + .027), X(mx), Y(yc + .032));
      ctx.closePath(); ctx.fillStyle = c.base; ctx.fill();
      ctx.strokeStyle = c.ombre; ctx.lineWidth = .007 * k; ctx.globalAlpha = .45 * a; ctx.stroke(); ctx.globalAlpha = Math.min(1, a * 1.4);
      ctx.strokeStyle = c.reflet; ctx.lineWidth = .006 * k; ctx.beginPath(); ctx.moveTo(X(mx + s * .03), Y(yc + .05 * sc)); ctx.quadraticCurveTo(X(mx + s * .07), Y(yc + .052 * sc), X(mx + s * .1 * sc), Y(yc + .03)); ctx.stroke();
    }
    ctx.restore();
  }
}
function peindrePiercing(ctx, X, Y, k, f, a) {
  if (!f.oreilles.piercing_nez || a <= 0) return;
  const sc = pop(clamp(a)), x = X(.05), y = Y(.818);
  ctx.fillStyle = PAL_DIVERS.bijou; ctx.beginPath(); ctx.arc(x, y, .0092 * k * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL_DIVERS.bijouReflet; ctx.beginPath(); ctx.arc(x - .003 * k, y - .003 * k, .0035 * k * sc, 0, Math.PI * 2); ctx.fill();
}

/* =====================================================================================================================
   7. PIÈCES 3D
   Repère « tour » : celui du profil de révolution du corps (y = 0 en bas du galet, y = 1,38 au sommet, z vers l'avant).
   ===================================================================================================================== */
// profil du crâne échantillonné en abscisse curviligne depuis la couronne (autour de l'antenne) jusqu'au plus large
const CR = (() => {
  const tTop = Math.PI - .095, tW = 1.4543, N = 360, pts = [];
  let L = 0, pr = null, py = null;
  for (let i = 0; i <= N; i++) {
    const t = lerp(tTop, tW, i / N), r = bodyR(t), y = (1 - Math.cos(t)) / 2 * H;
    const dr = (bodyR(t + 1e-4) - bodyR(t - 1e-4)) / 2e-4, dy = Math.sin(t) * H / 2, n = Math.hypot(dr, dy);
    if (pr !== null) L += Math.hypot(r - pr, y - py);
    pts.push([L, r, y, dy / n, -dr / n]); pr = r; py = y;
  }
  return { pts, Lw: L, rW: pts[N][1], yW: pts[N][2], N };
})();
export const CRANE = CR;
function crane(l, o) {
  if (l <= 0) { const p = CR.pts[0]; o[0] = p[1]; o[1] = p[2]; o[2] = p[3]; o[3] = p[4]; return o; }
  if (l >= CR.Lw) { o[0] = CR.rW; o[1] = CR.yW - (l - CR.Lw); o[2] = 1; o[3] = 0; return o; }
  let lo = 0, hi = CR.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CR.pts[m][0] < l) lo = m; else hi = m; }
  const a = CR.pts[lo], b = CR.pts[hi], p = (l - a[0]) / (b[0] - a[0] || 1);
  o[0] = lerp(a[1], b[1], p); o[1] = lerp(a[2], b[2], p); o[2] = lerp(a[3], b[3], p); o[3] = lerp(a[4], b[4], p); return o;
}
function lDeY(y) {
  if (y <= CR.yW) return CR.Lw + (CR.yW - y);
  let lo = 0, hi = CR.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CR.pts[m][2] > y) lo = m; else hi = m; }
  const a = CR.pts[lo], b = CR.pts[hi]; return lerp(a[0], b[0], clamp((y - a[2]) / (b[2] - a[2] || 1)));
}
// point de la surface du corps vu de face (projection plane du visage) : x, y → [x, y, z] + normale
export function surface(x, y, out = 0) {
  const r = rAtY(y), z = Math.sqrt(Math.max(1e-6, r * r - x * x));
  const t = Math.acos(clamp(1 - 2 * y / H, -1, 1));
  const dr = (bodyR(t + 1e-4) - bodyR(t - 1e-4)) / 2e-4, dy = Math.sin(t) * H / 2, n = Math.hypot(dr, dy);
  const nr = dy / n, ny = -dr / n;
  const N = [x / r * nr, ny, z / r * nr];
  return { p: [x + N[0] * out, y + N[1] * out, z + N[2] * out], n: N };
}

/* ---------- cheveux : la forme ---------- */
const LONG = { // y de fin de mèche : cadre (mèches qui encadrent le visage), oreille (dégagée), côtés (au-dessus des bras), dos ; épaisseur
  rases: [1.0, 1.0, .98, .95, 0], tres_courts: [1.02, 1.0, .99, .965, .032], courts: [.94, .955, .93, .9, .046],
  mi_longs: [.79, .93, .79, .62, .054], longs: [.74, .93, .78, .4, .058], tres_longs: [.72, .93, .78, .17, .058],
};
const TEX = { // n : mèches sur le tour · amp : relief · wf/wa : ondulation · bump/bf : boucles · vol : gonflant · tip : pointes · bul : volume sur les côtés
  raides: { n: 14, amp: .01, wf: 0, wa: 0, bump: 0, bf: 0, vol: 1, tip: .035, pointe: 1, bul: .12 },
  ondules: { n: 12, amp: .011, wf: 9, wa: 1.0, bump: 0, bf: 0, vol: 1.12, tip: .04, pointe: .5, bul: .3 },
  boucles: { n: 13, amp: .006, wf: 0, wa: 0, bump: .048, bf: 15, vol: 1.3, tip: .05, pointe: 0, bul: .45 },
  frises: { n: 18, amp: .005, wf: 0, wa: 0, bump: .042, bf: 21, vol: 1.55, tip: .035, pointe: 0, bul: .55 },
  crepus: { n: 22, amp: .003, wf: 0, wa: 0, bump: .034, bf: 24, vol: 2.0, tip: .02, pointe: 0, bul: .65 },
};
const VOL = { plat: .72, moyen: 1, volumineux: 1.42 };
const RAIE = 2 * Math.PI * 3 / 48; // la raie sur le côté tombe sur une colonne du maillage
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function formeCheveux(f, couvre) {
  const c = f.cheveux, Lg = LONG[c.longueur]; if (!Lg) return null;
  const tx = TEX[c.texture], co = c.coiffure, ras = c.longueur === 'rases';
  const rassemble = ['queue_de_cheval', 'chignon', 'tresses'].includes(co);
  let [cadre, oreille, cote, dos, T] = Lg;
  if (rassemble) { cadre = 1.0; oreille = .99; cote = .96; dos = .9; }
  if (co === 'locks') { cadre = 1.0; oreille = .99; cote = .97; dos = .95; T = .034; }
  if (co === 'cotes_rases') { cadre = .99; oreille = .99; cote = .97; dos = .93; }
  const afro = c.texture === 'crepus' && !rassemble && co !== 'locks' && !ras;
  if (afro) { cadre = Math.max(cadre, .86); oreille = Math.max(oreille, .9); cote = Math.max(cote, .84); dos = Math.max(dos, .74); }
  if (c.texture === 'frises' && !rassemble && !ras) { cadre = Math.max(cadre, .8); dos = Math.max(dos, .5); }
  const court = ['rases', 'tres_courts'].includes(c.longueur);
  let front;
  if (ras || court) front = φ => 1.19 + .015 * sstep(0, 1, Math.abs(φ));
  else switch (co) {
    case 'frange': front = φ => 1.118 + .016 * sstep(.4, .9, Math.abs(φ)); break;
    case 'raie_milieu': front = φ => 1.25 - .12 * sstep(0, .7, Math.abs(φ)); break;
    case 'raie_cote': front = φ => φ > RAIE ? lerp(1.26, 1.175, sstep(RAIE, .95, φ)) : lerp(1.27, 1.14, sstep(RAIE, -.5, φ)); break;
    case 'en_arriere': case 'queue_de_cheval': case 'chignon': case 'tresses': front = φ => 1.235 - .02 * sstep(.4, 1.1, Math.abs(φ)); break;
    case 'locks': front = φ => 1.175 - .015 * Math.cos(φ * 9); break;
    case 'cotes_rases': front = φ => 1.16; break;
    default: front = φ => 1.16 + .012 * sstep(0, .9, Math.abs(φ)) - .008 * Math.cos(φ * 6);
  }
  let vol = (ras ? 0 : VOL[c.volume]) * (court ? Math.min(1.25, tx.vol) : tx.vol);
  if (rassemble) vol *= .6;
  if (['bonnet', 'chapeau', 'casquette'].includes(couvre)) vol = Math.min(vol, 1.15);
  return { f, c, tx, co, ras, court, rassemble, afro, cadre, oreille, cote, dos, T, vol, front, raie: co === 'raie_milieu' ? 0 : co === 'raie_cote' ? RAIE : null,
    cotesRases: co === 'cotes_rases', couvre };
}
function yFin(φ, sh) {
  const a = Math.abs(φ);
  let y = lerp(sh.front(φ), sh.cadre, sstep(.84, 1.1, a));   // mèches qui encadrent le visage (devant la joue, jamais dessus)
  y = lerp(y, sh.oreille, sstep(1.26, 1.36, a));             // dégagé au-dessus de l'oreille : les boucles restent visibles
  y = lerp(y, sh.cote, sstep(1.5, 1.62, a));                 // côtés, au-dessus des bras
  return lerp(y, sh.dos, sstep(1.7, 1.86, a));               // dos
}
// zone d'une colonne : 0 frange, 1 cadre, 2 oreille, 3 dos (pour l'amplitude des pointes)
const zonePointe = a => a < .84 ? .55 : a < 1.26 ? 1.25 : a < 1.5 ? .5 : 1.1;
// épaisseur (enveloppe) au-dessus du crâne à l'azimut φ : sert aux couvre-chefs pour se poser SUR les cheveux
export function enveloppeCheveux(sh) { if (!sh) return 0; return sh.ras ? .008 : .0065 + sh.T * sh.vol + sh.tx.amp + sh.tx.bump; }

/* ---------- géométrie d'une calotte : grille NU × NV refermée autour de l'antenne et sur le crâne aux pointes ---------- */
function grille(NU, NV) {
  const g = new THREE.BufferGeometry(), nv = NU * (NV + 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('aHair', new THREE.BufferAttribute(new Float32Array(nv * 4), 4));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nv * 2), 2));
  const idx = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = ((i + 1) % NU) * (NV + 1) + j, c = b + 1, d = a + 1;
    idx.push(a, d, b, b, d, c);
  }
  g.setIndex(idx); g.userData = { NU, NV }; return g;
}
const _o = [0, 0, 0, 0];
// remplit la calotte. dyn : { g (pousse 0..1+), sx, sz (balancement des mèches qui pendent) }
function remplirCalotte(geo, sh, dyn) {
  const { NU, NV } = geo.userData, P = geo.attributes.position.array, A = geo.attributes.aHair.array, UV = geo.attributes.uv.array;
  const tx = sh.tx, g = Math.max(.001, dyn.g), gT = sstep(0, .55, g) * (1 + .12 * Math.max(0, g - 1) / .06);
  const flare = sh.c.longueur === 'longs' || sh.c.longueur === 'tres_longs' ? .2 : sh.c.longueur === 'mi_longs' ? .17 : .05;
  const nT = Math.max(5, Math.round(tx.n * .5)); // les pointes forment de grosses mèches (≈ 6 à 11 sur le tour)
  for (let i = 0; i < NU; i++) {
    let φ = 2 * Math.PI * i / NU; if (φ > Math.PI) φ -= 2 * Math.PI;
    const a = Math.abs(φ);
    // pointes : festons selon la texture (pointus pour les raides, arrondis pour les bouclés), plus marqués sur les mèches
    // qui encadrent le visage, discrets sur la frange, nuls si les cheveux sont attachés
    const cl = Math.cos(φ * nT + (sh.raie !== null ? .9 : 0));
    let pointe = tx.pointe ? Math.pow(.5 - .5 * cl, 1 + 1.5 * tx.pointe) : .5 - .5 * Math.abs(Math.cos(φ * nT * .5));
    if (sh.co === 'raie_cote' && a < 1.3) { const q = ((φ - RAIE) * nT / (2 * Math.PI) % 1 + 1) % 1; pointe = φ < RAIE ? Math.pow(q, 1.6) : Math.pow(1 - q, 1.6); }
    const amp = sh.ras ? 0 : tx.tip * zonePointe(a) * (sh.rassemble && a > 1.3 ? 0 : 1) * (sh.co === 'frange' && a < .84 ? .4 : 1);
    const ye = yFin(φ, sh) - amp * pointe;
    const Lend = lDeY(ye) * g;
    const tipLen = Math.min(sh.afro ? .16 : sh.tx.bump ? .11 : .085, Lend * .4);
    const dR = sh.raie !== null ? Math.abs(φ - sh.raie) : 9, isRaie = dR < 1e-3, presRaie = dR < .14;
    const meche = sh.c.meches !== 'aucune' && hash(Math.round(φ * tx.n / (2 * Math.PI)) + 7) > .58 ? 1 : 0;
    for (let j = 0; j <= NV; j++) {
      // rangées : uniformes jusqu'à la zone de pointe, puis 3 rangées pour l'arrondi
      const jj = NV - 3, l = j <= jj ? (Lend - tipLen) * (j / jj) : Lend - tipLen + tipLen * Math.sin((j - jj) / 3 * Math.PI / 2);
      crane(l, _o); const r0 = _o[0], y0 = _o[1], nr = _o[2], ny = _o[3];
      const dT = Lend - l, tip = dT >= tipLen ? 1 : Math.sqrt(Math.max(0, 1 - ((tipLen - dT) / tipLen) ** 2));
      const crown = sh.afro ? .75 + .25 * sstep(0, .08, l) : .35 + .65 * sstep(0, .1, l), relief = sstep(.03, .22, l); // la couronne reste lisse autour de l'antenne
      const ph = φ * tx.n + (tx.wa ? tx.wa * Math.sin(l * tx.wf + φ) : 0) + (sh.raie !== null ? Math.sign(φ - sh.raie) * l * 2.4 : 0);
      const c0 = Math.cos(ph), c = Math.sign(c0) * Math.pow(Math.abs(c0), .65);
      let disp = tx.amp * c * relief, ridge = .5 + .5 * c * relief;
      if (tx.wf) disp += .012 * Math.sin(l * tx.wf + φ * 2) * relief;
      if (tx.bump) { const b = Math.cos(φ * tx.n * .55 + Math.sin(l * 7) * 1.3) * Math.cos(l * tx.bf + φ * 2.3); disp += tx.bump * (.5 + .5 * b) * relief; ridge = .3 + .7 * (.5 + .5 * b * relief); }
      // volume : les cheveux gonflent sur les côtés du crâne (pas un casque à épaisseur constante)
      const bulge = 1 + tx.bul * sstep(.82, 1.02, y0) * (1 - sstep(1.2, 1.34, y0)) * (sh.rassemble ? .3 : 1);
      let T = sh.T * sh.vol * gT * bulge * (sh.afro ? 1 + .45 * sstep(.95, 1.25, y0) : 1);
      let rasW = sh.ras ? 1 : 0;
      if (sh.cotesRases) { const w = sstep(.7, .95, a) * (1 - sstep(1.1, 1.15, y0)); T *= 1 - w; disp *= 1 - w; rasW = w; }
      const hang = Math.max(0, .92 - y0);
      let off = .0068 + (T + flare * hang * gT + (sh.ras ? 0 : disp * gT)) * crown * tip;
      if (isRaie && y0 > sh.front(φ) - .02) { off = .0068 + (off - .0068) * .15; ridge = 0; }
      else if (presRaie && y0 > sh.front(φ) - .02) { off *= 1.12; ridge = Math.max(ridge, .8); } // ça gonfle de part et d'autre de la raie
      let x = (r0 + nr * off) * Math.sin(φ), y = y0 + ny * off, z = (r0 + nr * off) * Math.cos(φ);
      if (hang > 0 && dyn.sx !== undefined) { const w = Math.pow(Math.max(0, .96 - y0), 1.5) * 1.5; x += dyn.sx * w; z += dyn.sz * w; }
      const k = (i * (NV + 1) + j);
      P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
      // reflet : une bande dentelée sur le haut de la tête, côté lumière (lisible même en petit)
      const jag = .014 * Math.cos(φ * tx.n * 2) + .008 * Math.cos(φ * 5);
      const band = sstep(1.17, 1.2, y0 + jag) * (1 - sstep(1.255, 1.29, y0 + jag * .8));
      const hl = sh.ras ? 0 : band * sstep(-.25, .5, Math.cos(φ - .35)) * (tx.bump ? .6 : 1) * (.6 + .4 * ridge);
      A[k * 4] = rasW > .5 ? .5 : ridge; A[k * 4 + 1] = hl; A[k * 4 + 2] = meche * sstep(.25, .7, ridge); A[k * 4 + 3] = rasW;
      UV[k * 2] = i / NU; UV[k * 2 + 1] = l;
    }
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.aHair.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
  geo.computeVertexNormals(); geo.computeBoundingSphere();
}

/* ---------- tubes (queue de cheval, tresses, locks) : une géométrie fusionnée, mise à jour à chaque image ---------- */
function tubes(specs, RAD) { // specs : [{ segs }] → géométrie avec les bons index
  let nv = 0; const idx = [];
  for (const s of specs) {
    s.v0 = nv; const n = s.segs + 1;
    for (let j = 0; j < s.segs; j++) for (let i = 0; i < RAD; i++) {
      const a = s.v0 + j * RAD + i, b = s.v0 + j * RAD + (i + 1) % RAD, c = b + RAD, d = a + RAD;
      idx.push(a, b, d, b, c, d);
    }
    nv += n * RAD;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('aHair', new THREE.BufferAttribute(new Float32Array(nv * 4), 4));
  g.setIndex(idx); g.userData = { specs, RAD }; return g;
}
const _v = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3();
// centre(u) → [x,y,z] ; rayon(u) ; motif(u, θ) → [ridge, lien]
function remplirTube(geo, s, centre, rayon, motif) {
  const { RAD } = geo.userData, P = geo.attributes.position.array, A = geo.attributes.aHair.array;
  for (let j = 0; j <= s.segs; j++) {
    const u = j / s.segs, c = centre(u), c2 = centre(Math.min(1, u + .02)), c1 = centre(Math.max(0, u - .02));
    _t.set(c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]).normalize();
    _up.set(0, 0, 1); if (Math.abs(_t.z) > .9) _up.set(1, 0, 0);
    _n.crossVectors(_t, _up).normalize(); _b.crossVectors(_t, _n).normalize();
    const r = rayon(u);
    for (let i = 0; i < RAD; i++) {
      const θ = 2 * Math.PI * i / RAD, k = s.v0 + j * RAD + i;
      const [ridge, lien, rr] = motif(u, θ);
      const R = r * (rr ?? 1);
      P[k * 3] = c[0] + (_n.x * Math.cos(θ) + _b.x * Math.sin(θ)) * R; P[k * 3 + 1] = c[1] + (_n.y * Math.cos(θ) + _b.y * Math.sin(θ)) * R; P[k * 3 + 2] = c[2] + (_n.z * Math.cos(θ) + _b.z * Math.sin(θ)) * R;
      A[k * 4] = ridge; A[k * 4 + 1] = 0; A[k * 4 + 2] = 0; A[k * 4 + 3] = lien ? 2 : 0;
    }
  }
}
const bez2 = (a, b, c, u) => [0, 1, 2].map(i => (1 - u) * (1 - u) * a[i] + 2 * u * (1 - u) * b[i] + u * u * c[i]);

/* ---------- matière des cheveux : toon de Pilou + couleurs (base, ombre, reflet, mèches, ras, élastique) ---------- */
function matiereCheveux(kit) {
  const m = kit.toon('#ffffff');
  const u = { hBase: { value: new THREE.Color() }, hOmbre: { value: new THREE.Color() }, hReflet: { value: new THREE.Color() }, hMeche: { value: new THREE.Color() },
    hRas: { value: new THREE.Color(PAL_DIVERS.ras) }, hLien: { value: new THREE.Color('#E0557A') }, hMecheOn: { value: 0 },
    hFin: { value: new THREE.Vector4(0, 0, 0, 0) } }; // carte de relief peinte : (mèches fines sur le tour, fréquence d'ondulation, amplitude, type 0 rien · 1 lignes · 2 boucles)
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = sh => {
    prev(sh); Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aHair; varying vec4 vHair; varying vec2 vHuv;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHair = aHair; vHuv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 hBase; uniform vec3 hOmbre; uniform vec3 hReflet; uniform vec3 hMeche; uniform vec3 hRas; uniform vec3 hLien; uniform float hMecheOn; uniform vec4 hFin; varying vec4 vHair; varying vec2 vHuv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 hc = mix(hOmbre, hBase, .12 + .88 * smoothstep(.12, .72, vHair.x));
          hc = mix(hc, hReflet, clamp(vHair.y, 0., 1.) * .75);
          hc = mix(hc, hMeche, clamp(vHair.z, 0., 1.) * hMecheOn);
          float ras = clamp(vHair.w, 0., 1.);
          if (ras > .001) { float n = fract(sin(dot(floor(vObj * 150.), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            vec3 st = mix(hRas, hOmbre, .3 + .4 * step(.45, n)); hc = mix(hc, st, ras); }
          if (hFin.w > .5 && ras < .5 && vHuv.y > .02) {
            float fs, w, ln;
            if (hFin.w < 1.5) { fs = sin(vHuv.x * 6.2832 * hFin.x + sin(vHuv.y * hFin.y + vHuv.x * 6.2832 * 2.) * hFin.z); }
            else { fs = sin(vHuv.x * 6.2832 * hFin.x + sin(vHuv.y * hFin.y * .7) * 1.5) * sin(vHuv.y * hFin.y + vHuv.x * 6.2832 * 3.); }
            w = fwidth(fs); ln = smoothstep(.62 - w, .62 + w, fs) * (1. - smoothstep(.35, .9, w));
            hc = mix(hc, mix(hOmbre, hBase, .25), ln * .55);
          }
          if (vHair.w > 1.5) hc = hLien;
          diffuseColor.rgb = hc; }`);
  };
  m.side = THREE.DoubleSide;
  m.userData.u = u; return m;
}
function couleurMatiere(m, cols) {
  const u = m.userData.u; u.hBase.value.set(cols.base); u.hOmbre.value.set(cols.ombre); u.hReflet.value.set(cols.reflet); if (cols.meche) u.hMeche.value.set(cols.meche);
}

/* ---------- montures : formes 2D de l'œil droit (x vers la tempe), centrées sur l'œil ---------- */
function superellipse(a, b, n, N = 44, f) {
  const pts = []; for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    let x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n); if (f) [x, y] = f(x, y, t); pts.push([x, y]); }
  return pts;
}
export const MONTURES = {
  rondes: { pts: () => superellipse(.126, .126, 2), r: .0115, dy: -.004 },
  rectangulaires: { pts: () => superellipse(.15, .112, 4.2), r: .011, dy: -.004 },
  carrees_epaisses: { pts: () => superellipse(.152, .128, 5), r: .021, dy: 0 },
  papillon: { pts: () => superellipse(.15, .114, 3, 44, (x, y) => [x + .012 * Math.max(0, y / .114) * Math.max(0, x / .15), y + .045 * Math.pow(Math.max(0, x / .15), 2) * Math.max(0, y / .114 + .2)]), r: .016, dy: .004 },
  aviateur: { pts: () => superellipse(.148, .118, 2.3, 44, (x, y, t) => [x - .035 * Math.max(0, -Math.sin(t)) * (1 - x / .148) * .6, y > 0 ? y * .82 + .012 : y * 1.12]), r: .0085, dy: .006 },
  sans_monture: { pts: () => superellipse(.142, .11, 3.6), r: .0045, dy: 0 },
};
function texEcaille() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'), r = rng(31);
  x.fillStyle = '#8A5530'; x.fillRect(0, 0, 256, 32);
  for (let i = 0; i < 60; i++) { x.fillStyle = r() < .5 ? 'rgba(52,28,16,.75)' : 'rgba(214,150,80,.7)'; x.beginPath(); x.ellipse(r() * 256, r() * 32, 4 + r() * 10, 3 + r() * 6, r() * 3, 0, Math.PI * 2); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
}
function texReflet() { // verre : léger voile + une bande de reflet qu'on fait glisser (uv.x)
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(.42, 'rgba(255,255,255,.1)'); g.addColorStop(.47, 'rgba(255,255,255,.75)'); g.addColorStop(.53, 'rgba(255,255,255,.75)'); g.addColorStop(.56, 'rgba(255,255,255,.12)'); g.addColorStop(.62, 'rgba(255,255,255,.45)'); g.addColorStop(.65, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,.08)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.ClampToEdgeWrapping; return t;
}
function texFoulard(col) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = col; x.fillRect(0, 0, 256, 128); x.fillStyle = 'rgba(255,248,235,.55)';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(i * 16 + (j % 2) * 8 + 4, j * 16 + 8, 2.6, 0, Math.PI * 2); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); return t;
}

/* =====================================================================================================================
   creerPieces(kit) : toutes les pièces, posées sur le corps. set(fiche) les construit (à la demande, une par famille),
   update(P, revelation) les anime. Rien n'est chargé tant que la famille est vide.
   ===================================================================================================================== */
export function creerPieces(kit) {
  const { toon, ol, body } = kit;
  const tete = new THREE.Group(); tete.position.set(0, BY + .85, 0); body.add(tete); // pivot de la tête : suit fx / fy du visage
  const T0 = new THREE.Group(); T0.position.set(0, -.85, 0); tete.add(T0);         // repère « tour »
  const peintre = creerPeintre();
  const matCh = matiereCheveux(kit), matBarbe = matiereCheveux(kit);
  let fiche = null, sh = null, cleCh = '', cleLu = '', cleCo = '', cleBo = '', cleBa = '';
  const G = {}; // pièces courantes
  const tri = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
  function vider(nom) { const p = G[nom]; if (!p) return; T0.remove(p.obj); p.obj.traverse(o => { if (o.isMesh && o.geometry && !o.userData.partage) o.geometry.dispose(); }); delete G[nom]; }

  /* ----- cheveux ----- */
  function construireCheveux() {
    vider('cheveux'); if (!sh) return;
    const co = sh.co, extra = co === 'tresses' ? 700 : co === 'queue_de_cheval' ? 420 : co === 'chignon' ? 640 : co === 'locks' ? 1180 : 0;
    // budget : ≤ 2 000 triangles pour la pièce entière (calotte + ce qui pend)
    let NU = 48, NV = 16; while (NU * NV * 2 + extra > 2000) { if (NU > 32) NU -= 4; else NV -= 1; }
    if (sh.ras) { NU = 32; NV = 10; }
    const obj = new THREE.Group(), cal = grille(NU, NV), m = new THREE.Mesh(cal, matCh); obj.add(m); ol(m, .8);
    const p = { obj, cal, mesh: m, extra: null };
    if (co === 'queue_de_cheval') {
      const g = tubes([{ segs: 16 }, { segs: 3 }], 8), mq = new THREE.Mesh(g, matCh); obj.add(mq); ol(mq, .8); p.extra = { k: 'queue', g };
    } else if (co === 'tresses') {
      const g = tubes([{ segs: 26 }, { segs: 26 }], 6), mt = new THREE.Mesh(g, matCh); obj.add(mt); ol(mt, .8); p.extra = { k: 'tresses', g };
    } else if (co === 'locks') {
      const n = 14, g = tubes(Array.from({ length: n }, () => ({ segs: 7 })), 6), ml = new THREE.Mesh(g, matCh); obj.add(ml); ol(ml, .8); p.extra = { k: 'locks', g, n };
    } else if (co === 'chignon') {
      const gs = new THREE.SphereGeometry(.15, 18, 12), pos = gs.attributes.position, a = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), th = Math.atan2(z, x), ph = Math.acos(clamp(y / .15, -1, 1));
        const sw = Math.cos(th * 3 + ph * 5) * (sh.tx.bump ? Math.cos(ph * 14 + th * 6) : 1); const s = 1 + .07 * sw; pos.setXYZ(i, x * s, y * s * .92, z * s); a[i * 4] = .5 + .5 * sw; }
      gs.setAttribute('aHair', new THREE.BufferAttribute(a, 4)); gs.computeVertexNormals();
      const mb = new THREE.Mesh(gs, matCh); obj.add(mb); ol(mb, .8);
      const tg = new THREE.TorusGeometry(.105, .022, 6, 20), ta = new Float32Array(tg.attributes.position.count * 4).fill(0); for (let i = 0; i < tg.attributes.position.count; i++) ta[i * 4 + 3] = 2;
      tg.setAttribute('aHair', new THREE.BufferAttribute(ta, 4)); const mt = new THREE.Mesh(tg, matCh); obj.add(mt); ol(mt, .7);
      const yb = 1.255, sb = surface(0, yb), zb = -Math.sqrt(Math.max(0, rAtY(yb) ** 2)) - .06 - .55 * sh.T * sh.vol;
      mb.position.set(0, yb + .02, zb - .07); mt.position.set(0, yb + .005, zb + .02); mt.rotation.x = -.5; p.extra = { k: 'chignon', mb, mt };
    }
    T0.add(obj); G.cheveux = p;
  }
  function majCheveux(P, rv) {
    const p = G.cheveux; if (!p) return;
    const g = rv.cheveux ?? 1; p.obj.visible = g > .003 && fiche.couvre_chef !== 'foulard';
    if (!p.obj.visible) return;
    const sx = (P.chZ || 0) * .55, sz = -(P.chX || 0) * .45;
    remplirCalotte(p.cal, sh, { g, sx, sz });
    const e = p.extra; if (!e) return;
    const gE = sstep(.45, 1, g); // ce qui pend arrive après la calotte
    const Tt = sh.T * sh.vol;
    if (e.k === 'queue') {
      const L = { mi_longs: .52, longs: .78, tres_longs: 1.02 }[sh.c.longueur] || .5;
      const r0 = rAtY(1.12), root = [0, 1.12, -r0 - Tt - .01], tipY = 1.12 - L * gE;
      const c = u => { const q = bez2(root, [.3, 1.24, root[2] - .34], [.6, tipY, root[2] + .2], u); const w = u * u; q[0] += sx * 1.5 * w; q[2] += sz * 1.5 * w; return q; };
      const s0 = e.g.userData.specs[0], s1 = e.g.userData.specs[1];
      remplirTube(e.g, s0, c, u => Math.max(.004, .085 * gE * (u < .12 ? .7 + 2.5 * u : 1 - .62 * Math.pow((u - .12) / .88, 1.4)) * (u > .93 ? Math.sqrt(Math.max(0, 1 - ((u - .93) / .07) ** 2)) : 1)),
        (u, θ) => [.5 + .5 * Math.cos(θ * 3 + u * 5 + (sh.tx.wf ? Math.sin(u * 14) * 1.5 : 0)), 0, 1 + (sh.tx.bump ? .1 * Math.cos(u * 30 + θ * 2) : sh.tx.wf ? .06 * Math.sin(u * 16) : 0)]);
      remplirTube(e.g, s1, u => [0, 1.12 + .005, root[2] - .03 + u * .1], () => .062 * gE + .001, () => [0, 1]);
    } else if (e.k === 'tresses') {
      const L = { mi_longs: .55, longs: .75, tres_longs: .92 }[sh.c.longueur] || .55;
      e.g.userData.specs.forEach((s, bi) => {
        const sg = bi ? 1 : -1, φ = sg * 1.74, rr = rAtY(.98) + Tt * .8 + .035, root = [Math.sin(φ) * rr, .98, Math.cos(φ) * rr];
        const out = [Math.sin(φ) * .07, 0, Math.cos(φ) * .07];
        const c = u => { const q = [root[0] + out[0] * Math.sin(u * 2), .98 - L * gE * u, root[2] + out[2] * Math.sin(u * 2)]; const w = u * u; q[0] += sx * 1.4 * w; q[2] += sz * 1.4 * w; return q; };
        const nL = 9;
        remplirTube(e.g, s, c, u => Math.max(.004, .052 * gE * (u < .86 ? .74 + .26 * Math.abs(Math.sin(Math.PI * u / .86 * nL)) : u < .9 ? .6 : .75 * (1 - Math.pow((u - .9) / .1, 2)))),
          (u, θ) => { const lobe = Math.floor(u / .86 * nL * 2); return [u > .86 && u < .9 ? 0 : .5 + .5 * Math.cos(θ * 2 + lobe * Math.PI * .5), u > .855 && u < .905, 1]; });
      });
    } else if (e.k === 'locks') {
      const L = { courts: .26, mi_longs: .46, longs: .7, tres_longs: .92 }[sh.c.longueur] || .3;
      e.g.userData.specs.forEach((s, li) => {
        const row = li % 2, q = Math.floor(li / 2), sg = q % 2 ? 1 : -1, qq = Math.floor(q / 2);
        const φ = sg * (1.02 + qq * .36 + row * .18), y0 = (row ? .97 : 1.04) + .01 * hash(li), rr = rAtY(y0) + Tt + .015;
        const root = [Math.sin(φ) * rr, y0, Math.cos(φ) * rr], Ll = L * (.85 + .3 * hash(li + 3)) * gE;
        const c = u => { const fl = .05 + .1 * u; const q = [Math.sin(φ) * (rr + fl * u), y0 - Ll * u, Math.cos(φ) * (rr + fl * u)]; const w = u * u; q[0] += sx * 1.3 * w; q[2] += sz * 1.3 * w; return q; };
        remplirTube(e.g, s, c, u => Math.max(.004, .034 * gE * (u > .85 ? Math.sqrt(Math.max(0, 1 - ((u - .85) / .15) ** 2)) : 1) * (1 + .12 * Math.sin(u * 25 + li))), (u, θ) => [.5 + .5 * Math.cos(θ * 2 + u * 9), 0, 1]);
      });
    } else if (e.k === 'chignon') {
      const s = pop(clamp(gE * 1.05)); e.mb.scale.setScalar(Math.max(.01, s)); e.mt.scale.setScalar(Math.max(.01, s));
      e.mb.visible = e.mt.visible = !['bonnet', 'chapeau', 'casquette', 'foulard'].includes(fiche.couvre_chef);
      return;
    }
    if (e.g) { e.g.attributes.position.needsUpdate = true; e.g.attributes.aHair.needsUpdate = true; e.g.computeVertexNormals(); e.g.computeBoundingSphere(); }
  }

  /* ----- lunettes ----- */
  const matVerre = new THREE.MeshBasicMaterial({ map: texReflet(), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  let ecaille = null;
  function construireLunettes() {
    vider('lunettes'); if (!fiche || fiche.lunettes.type === 'aucune') return;
    const ty = fiche.lunettes.type, M = MONTURES[ty], col = fiche.lunettes.couleur || 'noir';
    const gap = .052, ey = .9 + M.dy;
    const sur = (x, y, o = gap) => new THREE.Vector3(...surface(x, y, o).p);
    let mat;
    if (col === 'ecaille') { ecaille = ecaille || texEcaille(); mat = toon('#ffffff', { map: ecaille }); }
    else mat = toon(PAL_MONTURE[col][0], col === 'transparent' ? { transparent: true, opacity: .8 } : {});
    const obj = new THREE.Group(), drop = new THREE.Group(); obj.add(drop);
    const R = M.r;
    for (const s of [-1, 1]) {
      const pts = M.pts().map(([x, y]) => sur(s * (.2 + x), ey + y));
      if (s < 0) pts.reverse();
      const ring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 44, R, 6, true), mat); drop.add(ring); ol(ring, .55);
      // verre : un disque à la forme de la monture, légèrement en retrait
      const sh2 = M.pts(), cx = s * .2, verts = [cx, ey], uv = [.5, .5];
      for (const [x, y] of sh2) { verts.push(s * (.2 + x), ey + y); uv.push(.5 + x / .32, .5 + y / .3); }
      const pos = [], uvs = [], idx = [];
      for (let i = 0; i < verts.length / 2; i++) { const v = sur(verts[i * 2], verts[i * 2 + 1], gap - .003); pos.push(v.x, v.y, v.z); uvs.push(uv[i * 2], uv[i * 2 + 1]); }
      const n = sh2.length; for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + (i + 1) % n);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); lg.setIndex(idx);
      const lens = new THREE.Mesh(lg, matVerre); lens.renderOrder = 4; drop.add(lens);
      // branche : du bord extérieur vers la tempe, en suivant la tête
      const ex = .2 + Math.max(...sh2.map(p => p[0])) - .004, bp = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8, φ = lerp(Math.asin(clamp(ex / rAtY(ey + .02), -1, 1)), 1.5, u), y = ey + .02 + .015 * u, r = rAtY(y) + lerp(gap, .018, u);
        bp.push(new THREE.Vector3(s * Math.sin(φ) * r, y, Math.cos(φ) * r)); }
      const br = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 10, R * .7 + .002, 5), mat); drop.add(br); ol(br, .5);
    }
    // pont
    const top = Math.max(...M.pts().map(p => p[1])) * .55, ix = .2 + Math.min(...M.pts().map(p => p[0])) + .006;
    const bpts = [sur(-ix, ey + top), sur(-.035, ey + top + .02, gap + .01), sur(.035, ey + top + .02, gap + .01), sur(ix, ey + top)];
    const pont = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bpts), 12, R * .85 + .002, 5), mat); drop.add(pont); ol(pont, .5);
    if (ty === 'aviateur') { const tp = [sur(-ix + .01, ey + .085), sur(0, ey + .095, gap + .012), sur(ix - .01, ey + .085)]; const t2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 10, R * .8, 5), mat); drop.add(t2); ol(t2, .5); }
    T0.add(obj); G.lunettes = { obj, drop, mat };
  }
  function majLunettes(P, rv) {
    const p = G.lunettes; if (!p) return;
    const a = rv.lunettes ?? 1; p.obj.visible = a > .001; if (!p.obj.visible) return;
    // apparition : descend de 0,55 avec la courbe « rebond », petit balancement, puis le reflet balaie le verre
    const e = pop(clamp(a)), fall = (1 - e) * .55;
    p.drop.position.set(0, fall, (1 - e) * .08); p.drop.rotation.z = (1 - e) * .25 * Math.sin(a * 9);
    matVerre.map.offset.x = lerp(.55, -.6, clamp((rv.reflet ?? 1)));
    matVerre.opacity = Math.min(1, a * 2);
  }

  /* ----- boucles d'oreilles (et l'oreille est un point, Pilou n'a pas d'oreilles) ----- */
  const matBijou = toon(PAL_DIVERS.bijou, { emissive: new THREE.Color('#7A5A10'), emissiveIntensity: .25 });
  const OREILLE = .83, PHI_O = 1.42;
  function construireBoucles() {
    vider('boucles'); if (!fiche || fiche.oreilles.boucles === 'aucune') return;
    const ty = fiche.oreilles.boucles, obj = new THREE.Group(), side = [];
    for (const s of [-1, 1]) {
      const r = rAtY(OREILLE), x = s * Math.sin(PHI_O) * r, z = Math.cos(PHI_O) * r;
      const piv = new THREE.Group(); piv.position.set(x, OREILLE, z); piv.rotation.y = s * PHI_O; obj.add(piv);
      const g = new THREE.Group(); piv.add(g);
      if (ty === 'puces') { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.03, 1), matBijou); m.position.z = .018; g.add(m); ol(m, .5); }
      else if (ty === 'anneaux') { const m = new THREE.Mesh(new THREE.TorusGeometry(.05, .009, 6, 24), matBijou); m.position.set(0, -.045, .022); m.rotation.y = Math.PI / 2; g.add(m); ol(m, .45); }
      else { const c = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .06, 5), matBijou); c.position.set(0, -.03, .018); g.add(c);
        const d = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), toon('#7FD0F0', { emissive: new THREE.Color('#2A7090'), emissiveIntensity: .3 })); d.scale.set(1, 1.35, 1); d.position.set(0, -.085, .018); g.add(d); ol(d, .5);
        const k = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), matBijou); k.position.set(0, 0, .016); g.add(k); }
      side.push({ piv, g, s });
    }
    T0.add(obj); G.boucles = { obj, side, ty };
  }
  function majBoucles(P, rv) {
    const p = G.boucles; if (!p) return;
    const a = rv.boucles ?? 1; p.obj.visible = a > .001 && fiche.couvre_chef !== 'foulard'; if (!p.obj.visible) return;
    const sc = pop(clamp(a)) * (1 + .35 * Math.sin(Math.PI * clamp(a)) * (a < 1 ? 1 : 0));
    for (const q of p.side) { q.g.scale.setScalar(Math.max(.01, sc)); q.g.rotation.z = p.ty === 'puces' ? 0 : (P.pend || 0) * .9 * q.s + (P.chZ || 0) * .2; q.g.rotation.x = p.ty === 'puces' ? 0 : -(P.chX || 0) * .5; }
  }

  /* ----- barbe longue (volume) ----- */
  function construireBarbe() {
    vider('barbe'); if (!fiche || fiche.barbe.type !== 'longue') return;
    const g = grille(16, 12), m = new THREE.Mesh(g, matBarbe); ol(m, .7); g.userData.ouvert = true;
    T0.add(m); G.barbe = { obj: m, g };
  }
  function majBarbe(P, rv) {
    const p = G.barbe; if (!p) return;
    const a = rv.barbe ?? 1; p.obj.visible = a > .01; if (!p.obj.visible) return;
    const { NU, NV } = p.g.userData, Pz = p.g.attributes.position.array, A = p.g.attributes.aHair.array;
    const drop = Math.max(0, (P.f.mL || .03) - .03) * 1.3, yTop = .655 - drop, L = .21 * E1(a);
    for (let i = 0; i < NU; i++) {
      const u = (i / (NU - 1)) * 2 - 1; // −1 … 1 sur la largeur
      for (let j = 0; j <= NV; j++) {
        const v = j / NV, w = lerp(.36, .17, Math.pow(v, 1.6)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, v - .7) / .3, 2) * .6)), x = u * w;
        const y = lerp(yTop + .1 * u * u, yTop - L * (1 - .35 * u * u), v);
        const S = surface(x + (P.chZ || 0) * .08 * v * v, y, 0), th = .07 * Math.pow(Math.max(0, 1 - u * u), .5) * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.12 + .02)), .55) * a;
        const wv = (.012 * Math.cos(u * 11) * Math.cos(v * 14) + .006 * Math.cos(u * 23 + v * 5)) * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 1.1));
        const k = i * (NV + 1) + j;
        Pz[k * 3] = S.p[0] + S.n[0] * (th + wv + .006); Pz[k * 3 + 1] = S.p[1] + S.n[1] * (th + wv + .006); Pz[k * 3 + 2] = S.p[2] + S.n[2] * (th + wv + .006) + .004;
        A[k * 4] = .55 + .45 * Math.cos(u * 11) * Math.cos(v * 14); A[k * 4 + 1] = 0; A[k * 4 + 2] = 0; A[k * 4 + 3] = 0;
      }
    }
    p.g.attributes.position.needsUpdate = true; p.g.attributes.aHair.needsUpdate = true; p.g.computeVertexNormals(); p.g.computeBoundingSphere();
  }
  const E1 = x => 1 - Math.pow(1 - clamp(x), 3);

  /* ----- couvre-chefs (choisis seulement à la main) : percés pour l'antenne ----- */
  // coque : du sommet (trou de l'antenne) jusqu'à fnY(φ) ; fnOff(φ, v, l) épaisseur ; fnR(φ, v) relief (ridge)
  function coque(NU, NV, fnY, fnOff, fnR = () => 1) {
    const g = grille(NU, NV), P = g.attributes.position.array, A = g.attributes.aHair.array, UV = g.attributes.uv.array;
    for (let i = 0; i < NU; i++) { let φ = 2 * Math.PI * i / NU; if (φ > Math.PI) φ -= 2 * Math.PI;
      const L = lDeY(fnY(φ));
      for (let j = 0; j <= NV; j++) { const l = L * j / NV; crane(l, _o); const r0 = _o[0], y0 = _o[1], nr = _o[2], ny = _o[3]; const off = fnOff(φ, j / NV, l, y0); const k = i * (NV + 1) + j;
        P[k * 3] = (r0 + nr * off) * Math.sin(φ); P[k * 3 + 1] = y0 + ny * off; P[k * 3 + 2] = (r0 + nr * off) * Math.cos(φ);
        A[k * 4] = fnR(φ, j / NV); UV[k * 2] = i / NU; UV[k * 2 + 1] = l; } }
    g.computeVertexNormals(); return g;
  }
  // anneau fermé autour de la tête : profil [[y, épaisseur], …] parcouru en boucle (section pleine)
  function anneau(NU, prof, fnR = () => 1, yOf = () => 0) {
    const g = new THREE.BufferGeometry(), pos = [], aa = [], idx = [], n = prof.length;
    for (let i = 0; i <= NU; i++) { const φ = 2 * Math.PI * i / NU;
      for (const [y, off] of prof) { const yy = y + yOf(φ), r = rAtY(yy) + off; pos.push(Math.sin(φ) * r, yy, Math.cos(φ) * r); aa.push(fnR(φ), 0, 0, 0); } }
    for (let i = 0; i < NU; i++) for (let q = 0; q < n; q++) { const a = i * n + q, b = (i + 1) * n + q, c = i * n + (q + 1) % n, d = (i + 1) * n + (q + 1) % n; idx.push(a, c, b, c, d, b); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHair', new THREE.Float32BufferAttribute(aa, 4)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  const withA = (geo, r = 1) => { const n = geo.attributes.position.count, a = new Float32Array(n * 4); for (let i = 0; i < n; i++) a[i * 4] = r; geo.setAttribute('aHair', new THREE.BufferAttribute(a, 4)); return geo; };
  function matCouvre(col, tex) {
    if (tex) return toon('#ffffff', { map: tex });
    const m = matiereCheveux(kit); m.side = THREE.FrontSide;
    couleurMatiere(m, { base: col, ombre: mixHex(col, '#4A2A20', .28), reflet: mixHex(col, '#FFFFFF', .35), meche: col }); return m;
  }
  function construireCouvre() {
    vider('couvre'); if (!fiche || fiche.couvre_chef === 'aucun') return;
    const ty = fiche.couvre_chef, col = PAL_COUVRE[ty], env = Math.max(.02, enveloppeCheveux(sh)), obj = new THREE.Group(), drop = new THREE.Group(); obj.add(drop);
    const add = (geo, mat, w = .8) => { const m = new THREE.Mesh(geo, mat); drop.add(m); ol(m, w); return m; };
    if (ty === 'bonnet') { // bonnet tricoté : côtes, revers, l'antenne fait le pompon
      const mat = matCouvre(col), y0 = φ => 1.06 + .03 * Math.cos(φ);
      add(coque(40, 10, y0, (φ, v) => env + .03 + .085 * Math.pow(1 - v, 1.6) + .01 * sstep(.75, 1, v), (φ, v) => .5 + .5 * Math.cos(φ * 20)), mat);
      add(anneau(40, [[-.012, env + .022], [-.012, env + .062], [.082, env + .066], [.082, env + .03]], φ => .5 + .5 * Math.cos(φ * 20), φ => y0(φ) - .012 + .012), mat, .7);
    } else if (ty === 'casquette') {
      const mat = matCouvre(col);
      add(coque(36, 9, φ => 1.12 - .05 * sstep(1.2, 2.6, Math.abs(φ)), (φ, v) => env + .024 + .02 * Math.pow(1 - v, 2), (φ) => .75 + .25 * Math.cos(φ * 6)), mat);
      const rI = rAtY(1.12) + env + .02, vis = withA(new THREE.CylinderGeometry(rI + .24, rI + .24, .028, 28, 1, false, -.95, 1.9));
      const v = add(vis, matCouvre(mixHex(col, '#1E2A5A', .22)), .7); v.position.set(0, 1.125, .02); v.rotation.x = .2; v.scale.set(1, 1, .9);
      const bt = add(withA(new THREE.TorusGeometry(.05, .016, 6, 16)), matCouvre(mixHex(col, '#FFFFFF', .25)), .5); bt.position.set(0, H + .004 + env * .6, 0); bt.rotation.x = Math.PI / 2;
    } else if (ty === 'bandeau') {
      add(anneau(44, [[-.045, env + .004], [-.045, env + .026], [.045, env + .026], [.045, env + .004]], φ => .85 + .15 * Math.cos(φ * 3), φ => 1.15 - .025 * (1 - Math.cos(φ))), matCouvre(col), .7);
    } else if (ty === 'foulard') { // encadre le visage, couvre cheveux et oreilles, tombe dans le dos ; percé pour l'antenne
      const mat = matCouvre(col, texFoulard(col));
      add(coque(44, 14, φ => { const a = Math.abs(φ); return lerp(lerp(1.13, .63, sstep(.76, .98, a)), .48, sstep(1.5, 2.4, a)); },
        (φ, v, l, y0) => { const a = Math.abs(φ), base = .032 + env * .35; const close = v > .9 ? 1 - (v - .9) * 7 : 1;
          return (base + .02 * sstep(.75, 1, a) + .012 * Math.cos(φ * 8 + l * 3) * sstep(.25, .7, v) + .16 * Math.max(0, .88 - y0) * sstep(.9, 1.4, a)) * Math.max(.15, close); }), mat);
      // pli qui borde le visage
      const bord = []; for (let i = 0; i <= 26; i++) { const u = i / 26, φ = lerp(-1.02, 1.02, u), a = Math.abs(φ), y = lerp(1.13, .65, sstep(.76, .98, a)) + .01, r = rAtY(y) + .04 + env * .35;
        const φ2 = Math.sign(φ) * Math.min(a, .8 + .2 * sstep(.76, 1, a)); bord.push(new THREE.Vector3(Math.sin(φ2) * r, y, Math.cos(φ2) * r)); }
      add(withA(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bord), 40, .022, 6)), mat, .6);
    } else if (ty === 'chapeau') { // chapeau de paille : bord incliné vers le bas, ruban ; percé pour l'antenne
      const mat = matCouvre(col), hat = new THREE.Group(); drop.add(hat); hat.position.set(0, 1.16, 0); hat.rotation.x = -.16;
      const addH = (geo, m, w = .8) => { const o = new THREE.Mesh(geo, m); hat.add(o); ol(o, w); return o; };
      const cr = coque(36, 8, () => 1.16, (φ, v) => env + .035 + .07 * sstep(0, .6, 1 - v), (φ, v) => .7 + .3 * Math.cos(v * 30)); cr.translate(0, -1.16, 0); addH(cr, mat);
      const rI = rAtY(1.16) + env + .03, W = .2, NB = 40, pos = [], idx = [], aa = [];
      for (let i = 0; i <= NB; i++) { const φ = 2 * Math.PI * i / NB; for (const [d, h] of [[0, 0], [.5, -.012], [1, -.05], [1, -.068], [.5, -.03], [0, -.02]]) { const r = rI + W * d * (1 + .1 * Math.cos(φ)); pos.push(Math.sin(φ) * r, h - .015 * d * Math.cos(2 * φ) * 0, Math.cos(φ) * r); aa.push(.7 + .3 * Math.cos(d * 9), 0, 0, 0); } }
      for (let i = 0; i < NB; i++) for (let q = 0; q < 6; q++) { const a = i * 6 + q, b = (i + 1) * 6 + q, c = i * 6 + (q + 1) % 6, d = (i + 1) * 6 + (q + 1) % 6; idx.push(a, b, c, c, b, d); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('aHair', new THREE.Float32BufferAttribute(aa, 4)); bg.setIndex(idx); bg.computeVertexNormals();
      addH(bg, mat);
      const rb = anneau(36, [[1.165, env + .03], [1.165, env + .068], [1.222, env + .062], [1.222, env + .026]], () => 1); rb.translate(0, -1.16, 0);
      addH(rb, matCouvre('#C25B3F'), .6);
    } else if (ty === 'serre_tete') {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = lerp(-1.3, 1.3, i / 24), yy = .96 + (H - .96) * Math.pow(Math.cos(a), 1.1), zz = .06 + .06 * Math.cos(a);
        const r = rAtY(Math.min(H - .015, yy)), R = Math.sqrt(Math.max(.0004, r * r - zz * zz)) * Math.sign(a), S = new THREE.Vector3(R * Math.abs(Math.sin(a)) / Math.max(.05, Math.abs(Math.sin(a))), yy, zz);
        const n = S.clone().setY(S.y - .55).normalize(); pts.push(S.addScaledVector(n, env + .01)); }
      add(withA(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .02, 6)), matCouvre(col), .6);
    }
    T0.add(obj); G.couvre = { obj, drop };
  }
  function majCouvre(P, rv) {
    const p = G.couvre; if (!p) return;
    const a = rv.couvre ?? 1; p.obj.visible = a > .001; if (!p.obj.visible) return;
    const e = pop(clamp(a)); p.drop.position.y = (1 - e) * .5; p.drop.scale.set(1 + .06 * Math.sin(Math.PI * clamp(a * 1.4 - .4)), 1 - .05 * Math.sin(Math.PI * clamp(a * 1.4 - .4)), 1 + .06 * Math.sin(Math.PI * clamp(a * 1.4 - .4)));
  }

  /* ----- API ----- */
  const api = {
    peintre: peintre, tete, groupe: T0,
    get fiche() { return fiche; },
    set(f) {
      fiche = f ? normaliser(f).fiche : null;
      sh = fiche ? formeCheveux(fiche, fiche.couvre_chef) : null;
      const kCh = fiche ? JSON.stringify([fiche.cheveux, fiche.couvre_chef]) : '', kLu = fiche ? JSON.stringify(fiche.lunettes) : '', kCo = fiche ? fiche.couvre_chef + JSON.stringify(fiche.cheveux) : '', kBo = fiche ? fiche.oreilles.boucles : '', kBa = fiche ? fiche.barbe.type : '';
      if (kCh !== cleCh) { construireCheveux(); cleCh = kCh; }
      if (kLu !== cleLu) { construireLunettes(); cleLu = kLu; }
      if (kCo !== cleCo) { construireCouvre(); cleCo = kCo; }
      if (kBo !== cleBo) { construireBoucles(); cleBo = kBo; }
      if (kBa !== cleBa) { construireBarbe(); cleBa = kBa; }
      if (fiche) { const ch = couleursCheveux(fiche); couleurMatiere(matCh, ch); matCh.userData.u.hMecheOn.value = fiche.cheveux.meches === 'aucune' ? 0 : 1; couleurMatiere(matBarbe, couleursBarbe(fiche));
        const tx = fiche.cheveux.texture, F = { raides: [44, 0, 0, 1], ondules: [36, 9, 1.1, 1], boucles: [26, 30, 0, 2], frises: [34, 40, 0, 2], crepus: [44, 54, 0, 2] }[tx];
        matCh.userData.u.hFin.value.set(...F); matBarbe.userData.u.hFin.value.set(30, 0, 0, 1); }
      return api;
    },
    // couleurs en transition (Studio) : mélange de deux palettes
    couleursCheveux(a, b, p) { const A = couleursCheveux(a), B = couleursCheveux(b); couleurMatiere(matCh, { base: mixHex(A.base, B.base, p), ombre: mixHex(A.ombre, B.ombre, p), reflet: mixHex(A.reflet, B.reflet, p), meche: B.meche }); },
    couleurMonture(c) { const p = G.lunettes; if (p && !p.mat.map) p.mat.color.set(c); },
    revelation: {},
    update(P, view) {
      const rv = api.revelation || {};
      peintre.set(fiche, rv);
      if (fiche) peintre.formeYeux(P.f);
      const f = P.f || {};
      tete.rotation.y = (f.fx || 0) / .55; tete.rotation.x = -(f.fy || 0) / .55;
      if (!fiche) { for (const k in G) G[k].obj.visible = false; return; }
      majCheveux(P, rv); majLunettes(P, rv); majBoucles(P, rv); majBarbe(P, rv); majCouvre(P, rv);
    },
    stats() { const o = {}; for (const k in G) { let t = 0; G[k].obj.traverse(m => { if (m.isMesh && !m.material.isShaderMaterial) t += tri(m.geometry); }); o[k] = Math.round(t); } return o; },
  };
  return api;
}
