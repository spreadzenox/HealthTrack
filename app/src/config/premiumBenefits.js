/**
 * Ce que le premium apporte, affiché par le paywall (pages/Premium.jsx). Règle (VC-17, P25 option ①) : la liste
 * cochée ne contient que ce qui marche aujourd'hui ; le reste apparaît dans « détails », sous « En préparation,
 * inclus sans supplément ». Un avantage passe à `delivered: true` dans le même commit que la fonction qui le
 * réalise, et `deliveredBy` dit où elle vit (vérifié par premiumBenefits.test.js).
 */
export const PREMIUM_AI_DAILY = 10

export const PREMIUM_BENEFITS = [
  {
    id: 'ai-meals',
    label: `L’analyse IA des repas sans compter les crédits, jusqu’à ${PREMIUM_AI_DAILY} par jour`,
    delivered: true,
    // Plafond premium du relais (relay/src/config.js premiumDaily, relay/src/credits.js)
    deliveredBy: 'relay/src/credits.js',
  },
  {
    id: 'pistes-delays',
    label: 'Vos pistes personnelles, avec des délais de 2 à 48 h entre repas et ventre',
    delivered: false, // jalon 5
  },
  {
    id: 'fodmap',
    label: 'La réintroduction FODMAP guidée, groupe par groupe',
    delivered: false, // jalon 7
  },
  {
    id: 'pdf-report',
    label: 'Un rapport PDF pour votre médecin ou votre diététicienne',
    delivered: false, // jalon 7
  },
]

export const deliveredBenefits = () => PREMIUM_BENEFITS.filter((b) => b.delivered)
export const upcomingBenefits = () => PREMIUM_BENEFITS.filter((b) => !b.delivered)
