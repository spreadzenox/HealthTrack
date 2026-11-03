// Liste des captures de la fiche Google Play, sans dépendance (lue par build-store-assets.mjs et son test).

/** Captures retenues, dans l'ordre de la fiche : [route de l'app, nom de la capture visuelle, nom du fichier].
 *  Refaites le 03/11 (avant les testeurs) : celles du 22/10 montraient l'ancien onglet « Pistes ». */
export const SCREENSHOTS = [
  ['/', 'dashboard', '01-aujourdhui'],
  ['/recommendations', 'recommendations', '02-analyses'],
  ['/food', 'food', '03-repas'],
  ['/bien-etre', 'bien-etre', '04-bien-etre'],
  ['/reintroduction', 'reintroduction', '05-reintroduction'],
  ['/journal', 'journal', '06-jours'],
]

/** Variante play, abonnement Gold factice (aucun aperçu flouté ni « Débloquer » sur la fiche), 1080 × 1920. */
export const SCREENSHOT_ARGS = ['--play', '--subscription=gold', '--size=360x640', '--dpr=3', '--out=.visual/store']
