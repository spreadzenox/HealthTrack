/**
 * Vocabulaire interdit dans tout texte visible (app, fiche Google Play) — décisions produit du 20/10/2026,
 * journal/PRODUIT.md : « bien-être » plutôt qu'« humeur » ; jamais « 100 % privé » (l'analyse IA envoie des
 * données) ; jamais d'affirmation médicale (« diagnostiquer », « prédire une crise », « traiter »).
 * Hors des dossiers scannés par wording.test.js (sinon ces expressions se signaleraient elles-mêmes).
 */
export const FORBIDDEN_WORDING = [
  { re: /humeur/i, why: 'dire « bien-être »' },
  { re: /100\s*%\s*(privé|priv[ée]e|confidentiel|local)/i, why: '« local par défaut, IA optionnelle »' },
  // VC-22 : l'onglet s'appelle « Analyses » depuis POL-7 (un lien repéré reste une « piste » dans l'écran)
  { re: /\b[Vv]os Pistes\b|onglet « ?Pistes/, why: 'l’onglet s’appelle « Analyses »' },
  // I174 : la réintroduction dit à quelle dose un aliment passe, jamais « intolérance » ni « allergie »
  { re: /intol[ée]ran|allergi/i, why: 'parler de dose qui passe, pas d’intolérance ni d’allergie' },
  { re: /diagnostiqu|prédi(re|t|sons) (une|vos|la) crise|trait(er|ement) (votre|vos|le) (SII|syndrome|maladie)/i, why: 'jamais d’affirmation médicale' },
]

/** Retire les commentaires (blocs, JSX et lignes) en gardant les numéros de ligne. */
export function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/(^|\s)\/\/.*$/, '$1'))
}

/**
 * SLOP-1 (demande du propriétaire du 31/10/2026 vers 21:35) : formules qui « sentent l'IA ». La règle « rien n'est un
 * diagnostic » se dit une fois, là où elle sert (onboarding, historique du bien-être, conditions, rapport PDF), jamais en
 * refrain sur chaque carte. Testées sur le texte de chaque fichier, lignes jointes (une phrase JSX peut être coupée).
 */
export const SLOP_WORDING = [
  { re: /\b(une|c[’']est une|toujours une) (estimation|observation|mesure de la montre|description)s?,? (pas|jamais) (un|une)\b/i, why: 'refrain « une estimation, pas un diagnostic »' },
  { re: /\b(pas|jamais) un diagnostic\b/i, why: 'dire la règle une fois (onboarding, historique, conditions), pas en refrain' },
  { re: /en toute (sérénité|simplicité|confiance)/i, why: 'mot creux' },
  { re: /votre (fidèle )?compagnon/i, why: 'mot creux' },
  { re: /c[’']est la tendance qui parle/i, why: 'formule toute faite' },
  // SLOP-1b (01/11) : « on préfère attendre plutôt que de vous montrer de faux suspects » revenait sur 4 écrans
  { re: /préf[èé]r\w* attendre|faux suspects/i, why: 'formule toute faite : dire concrètement pourquoi il faut plus de jours' },
  // « Des liens repérés…, pas des causes » : la règle se dit une fois (« Comment c'est calculé »), pas sur chaque carte
  { re: /\b(liens?|hypothèses?)\b[^.]{0,40}, pas (des|une) causes?\b/i, why: 'refrain « pas une cause » : une fois, dans « Comment c’est calculé »' },
  // SLOP-1b-2 (01/11) : tirets cadratins entre deux mots (le tiret seul, « — », reste le signe d'une valeur absente)
  { re: /[\p{L}.)»] — [\p{L}«(]/u, why: 'tiret cadratin dans une phrase : point, deux-points ou virgule' },
  { re: /[✨🔒🎙🚀🎉💡👉]/u, why: 'emoji décoratif' },
  { re: /sans jamais (le|la|les) remplacer|c[’']est idéal/i, why: 'formule toute faite' },
  // SLOP-1c (01/11) : énumération par trois entre parenthèses (« (mise à jour, redémarrage ou économie de batterie) »)
  { re: /\([\p{L}’' -]{2,30}, [\p{L}’' -]{2,30},? (ou|et) [\p{L}’' -]{2,30}\)/u, why: 'énumération par trois : garder le cas utile' },
]

