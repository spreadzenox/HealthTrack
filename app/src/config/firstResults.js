/**
 * Calendrier unique des premiers résultats (ACC-10, décision D8 du propriétaire du 08/11) : premières pistes du
 * bien-être au jour 14, analyses de la digestion au jour 28. Lu par le moteur d'analyses (UNLOCK_DAYS), Aujourd'hui,
 * l'abonnement et l'accueil ; un test vérifie qu'aucun texte ne donne un autre délai.
 */
export const FIRST_RESULTS_DAY = Object.freeze({ wellbeing: 14, digestion: 28 })

/**
 * Premier score d'un objectif dans l'onglet Objectifs (refonte « Compagnon », brief § 3.5, étape 6a) : 7 jours notés
 * pour le bien-être, 14 pour le confort digestif. Seuls le score et sa tendance s'ouvrent à ces seuils ; les liens
 * (« ce qui l'influence ») gardent FIRST_RESULTS_DAY tant que le banc n'a pas été rejoué à 7 et 14 jours (étape 6d).
 */
export const FIRST_SCORE_DAY = Object.freeze({ wellbeing: 7, digestion: 14 })
