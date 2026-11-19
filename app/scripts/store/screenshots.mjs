// Liste des captures de la fiche Google Play, sans dépendance (lue par build-store-assets.mjs et son test).

/** Captures retenues, dans l'ordre de la fiche : [route de l'app, nom de la capture visuelle, nom du fichier,
 *  options de `npm run visual` propres à cette capture (facultatif)].
 *  Refaites le 10/11 (LISTING-CAPTURES) : celles du 03/11 précédaient l'écran Aujourd'hui, Tendances et Agir (07/11).
 *  « 07-jours » (le Journal jour par jour) retirée le 16/11 : l'écran est retiré par la refonte (étape 7b).
 *  Refaites le 19/11 (reste de REFONTE-2) : l'ordre suit la barre Accueil · Ma journée · Objectifs · Données. */
export const SCREENSHOTS = [
  ['/', 'dashboard', '01-accueil'],
  ['/ma-journee', 'ma-journee', '02-ma-journee'],
  ['/recommendations', 'recommendations', '03-objectifs'],
  ['/tendances', 'tendances', '04-tendances'],
  ['/agir', 'agir', '05-agir', ['--trial=8']],
  ['/food', 'food', '06-repas'],
  ['/reintroduction', 'reintroduction', '07-reintroduction'],
]

/** Variante play, abonnement Gold factice (aucun aperçu flouté ni « Débloquer » sur la fiche), 1080 × 1920, à 14:00
 *  quelle que soit l'heure de la génération (la nuit, l'Accueil montrerait « Pilou dort »). */
export const SCREENSHOT_ARGS = ['--play', '--subscription=gold', '--now=14:00', '--size=360x640', '--dpr=3', '--out=.visual/store']
