/**
 * Vocabulaire interdit dans tout texte visible (app, fiche Google Play) — décisions produit du 20/10/2026,
 * journal/PRODUIT.md : « bien-être » plutôt qu'« humeur » ; jamais « 100 % privé » (l'analyse IA envoie des
 * données) ; jamais d'affirmation médicale (« diagnostiquer », « prédire une crise », « traiter »).
 * Hors des dossiers scannés par wording.test.js (sinon ces expressions se signaleraient elles-mêmes).
 */
export const FORBIDDEN_WORDING = [
  { re: /humeur/i, why: 'dire « bien-être »' },
  { re: /100\s*%\s*(privé|priv[ée]e|confidentiel|local)/i, why: '« local par défaut, IA optionnelle »' },
  { re: /diagnostiqu|prédi(re|t|sons) (une|vos|la) crise|trait(er|ement) (votre|vos|le) (SII|syndrome|maladie)/i, why: 'jamais d’affirmation médicale' },
]
