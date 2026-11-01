/**
 * Variante de distribution de l'app, fixée au build (`VITE_DISTRIBUTION`, voir `journal/PRODUIT.md`, jalon 3).
 *
 * - `sideload` (défaut) : la version complète publiée sur GitHub Releases, avec la mise à jour en un clic.
 * - `play` : la version Google Play — pas d'auto-mise à jour (interdite par les règles Play, c'est le Store qui
 *   met à jour), pas de permission REQUEST_INSTALL_PACKAGES côté Android ; lecture du visage à l'ouverture de l'app
 *   seulement, sans service caméra en arrière-plan (journal/PLAY-CONFORMITE.md, option B).
 *
 * Toute valeur inconnue retombe sur `sideload` : c'est la version que le propriétaire installe aujourd'hui.
 */
export const DISTRIBUTIONS = ['sideload', 'play']

export function resolveDistribution(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return DISTRIBUTIONS.includes(v) ? v : 'sideload'
}

/** Fonctions qui dépendent de la variante. */
export function featuresFor(distribution) {
  const d = resolveDistribution(distribution)
  return {
    // Bandeau « Une mise à jour est disponible » + téléchargement de l'APK depuis GitHub
    selfUpdate: d === 'sideload',
    // Lecture du visage au déverrouillage, app fermée (service caméra de premier plan, BuildConfig.FACE_UNLOCK)
    faceUnlock: d === 'sideload',
    // … ou, en play, à l'ouverture de l'app (app à l'écran, indicateur visible) : l'une ou l'autre, jamais les deux
    faceAppOpen: d === 'play',
    // Analyse IA des repas par le relais Halcya (Vertex AI, UE, sans clé dans l'app) ; en sideload, la clé
    // Gemini saisie dans les Paramètres
    aiRelay: d === 'play',
    // Abonnement Google Play (droits établis par le relais, jalon 6c) ; la sideload n'a pas Play Billing et ne perd
    // aucune fonction
    billing: d === 'play',
    // Réglage « Mode diagnostic » affiché d'emblée ; en play, caché derrière 7 touches sur le numéro de version
    // (Paramètres), pour le support et les testeurs (VC-4)
    debugMenu: d === 'sideload',
    // Carte « Withings » (API Withings avec identifiant et secret de développeur à saisir) ; en play, masquée sauf
    // si elle sert déjà : Withings écrit dans Health Connect, déjà lu (VC-7). Les données importées restent.
    withingsApi: d === 'sideload',
    // Guide « Huawei / Honor » par Gadgetbridge (F-Droid, ID de compte lu dans les cookies) ; en play, le guide
    // renvoie à la connexion directe de la montre, Gadgetbridge seulement en dernier recours (VC-13)
    gadgetbridgeGuide: d === 'sideload',
    // Réglage « Cigarettes » (épingler « + 1 cigarette » sur l'Accueil) : hors parcours ventre + bien-être, masqué
    // en play sauf s'il est déjà activé ; le compteur reste là dès qu'une cigarette a été notée (VC-14)
    cigaretteSetting: d === 'sideload',
    // Nom technique du modèle d'IA (détails de la carte de résultat) : jamais dans la variante play (31/10)
    aiModelName: d === 'sideload',
  }
}

export const DISTRIBUTION = resolveDistribution(import.meta.env?.VITE_DISTRIBUTION)
export const FEATURES = featuresFor(DISTRIBUTION)

/**
 * Magasin d'applications qui vend l'abonnement (I6-RELAIS-6), fixé au build (`VITE_STORE`) : `play` (défaut, Android)
 * ou `appstore` (app iPhone, spreadzenox/HealthTrack-iOS, qui réutilise ce code). Les textes visibles prennent leur
 * nom ici au lieu de l'écrire en dur ; un achat garde le magasin d'où il vient (`source` rendu par le relais).
 */
export const STORES = ['play', 'appstore']

export function resolveStore(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return STORES.includes(v) ? v : 'play'
}

const PLAY_PACKAGE = 'fr.jpesquet.sante'

const STORE_TEXTS = {
  play: { name: 'Google Play', Name: 'Google Play', account: 'ce compte Google Play', at: 'chez Google Play' },
  appstore: { name: 'l’App Store', Name: 'L’App Store', account: 'ce compte Apple', at: 'chez Apple' },
}

/** Noms et lien de gestion d'un magasin : `name` en cours de phrase, `Name` en début, `inStore` = « dans … ». */
export function storeFor(store) {
  const id = resolveStore(store)
  const t = STORE_TEXTS[id]
  return Object.freeze({
    id,
    ...t,
    inStore: `dans ${t.name}`,
    fromStore: `auprès de ${t.name}`,
    manageUrl(productId) {
      if (id === 'appstore') return 'https://apps.apple.com/account/subscriptions'
      const base = 'https://play.google.com/store/account/subscriptions'
      return productId ? `${base}?sku=${encodeURIComponent(productId)}&package=${PLAY_PACKAGE}` : base
    },
  })
}

/** Magasin d'un achat : celui de sa source s'il en a un (`play`, `appstore`), sinon celui de cette version. */
export function storeOfPurchase(source, store = STORE) {
  return source === 'play' || source === 'appstore' ? storeFor(source) : store
}

export const STORE = storeFor(import.meta.env?.VITE_STORE)
