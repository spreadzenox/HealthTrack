/**
 * Ce que le premium apporte, affiché par le paywall (pages/Premium.jsx). Règle (VC-17, P25 option ①) : la liste
 * cochée ne contient que ce qui marche aujourd'hui ; le reste apparaît dans « détails », sous « En préparation,
 * inclus sans supplément ». Un avantage passe à `delivered: true` dans le même commit que la fonction qui le
 * réalise, et `deliveredBy` dit où elle vit (vérifié par premiumBenefits.test.js). `playLabel` est la version courte
 * (≤ 40 caractères, limite de Google) reprise dans la fiche de l'abonnement sur Play (scripts/play/subscriptions.mjs).
 */
export const PREMIUM_AI_DAILY = 10

export const PREMIUM_BENEFITS = [
  {
    id: 'ai-meals',
    label: `L’analyse IA des repas sans compter les crédits, jusqu’à ${PREMIUM_AI_DAILY} par jour`,
    playLabel: `Analyse IA des repas, ${PREMIUM_AI_DAILY} par jour`,
    delivered: true,
    // Plafond premium du relais (relay/src/config.js premiumDaily, relay/src/credits.js)
    deliveredBy: 'relay/src/credits.js',
  },
  {
    id: 'pistes-delays',
    label: 'Vos pistes personnelles, avec des délais de 2 à 48 h entre repas et ventre',
    playLabel: 'Pistes personnelles avec délais',
    delivered: true,
    // Pistes repas → ventre d'Analyses (jalon 5), floutées sans premium sur la version Play
    deliveredBy: 'app/src/components/GutLinks.jsx',
  },
  {
    id: 'fodmap',
    label: 'La réintroduction FODMAP guidée, groupe par groupe',
    playLabel: 'Réintroduction FODMAP guidée',
    delivered: true,
    // Écrans de la réintroduction (jalon 7b) au-dessus de la machine services/fodmapChallenge.js
    deliveredBy: 'app/src/pages/Reintroduction.jsx',
  },
  {
    id: 'pdf-report',
    label: 'Un rapport PDF pour votre médecin ou votre diététicienne',
    playLabel: 'Rapport PDF pour votre médecin',
    delivered: true,
    // Rapport PDF (N6b) en bas d'Analyses et dans Données
    deliveredBy: 'app/src/components/DoctorReportCard.jsx',
  },
]

export const deliveredBenefits = () => PREMIUM_BENEFITS.filter((b) => b.delivered)
export const upcomingBenefits = () => PREMIUM_BENEFITS.filter((b) => !b.delivered)
