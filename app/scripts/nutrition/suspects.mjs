/**
 * Valeurs publiées par Ciqual mais manifestement fausses (erreur d'unité probable dans la source).
 * Règle du 26/10 : on ne corrige jamais à la main ; une valeur listée ici devient inconnue (null),
 * marquée `suspect` dans `_q`. `ciqual` est la valeur publiée : si une version suivante de Ciqual la
 * corrige, le générateur garde la nouvelle et signale la ligne comme périmée (à retirer).
 * Recherche faite le 29/10 (Ciqual 2025) : chaque micronutriment comparé aux variantes du même aliment
 * (cru / cuit / couleur) et à la médiane de son sous-groupe Ciqual ; seul un écart de ×1 000 sans
 * « < x » ni explication plausible est retenu (relus et gardés : chewing-gum et calcium, foie de lapin
 * et folates, eaux minérales, valeurs « < x » du bigorneau).
 */
export const SUSPECT_VALUES = [
  {
    code: '20034',
    field: 'iron_mg',
    ciqual: 0.00019,
    reason: 'Oignon, cru : 0,00019 mg de fer pour 100 g, 1 000 fois moins que l\'oignon jaune cru (0,1), rouge cru (0,19) ' +
      'et cuit (0,21) de la même table ; sans doute des grammes saisis comme des milligrammes.',
  },
]
