// Liste des captures de la fiche Google Play, sans dépendance (lue par build-store-assets.mjs et son test).

/** Captures retenues, dans l'ordre de la fiche : [route de l'app, nom de la capture visuelle, nom du fichier,
 *  options de `npm run visual` propres à cette capture (facultatif)].
 *  Refaites le 10/11 (LISTING-CAPTURES) : celles du 03/11 précédaient l'écran Aujourd'hui, Tendances et Agir (07/11). */
export const SCREENSHOTS = [
  ['/', 'dashboard', '01-aujourdhui'],
  ['/tendances', 'tendances', '02-tendances'],
  ['/recommendations', 'recommendations', '03-analyses'],
  ['/agir', 'agir', '04-agir', ['--trial=8']],
  ['/food', 'food', '05-repas'],
  ['/reintroduction', 'reintroduction', '06-reintroduction'],
  ['/journal', 'journal', '07-jours'],
]

/** Variante play, abonnement Gold factice (aucun aperçu flouté ni « Débloquer » sur la fiche), 1080 × 1920. */
export const SCREENSHOT_ARGS = ['--play', '--subscription=gold', '--size=360x640', '--dpr=3', '--out=.visual/store']
