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
