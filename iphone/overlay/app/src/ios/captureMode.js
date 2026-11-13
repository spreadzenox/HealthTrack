/**
 * Mode « captures » de la version iOS (dépôt HealthTrack-iOS), compilé seulement quand VITE_IOS_CAPTURE=1 : la build
 * simulateur du workflow ios-build, jamais une build envoyée aux utilisateurs.
 *
 * L'app parcourt elle-même un plan de pages (le simulateur affiche « Ouvrir dans Halcya ? » pour tout lien externe,
 * donc on ne la pilote pas de l'extérieur). À chaque page, elle attend que l'écran se pose, écrit le nom de la page
 * dans Documents/capture/ready.txt (la console relayée arrive par paquets : trop tard pour synchroniser), attend que
 * scripts/ios-captures.sh, qui lit ce fichier dans le conteneur de l'app sur le Mac, ait capturé l'écran et répondu
 * dans Documents/capture/ack.txt, puis prépare l'étape suivante et recharge sur sa page. Comme `npm run visual` d'Android : données
 * de démo (scripts/visual/demoData.mjs) ajoutées une seule fois, onboarding noté fait, nouveautés notées vues.
 */
export const STEP_KEY = 'halcya_ios_capture_step'
const SEEDED_KEY = 'halcya_ios_capture_seeded'

// Les mêmes pages que `npm run visual` d'Android (scripts/visual/visual-check.mjs, DEFAULT_ROUTES), sauf /bienvenue et
// /montre (montre Huawei en direct : aucun lien vers cette page sur iPhone)
export const ROUTES = ['/', '/journal', '/tendances', '/food', '/nutrition', '/data', '/connectors', '/recommendations',
  '/recommendations/ventre', '/agir', '/settings', '/plus', '/nouveautes', '/premium', '/bien-etre', '/reintroduction', '/licences']
export const DARK_ROUTES = ['/', '/journal', '/recommendations']
// États vides : onboarding fini, base vide (installation neuve sans source branchée ; `npm run visual -- --empty`
// d'Android), pour voir sur iPhone ce que chaque page dit avant la première donnée
export const EMPTY_ROUTES = ['/', '/journal', '/tendances', '/food', '/nutrition', '/recommendations', '/bien-etre',
  '/connectors']
// Pages longues : écrans suivants, défilés d'environ 80 % de l'écran chacun (`-2`, `-3`…)
// (I6) Écran d'abonnement défilé : formules, prix, bouton, renouvellement et liens, sous le pli (capture pour Apple)
export const SCROLLS = { '/connectors': 2, '/data': 1, '/settings': 1, '/premium': 1 }
// États vides défilés de même : Sources vierge, pour la carte du temps d'écran sous le pli (« Activer »)
export const EMPTY_SCROLLS = { '/connectors': 1 }
// Volets repliés à ouvrir puis capturer : bouton touché (`click`, texte exact), `<details>` ouvert (`open`, id),
// élément amené en haut de l'écran (`target`, id)
export const REVEALS = {
  '/connectors': [{ name: 'guides', click: 'Ajouter une source', open: 'guide-garmin', target: 'watch-guides-title' }],
}

// Données de démo d'Android ramenées à ce que l'iPhone reçoit aujourd'hui (captures et fiche App Store fidèles) :
// ni montre Huawei en direct, ni temps d'écran (I8), ni lecture du visage (I7) ; la montre écrit dans Santé, qui
// donne une VFC en SDNN (rangée à part, `heartRateVariabilitySdnn`), pas la RMSSD d'Android.
const NOT_ON_IPHONE = new Set(['huawei_watch', 'phone', 'face_sense'])

// Pas de connexion Withings directe sur iPhone : la balance écrit dans l'app Santé, que Halcya lit comme le reste
// (connecteur `health_connect`) : le poids, et la masse grasse seule (pas la masse musculaire)
const FROM_HEALTH_APP = {
  weight: (p) => ({ valueKg: p.valueKg }),
  body_composition: (p) => ({ fatRatioPct: p.fatRatioPct }),
}

export function iphoneDemoEntries(entries) {
  return entries
    .filter((e) => !NOT_ON_IPHONE.has(e.source))
    .map((e) => {
      if (e.source === 'withings' && FROM_HEALTH_APP[e.type]) {
        return { ...e, source: 'health_connect', payload: FROM_HEALTH_APP[e.type](e.payload || {}) }
      }
      if (e.payload?.sourceName !== 'Gadgetbridge') return e
      const payload = { ...e.payload, sourceName: 'Apple Watch' }
      if (payload.subtype === 'heartRateVariability') payload.subtype = 'heartRateVariabilitySdnn'
      return { ...e, payload }
    })
}

// « /recommendations/ventre » → « recommendations-ventre » (nom de fichier plat, comme `npm run visual` d'Android)
const pageName = (route) => route.replace(/^\//, '').replaceAll('/', '-') || 'accueil'

// Audit des textes (I2) : mots qui n'ont pas cours sur iPhone. Pas Huawei, Withings, Garmin… : leurs apps écrivent
// dans l'app Santé de l'iPhone, les nommer y est juste.
const ANDROID_ONLY = /Health Connect|Google Play|Play Store|Android|Gadgetbridge|Samsung Health/g

/** Mots propres à Android trouvés dans un texte de page, chacun une fois, dans l'ordre. */
export function androidWords(text) {
  return [...new Set(String(text).match(ANDROID_ONLY) ?? [])]
}

// Passages où les nommer serait juste sur iPhone (sélecteurs CSS). Vide depuis le 31/10 : le temps d'écran existe aussi
// sur iPhone (I8), sa carte est relue comme le reste
export const IPHONE_OK = []

/** Texte d'une page, sans ces passages (`innerText` dans la WebView, `textContent` sous jsdom). */
export function pageText(root, allowed = IPHONE_OK) {
  const text = (el) => el.innerText ?? el.textContent ?? ''
  return allowed.flatMap((sel) => [...root.querySelectorAll(sel)]).reduce((t, el) => t.replace(text(el), ''), text(root))
}

// Autres écrans de l'onboarding sur iPhone : nouvel accueil d'Android (ACC-1 à ACC-10, décision du propriétaire du
// 08/11) ; `lastScreen` le rouvre sur l'écran voulu (FLOW_VERSION 2, sinon il repart du tuto)
export const MORE_ONBOARDING = [
  ['objectifs', { flow: 2, lastScreen: 'goal' }],
  ['sources', { flow: 2, lastScreen: 'sources' }],
  ['trouve', { flow: 2, lastScreen: 'found' }],
  ['visage', { flow: 2, lastScreen: 'face', goals: ['gut'] }],
  ['premiere-note', { flow: 2, lastScreen: 'first', goals: ['gut'] }],
]

export function buildPlan(routes = ROUTES, darkRoutes = DARK_ROUTES, scrolls = SCROLLS, reveals = REVEALS, moreOnboarding = [],
  emptyRoutes = [], emptyScrolls = {}) {
  const light = (route) => {
    const base = { name: `demo-clair-${pageName(route)}`, route, data: 'demo', theme: 'light' }
    const more = Array.from({ length: scrolls[route] || 0 }, (_, k) => ({ ...base, name: `${base.name}-${k + 2}`, scroll: k + 1 }))
    const opened = (reveals[route] || []).map((reveal) => ({ ...base, name: `${base.name}-${reveal.name}`, reveal }))
    return [base, ...more, ...opened]
  }
  return [
    { name: 'vierge-onboarding', route: null, data: null, theme: null },
    // 2e carte du tuto du nouvel accueil, avant que les données de démo ne le marquent fait
    { name: 'vierge-onboarding-tuto-2', route: '/bienvenue', data: null, theme: null, onboarding: { flow: 2, step: 0, card: 1 } },
    ...moreOnboarding.map(([name, onboarding]) => ({ name: `vierge-onboarding-${name}`, route: '/bienvenue', data: null, theme: null, onboarding })),
    ...emptyRoutes.flatMap((route) => {
      const base = { name: `vide-${pageName(route)}`, route, data: 'empty', theme: 'light' }
      return [base, ...Array.from({ length: emptyScrolls[route] || 0 }, (_, k) => ({ ...base, name: `${base.name}-${k + 2}`, scroll: k + 1 }))]
    }),
    ...routes.flatMap(light),
    ...darkRoutes.map((route) => ({ name: `demo-sombre-${pageName(route)}`, route, data: 'demo', theme: 'dark' })),
  ]
}

// Taille du texte d'iOS agrandie (3e passage de scripts/ios-captures.sh, `simctl ui content_size`) : le natif agrandit
// la police de <html> avant le premier rendu (TextSize.swift) ; l'accueil vierge puis quelques pages de démo, sans sondes
export const LARGE_TEXT_ROUTES = ['/', '/journal', '/tendances', '/recommendations', '/agir', '/connectors', '/settings']

export function textSizeAdjusted(doc = document) {
  const style = doc?.documentElement?.style
  const percent = parseFloat(style?.getPropertyValue?.('font-size'))
  return Number.isFinite(percent) && percent > 100
}

export function largeTextPlan(routes = LARGE_TEXT_ROUTES) {
  return [
    { name: 'vierge-onboarding', route: null, data: null, theme: null },
    ...routes.map((route) => ({ name: `demo-clair-${pageName(route)}`, route, data: 'demo', theme: 'light' })),
  ]
}

async function prepare(step, { storage, demoEntries, latestChangelogId, localStorage }) {
  if (step.onboarding) localStorage.setItem('healthtrack_onboarding', JSON.stringify(step.onboarding))
  // Comme au sortir de l'onboarding : fait, Nouveautés vues
  const onboarded = () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'capture', goal: null }))
    if (latestChangelogId) localStorage.setItem('healthtrack-whats-new-last-seen', latestChangelogId)
  }
  if (step.data === 'empty') onboarded()
  if (step.data === 'demo' && !localStorage.getItem(SEEDED_KEY)) {
    await storage.upsertEntries(demoEntries())
    localStorage.setItem(SEEDED_KEY, '1')
    onboarded()
  }
  // Lu par initTheme() au démarrage : appliqué au rechargement qui suit
  if (step.theme) localStorage.setItem('healthtrack_theme', step.theme)
}

/** Une étape par chargement de page : annonce la page courante, puis passe à la suivante. */
export async function runCaptureStep(plan, deps, { settleMs = 5000 } = {}) {
  const { localStorage, go, log, wait, signal, waitAck, scroll } = deps
  const index = Number(localStorage.getItem(STEP_KEY) ?? 0)
  const step = plan[index]
  if (!step) return
  await wait(settleMs)
  if (step.scroll) {
    scroll(step.scroll)
    await wait(800)
  }
  if (step.reveal) {
    await deps.reveal(step.reveal)
    await wait(800)
  }
  if (deps.readText) {
    const words = androidWords(deps.readText())
    if (words.length) log(`[texte] ${step.name} : ${words.join(', ')}`)
  }
  log(`[capture] page ${step.name}`)
  await signal(step.name)
  if (!(await waitAck(step.name))) log(`[capture] pas d'accusé pour ${step.name}, on continue`)
  const next = plan[index + 1]
  localStorage.setItem(STEP_KEY, String(index + 1))
  if (!next) {
    if (deps.probe) await deps.probe({ signal, waitAck, wait, log })
    log('[capture] fin')
    await signal('fin')
    return
  }
  await prepare(next, deps)
  go(next.route)
}

const READY = 'capture/ready.txt'
const ACK = 'capture/ack.txt'

/**
 * Attend que le script ait répondu `name` dans ack.txt, relu toutes les 300 ms ; 100 essais (30 s) suffisent pour
 * une capture. Rend faux si la réponse ne vient pas.
 */
export async function waitForAck({ readAck, sleep }, name, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      if (String(await readAck()).trim() === name) return true
    } catch {
      // pas encore de réponse
    }
    await sleep(300)
  }
  return false
}

/**
 * Note marquée « vue » pendant les captures, comme le fait l'onboarding : la plus récente des Nouveautés de la
 * variante (`CHANGELOG`), pas de tout l'historique : une note d'Android cachée sur iPhone n'y est pas, et l'app
 * annoncerait alors toutes les autres comme nouvelles.
 */
export function lastSeenChangelogId(changelog) {
  return changelog.CHANGELOG[0]?.id ?? null
}

/**
 * Une promesse rejetée sans traitement ne passe pas par `window.onerror` : rendue ici en erreur de la console, pour
 * qu'elle compte dans js-errors.txt, qui fait échouer la CI (un service qui retombe mal sur iPhone, étape I2).
 */
export function watchRejections(target = window, report = console.error) {
  target.addEventListener('unhandledrejection', (e) =>
    report('[capture] promesse rejetée sans traitement :', e.reason?.stack || e.reason?.message || String(e.reason)))
}

/**
 * Temps d'écran de démonstration (I8) : faux plugin `PhoneUsage`, lu par `phoneUsageSync.js` comme celui des captures
 * d'Android (`--phone`), mais en segments horaires comme l'iPhone : écran de 07:00 à 23:00, un peu plus le soir, nuit
 * calme (après quelques minutes juste après minuit), reprise vers 07:10, avec les apps de chaque heure. Accès accordé.
 */
export function fakePhoneUsage(now = new Date()) {
  const HOUR = 3600000
  const end = now.getTime()
  const segments = []
  for (let start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10).getTime(); start + HOUR <= end; start += HOUR) {
    const d = new Date(start)
    const h = d.getHours()
    const k = d.getDate() + h
    // Un peu d'écran juste après minuit : la journée en cours en a déjà quand les captures tournent tôt le matin
    if ((h >= 7 && h < 23) || h === 0) {
      const minutes = h === 7 ? 6 : h >= 21 ? 18 + (k % 4) * 4 : 8 + (k % 5) * 3
      const ms = minutes * 60000
      // Apps de l'heure (identifiants iPhone, catégorie de Temps d'écran) : moitié Instagram, quart WhatsApp et YouTube
      const apps = [
        { id: 'com.burbn.instagram', label: 'Instagram', category: 'Réseaux sociaux', ms: ms / 2 },
        { id: 'net.whatsapp.WhatsApp', label: 'WhatsApp', category: 'Réseaux sociaux', ms: ms / 4 },
        { id: 'com.google.ios.youtube', label: 'YouTube', category: 'Photo et vidéo', ms: ms / 4 },
      ]
      segments.push({ start, end: start + HOUR, activeMs: ms, pickups: 1 + (k % 4), firstPickup: start + (h === 7 ? 10 : 2) * 60000, apps })
    } else {
      segments.push({ start, end: start + HOUR, activeMs: 0, pickups: 0, apps: [] })
    }
  }
  return {
    checkAccess: async () => ({ granted: true, supported: true }),
    openAccessSettings: async () => ({ granted: true, supported: true }),
    queryUsageSegments: async ({ start = -Infinity, end: to = Infinity } = {}) => ({
      segments: segments.filter((s) => s.start >= start && s.end <= to),
    }),
  }
}

/**
 * Pages de démonstration : temps d'écran activé avec le faux plugin. Ce mode est chargé après le premier rendu : la
 * carte relit l'accès à chaque `visibilitychange`, on la relance donc.
 */
export function installPhoneUsageFake({ target = window, localStorage = window.localStorage, doc = document, now = new Date() } = {}) {
  target.__healthtrackFakePhoneUsage = fakePhoneUsage(now)
  let settings = {}
  try {
    settings = JSON.parse(localStorage.getItem('healthtrack_phone_usage') || '{}')
  } catch {
    /* réglages illisibles : remplacés */
  }
  if (!settings.enabled) localStorage.setItem('healthtrack_phone_usage', JSON.stringify({ ...settings, enabled: true }))
  doc.dispatchEvent(new Event('visibilitychange'))
}

/**
 * Abonnements de démonstration (I6) : faux plugin `AppStoreBilling` des captures, de même forme que le vrai
 * (`BillingRule.swift`) : les trois abonnements du groupe Halcya aux prix de `store/app-store/abonnements.md`, essai
 * gratuit de 2 semaines sur Silver annuel. Rien ne s'achète : `purchase` rend « annulé ».
 */
export function fakeAppStoreBilling() {
  const phase = (priceMicros, formattedPrice, billingPeriod) => ({ priceMicros, formattedPrice, billingPeriod, currency: 'EUR' })
  const products = [
    {
      productId: 'halcya_premium',
      offers: [
        { basePlanId: 'annuel', offerToken: 'halcya_premium_annuel', phases: [phase(0, '', 'P2W'), phase(29_990_000, '29,99 €', 'P1Y')] },
        { basePlanId: 'mensuel', offerToken: 'halcya_premium_mensuel', phases: [phase(4_990_000, '4,99 €', 'P1M')] },
      ],
    },
    { productId: 'halcya_gold', offers: [{ basePlanId: 'mensuel', offerToken: 'halcya_gold_mensuel', phases: [phase(9_990_000, '9,99 €', 'P1M')] }] },
  ]
  return {
    getProducts: async ({ productIds } = {}) => ({ products: products.filter((p) => !productIds || productIds.includes(p.productId)) }),
    purchase: async () => ({ status: 'cancelled' }),
    queryPurchases: async () => ({ purchases: [] }),
    addListener: async () => ({ remove: async () => {} }),
  }
}

/**
 * Écran d'abonnement des captures : faux plugin d'achat et droits « sans abonnement » rendus à la place du relais,
 * pour montrer l'écran d'achat tel qu'Apple et les abonnés le verront (pendant la période de lancement, le vrai
 * relais offre Gold et l'écran n'a rien à vendre) ; c'est aussi la capture pour l'examen des abonnements. Le mode est
 * chargé après le premier rendu : une page d'abonnement déjà affichée est remontée, sans recharger l'app.
 */
/**
 * Le faux magasin ne vaut que pour les captures de l'écran d'achat : ailleurs, l'app garde les droits du vrai relais
 * (Gold offert pendant le test), sans quoi le rapport PDF montre « Débloquer » et le geste réel de uitests/ qui
 * l'enregistre dans Fichiers ne trouve pas « Créer le PDF » (vu le 2/11, depuis #184).
 */
export const needsBillingFake = (step) => step?.route === '/premium'

export function installBillingFake({ target = window, storage = window.localStorage, location = window.location, history = window.history } = {}) {
  target.__HT_PLAY_BILLING__ = fakeAppStoreBilling()
  if (!target.__htFakeVerify && typeof target.fetch === 'function') {
    const realFetch = target.fetch.bind(target)
    target.__htFakeVerify = true
    target.fetch = (url, init) =>
      String(url?.url ?? url).includes('/v1/subscription/verify')
        ? Promise.resolve(new Response(JSON.stringify({ ok: true, premium: false, source: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        : realFetch(url, init)
  }
  try {
    storage.removeItem('halcya_entitlement')
  } catch {
    /* rien en cache */
  }
  if (location.pathname === '/premium') {
    for (const path of ['/plus', '/premium']) {
      history.pushState({}, '', path)
      target.dispatchEvent(new PopStateEvent('popstate'))
    }
  }
}

export async function installCaptureMode() {
  watchRejections()
  try {
    const [storage, demo, changelog, { Filesystem, Directory, Encoding }] = await Promise.all([
      import('../storage/localHealthStorage.js'),
      import('../../scripts/visual/demoData.mjs'),
      import('../data/changelog.js'),
      import('@capacitor/filesystem'),
    ])
    const file = { directory: Directory.Documents, encoding: Encoding.UTF8 }
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const largeText = textSizeAdjusted()
    const plan = largeText ? largeTextPlan() : buildPlan(ROUTES, DARK_ROUTES, SCROLLS, REVEALS, MORE_ONBOARDING, EMPTY_ROUTES, EMPTY_SCROLLS)
    const step = plan[Number(window.localStorage.getItem(STEP_KEY) ?? 0)]
    if (step?.data === 'demo') installPhoneUsageFake()
    if (needsBillingFake(step)) installBillingFake()
    await runCaptureStep(plan, {
      storage,
      demoEntries: () => iphoneDemoEntries(demo.generateDemoEntries()),
      latestChangelogId: lastSeenChangelogId(changelog),
      localStorage: window.localStorage,
      go: (path) => window.location.assign(path),
      scroll: (screens) => window.scrollTo({ top: screens * Math.round(window.innerHeight * 0.8), behavior: 'instant' }),
      reveal: async ({ click, open, target }) => {
        ;[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === click)?.click()
        await sleep(800) // le volet s'affiche au rendu suivant
        document.getElementById(open)?.setAttribute('open', '')
        document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'instant' })
      },
      log: (message) => console.log(message),
      readText: () => (document.body ? pageText(document.body) : ''),
      wait: sleep,
      signal: (name) => Filesystem.writeFile({ ...file, path: READY, data: name, recursive: true }),
      probe: largeText ? null : async (d) => {
        await probeHealthKit(d)
        await probeGutEvening(d)
        await probeEveningNote(d)
        await probePortionReminder({ ...d, location: window.location })
        await probeDataRoundtrip(d)
        await probeBackup(d)
        await probeVoice(d)
        await probeFace(d)
        await probeFileImport(d)
        await probeShareExport(d)
        await probeShareReport(d)
        await probeSnapshotWelcome({ ...d, localStorage: window.localStorage })
        await probeDeleteAll(d) // en dernier : vide la base
      },
      waitAck: (name, tries) =>
        waitForAck({ readAck: async () => (await Filesystem.readFile({ ...file, path: ACK })).data, sleep }, name, tries),
    })
  } catch (e) {
    console.error('[capture] échec :', e)
  }
}

/**
 * Essai HealthKit (étape I4) : disponibilité, état des autorisations, puis demande d'autorisation (lecture, et
 * écriture des pas pour l'aller-retour, phrase d'usage ajoutée à la seule build de captures) ; sa feuille est
 * capturée (« healthkit-autorisation »), puis le test d'interface du dépôt (uitests/) l'accepte avant que le script
 * réponde : jusqu'à 3 min d'attente. Acceptée, des pas et une VFC sont écrits dans Santé, relus, puis relus par le
 * connecteur de l'app (VFC rangée en SDNN), enfin synchronisés pour de bon dans la base, comme depuis Sources (les
 * pas écrits doivent y être) : preuve que l'import marche de bout en bout. Résultats dans la console
 * (`[healthkit] …`).
 */
/**
 * Fenêtre des mesures que la sonde écrit dans Santé : la dernière heure, sans remonter avant minuit. Juste après
 * minuit, une heure pleine rangerait les pas à hier, où la démo en compte déjà davantage : le Journal ne les
 * montrerait pas (CI du 31/10 à 00:20).
 */
export function healthSampleWindow(now = new Date()) {
  const end = now.getTime()
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const start = Math.min(Math.max(end - 3600 * 1000, midnight.getTime()), end - 1000)
  return { startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() }
}

export async function probeHealthKit({ signal, waitAck, wait, log, health, connector, store, navigate, readText }) {
  const say = (what, value) => log(`[healthkit] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  const failed = (what) => (e) => say(`${what} erreur`, e?.message || String(e))
  try {
    const Health = health ?? (await import('@capgo/capacitor-health')).Health
    const read = ['steps', 'sleep', 'heartRate', 'heartRateVariability'] // comme le connecteur (VFC lue en SDNN)
    await Health.isAvailable().then((r) => say('isAvailable', r), failed('isAvailable'))
    await Health.checkAuthorization({ read, write: [] }).then((r) => say('checkAuthorization', r), failed('checkAuthorization'))
    let answered = false
    Health.requestAuthorization({ read, write: ['steps', 'heartRateVariability'] }).then(
      (r) => { answered = true; say('requestAuthorization', r) },
      (e) => { answered = true; failed('requestAuthorization')(e) },
    )
    await wait(4000)
    if (!answered) say('requestAuthorization', 'feuille affichée, pas de réponse en 4 s')
    await signal('healthkit-autorisation')
    if (!(await waitAck('healthkit-autorisation', 600))) say('aller-retour', 'pas d’accusé du script en 3 min')
    for (let i = 0; i < 20 && !answered; i++) await wait(500)
    if (!answered) return say('aller-retour', 'feuille toujours ouverte : pas d’écriture ni de relecture')
    const { startDate, endDate } = healthSampleWindow()
    await Health.saveSample({ dataType: 'steps', value: 1234, startDate, endDate }).then(() => say('saveSample', 'ok'), failed('saveSample'))
    // VFC de démonstration : HealthKit la donne en SDNN, que le connecteur doit ranger à part de la RMSSD d'Android
    await Health.saveSample({ dataType: 'heartRateVariability', value: 48, startDate, endDate }).then(() => say('saveSample VFC', 'ok'), failed('saveSample VFC'))
    await Health.readSamples({ dataType: 'steps', startDate, endDate, limit: 10 }).then(
      (r) => say('readSamples', { count: r?.samples?.length ?? 0, values: (r?.samples || []).map((x) => x.value) }),
      failed('readSamples'),
    )
    // Même lecture que l'app (Sources, onboarding) : le connecteur, avec un enregistreur qui ne garde rien
    const imported = []
    const sync = connector ?? new (await import('../connectors/HealthConnectConnector.js')).HealthConnectConnector()
    await sync.sync({ since: new Date(startDate), until: new Date(), writer: async (entries) => imported.push(...entries) }).then(
      (r) => say('connecteur', {
        synced: r?.synced,
        errors: r?.errors,
        pas: imported.filter((e) => e.type === 'steps').map((e) => ({ value: e.payload?.value, source: e.payload?.sourceName })),
        vfc: imported
          .filter((e) => e.type === 'heart_rate' && /^heartRateVariability/.test(e.payload?.subtype || ''))
          .map((e) => ({ value: e.payload?.value, subtype: e.payload?.subtype })),
      }),
      failed('connecteur'),
    )
    // Puis la vraie synchronisation de l'app, rangée dans la base comme depuis Sources (autoSync)
    const db = store ?? (await import('../storage/localHealthStorage.js'))
    await sync.sync({ since: new Date(startDate), until: new Date(), writer: async (entries) => { await db.upsertEntries(entries) } }).then(
      async (r) => {
        const pas = (await db.listEntries({ limit: 5000 }))
          .filter((e) => e.type === 'steps' && e.source === 'health_connect' && e.payload?.sourceName === 'Halcya')
          .map((e) => e.payload?.value)
        say('base', { synced: r?.synced, pas })
      },
      failed('base'),
    )
    // Montrés dans le Journal (I4) : la page Jours relue (« 1 234 » pas d'aujourd'hui), puis capturée
    const go =
      navigate ??
      ((path) => {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    go('/journal')
    await wait(3000)
    say('journal', { pas: /1[\s\u202f\u00a0]?234/.test((readText ?? (() => pageText(document.body)))()) })
    await signal('healthkit-journal')
    await waitAck('healthkit-journal')
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/**
 * Essai du bilan du ventre du soir (étape I5) : autorisation des notifications (alerte acceptée par le test
 * d'interface du dépôt), puis notification d'essai (`testNotification`, build de captures seulement) à laquelle le
 * test d'interface répond « Gêne » depuis la bannière dépliée ; la réponse doit être dans la boîte du plugin,
 * sans que l'app ait été ouverte, puis entrer dans l'historique par l'import de l'app (comme à l'ouverture suivante).
 * Résultats dans la console (`[notification] …`).
 */
export async function probeGutEvening({ signal, waitAck, wait, log, plugin, importInbox }) {
  const say = (what, value) => log(`[notification] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    // Plugin enregistré par le service (correctif 63) : un second registerPlugin fait écrire « already registered »
    const GutEvening = plugin ?? (await import('../services/gutEvening')).NativeGutEvening
    let answer = null
    GutEvening.requestNotifications().then(
      (r) => { answer = r ?? {} },
      (e) => { answer = { error: e?.message || String(e) } },
    )
    await wait(2000)
    await signal('notification-autorisation')
    if (!(await waitAck('notification-autorisation', 600))) say('autorisation', 'pas d’accusé du script en 3 min')
    for (let i = 0; i < 20 && !answer; i++) await wait(500)
    say('requestNotifications', answer ?? 'pas de réponse')
    if (!answer?.notifications) return say('essai', 'notifications refusées : pas de notification d’essai')
    // Notification réelle du soir, en bannière dans 45 s : le test d'interface, lancé dès le signal (xcodebuild met
    // jusqu'à ~30 s à le démarrer), l'attend déjà ; l'appui long dans le centre de notifications ne la déplie pas
    // (essais du 28/10)
    await GutEvening.testNotification({ delay: 45, banner: true })
    await signal('notification-bilan')
    if (!(await waitAck('notification-bilan', 900))) say('bilan', 'pas d’accusé du script en 4 min 30')
    await wait(1000)
    const notes = (await GutEvening.list())?.notes || []
    const levels = notes.map((n) => {
      try {
        return JSON.parse(n.json).level
      } catch {
        return null
      }
    })
    say('boîte', { count: notes.length, levels })
    // Comme à l'ouverture suivante : l'app range les bilans de la boîte dans l'historique, la boîte se vide
    const importer = importInbox ?? (await import('../services/gutEvening')).importPendingGutEvenings
    const result = await importer({ plugin: GutEvening })
    say('import', { ...result, left: ((await GutEvening.list())?.notes || []).length })
    // l'import prévient l'app, qui reprogramme ses rappels du soir et de portion : la laisser finir avant l'essai
    // suivant (28/10 : la reprogrammation de la note du soir retirait sa notification d'essai)
    await wait(3000)
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/**
 * Essai de la note du soir (étape I5), après celui du ventre (notifications déjà autorisées) : notification d'essai
 * « Votre soirée ? » en bannière, que le test d'interface déplie ; il note les actions qu'iOS affiche (6 demandées)
 * et en touche une. La note doit être dans la boîte du plugin, sans que l'app ait été ouverte. Résultats dans la
 * console (`[note] …`) et dans le journal du test d'interface (actions visibles).
 */
export async function probeEveningNote({ signal, waitAck, wait, log, plugin, importInbox }) {
  const say = (what, value) => log(`[note] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    const EveningNote = plugin ?? (await import('../services/eveningNote')).NativeEveningNote
    if (!(await EveningNote.status())?.notifications) return say('essai', 'notifications non autorisées : pas de notification d’essai')
    // même délai que le bilan du ventre : le test d'interface, lancé dès le signal, attend déjà la bannière
    await EveningNote.testNotification({ delay: 45, banner: true })
    await signal('note-du-soir')
    if (!(await waitAck('note-du-soir', 900))) say('note', 'pas d’accusé du script en 4 min 30')
    await wait(1000)
    const notes = (await EveningNote.list())?.notes || []
    const scores = notes.map((n) => {
      try {
        return JSON.parse(n.json).score
      } catch {
        return null
      }
    })
    say('boîte', { count: notes.length, scores })
    // Comme à l'ouverture suivante : l'app range les notes de la boîte dans l'historique, la boîte se vide
    const importer = importInbox ?? (await import('../services/eveningNote')).importPendingEveningNotes
    const result = await importer({ plugin: EveningNote })
    say('import', { ...result, left: ((await EveningNote.list())?.notes || []).length })
    // l'import prévient l'app, qui reprogramme ses rappels du soir et de portion : la laisser finir avant l'essai
    // suivant (28/10 : la reprogrammation de la note du soir retirait sa notification d'essai)
    await wait(3000)
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/**
 * Essai du rappel de portion de la réintroduction guidée (étape I5) : un rappel programmé par la vraie méthode
 * (`schedule`) 45 s après le signal ; le test d'interface met l'app en arrière-plan et touche la bannière, comme le
 * soir venu. Relevés ensuite : la page ouverte (la réintroduction si le toucher a été lu à l'ouverture, `Layout.jsx`
 * › `usePortionOpen`) et ce qu'en dit `takeOpen`. L'essai ne laisse aucun rappel derrière lui. Résultats dans la
 * console (`[portion] …`).
 */
export async function probePortionReminder({ signal, waitAck, wait, log, plugin, location, now = Date.now }) {
  const say = (what, value) => log(`[portion] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  let PortionReminder = plugin
  try {
    PortionReminder ??= (await import('../services/fodmapReminder')).NativePortionReminder
    const items = [{ at: now() + 45_000, title: 'Votre portion du jour', body: 'Essai de la build de captures.' }]
    const scheduled = await PortionReminder.schedule({ items })
    say('schedule', scheduled)
    if (!scheduled?.notifications) return say('essai', 'notifications non autorisées : rien à toucher')
    await signal('rappel-portion')
    if (!(await waitAck('rappel-portion', 900))) say('rappel', 'pas d’accusé du script en 4 min 30')
    await wait(2000)
    say('après le toucher', { page: location?.pathname, open: (await PortionReminder.takeOpen())?.open === true })
  } catch (e) {
    say('échec', e?.message || String(e))
  } finally {
    await PortionReminder?.schedule?.({ items: [] })?.catch?.(() => {})
  }
}

/** Fichiers de l'app dans Documents, écrits et relus comme le fait « Exporter » (`Data.jsx`). */
async function documentsFiles() {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  return {
    write: (name, text) =>
      Filesystem.writeFile({ path: name, data: btoa(unescape(encodeURIComponent(text))), directory: Directory.Documents }),
    read: async (name) => (await Filesystem.readFile({ path: name, directory: Directory.Documents, encoding: Encoding.UTF8 })).data,
    remove: (name) => Filesystem.deleteFile({ path: name, directory: Directory.Documents }),
  }
}

/**
 * Essai des données (étape I3) : toute la base exportée comme par « Exporter » (même JSON que sur Android), écrite
 * dans Documents comme le fait l'app sur iPhone, relue, puis réimportée en fusion (« sans doublon ») : rien ne doit
 * s'ajouter. Le fichier d'essai est retiré ensuite. Résultats dans la console (`[données] …`).
 */
export async function probeDataRoundtrip({ log, storage, files }) {
  const say = (what, value) => log(`[données] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  const name = 'halcya-essai-export.json'
  try {
    const db = storage ?? (await import('../storage/localHealthStorage'))
    const disk = files ?? (await documentsFiles())
    const count = await db.countAllEntries()
    const json = await db.exportToJson()
    const exported = db.parseBackup(json).entries.length
    await disk.write(name, json)
    const text = await disk.read(name)
    const reread = db.parseBackup(text).entries.length
    const { imported, skipped } = await db.importFromJson(text, { merge: true })
    const after = await db.countAllEntries()
    await disk.remove(name)
    say('aller-retour', { count, exported, reread, imported, skipped, after, bytes: json.length })
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/**
 * Essai de la sauvegarde du téléphone (étape I3) : la sauvegarde iCloud emporte Documents et Library, sauf ce qui est
 * marqué « exclu de la sauvegarde » (et Library/Caches). La sonde relève, pour Documents, la base de WKWebView
 * (dossiers IndexedDB sous Library/WebKit) et le dossier « Copie de secours », cette marque et la taille (plugin
 * `CaptureProbe`, build de captures seulement). Doivent être exclus : le repère propre au téléphone (`BackupMarker`),
 * que `restoreGuard.js` doit lire (`restored: false` sans `unavailable`), et, depuis le 1/11, le dossier de la copie
 * de secours (directive 5.1.3 (ii) : pas de données de santé dans iCloud). Résultats dans la console (`[sauvegarde] …`).
 */
export async function probeBackup({ log, plugin, checkRestore }) {
  const say = (what, value) => log(`[sauvegarde] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    const probe = plugin ?? (await import('@capacitor/core')).registerPlugin('CaptureProbe')
    const { items = [] } = (await probe.backupStatus()) || {}
    for (const { path, ...rest } of items) say(path, rest)
  } catch (e) {
    say('échec', e?.message || String(e))
  }
  try {
    const check = checkRestore ?? (await import('../services/restoreGuard')).checkRestore
    say('repère', await check())
  } catch (e) {
    say('repère échec', e?.message || String(e))
  }
}

/**
 * Essai de « Supprimer toutes mes données » (étape I3), en tout dernier : la base est vidée, et la copie de secours
 * (toutes les entrées et le profil) effacée aussi (correctif 22).
 * Résultats dans la console (`[suppression] …`).
 */
export async function probeDeleteAll({ log, storage, readSnapshot, deleteAll }) {
  const say = (what, value) => log(`[suppression] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    const db = storage ?? (await import('../storage/localHealthStorage'))
    const read = readSnapshot ?? (await import('./snapshot.js')).readDeviceSnapshot
    const wipe = deleteAll ?? (await import('../services/deleteAllData')).deleteAllMyData
    say('avant', { count: await db.countAllEntries(), copie: Boolean(await read()) })
    const { entries } = await wipe()
    say('après', { entries, count: await db.countAllEntries(), copie: Boolean(await read()) })
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

export const IMPORT_TEST_FILE = 'halcya-essai-import.json'

/** Ancien format de sauvegarde (tableau nu, sans version) : deux notes inventées, datées de 2020 pour être nouvelles. */
const OLD_BACKUP = [
  { type: 'note', source: 'app', at: '2020-01-06T08:00:00.000Z', payload: { text: 'Essai d’import : ancien fichier (1/2)' } },
  { type: 'note', source: 'app', at: '2020-01-07T08:00:00.000Z', payload: { text: 'Essai d’import : ancien fichier (2/2)' } },
]

/** Amène au milieu de l'écran le bouton `label`, pour que le test d'interface le touche. */
function revealButton(label) {
  const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label)
  button?.scrollIntoView({ block: 'center', behavior: 'instant' })
  return Boolean(button)
}

/**
 * Essai de l'import par le sélecteur de fichiers d'iOS (étape I3), le geste réel : un ancien fichier de sauvegarde
 * (tableau nu, format d'avant la version 1) est écrit dans Documents, visible dans Fichiers › Sur mon iPhone › Halcya
 * (`UIFileSharingEnabled`) ; Vos données s'ouvre sans recharger la page, le test d'interface
 * (`DonneesUITests/testImporterUnFichierDepuisFichiers`) touche « Choisir un fichier à importer » et choisit le
 * fichier dans le sélecteur ; l'aperçu capturé, « Ajouter à mes données » est touché, la base recomptée. Le fichier
 * d'essai est retiré ensuite. Résultats dans la console (`[import] …`).
 */
export async function probeFileImport({ log, signal, waitAck, wait, storage, files, navigate, reveal, click }) {
  const say = (what, value) => log(`[import] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  let disk
  try {
    const db = storage ?? (await import('../storage/localHealthStorage'))
    disk = files ?? (await documentsFiles())
    const go =
      navigate ??
      ((path) => {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    const avant = await db.countAllEntries()
    await disk.write(IMPORT_TEST_FILE, JSON.stringify(OLD_BACKUP, null, 2))
    go('/data')
    await wait(3000)
    const bouton = (reveal ?? revealButton)('Choisir un fichier à importer')
    await wait(800)
    await signal('import-fichier') // le test d'interface choisit le fichier, puis l'aperçu est capturé
    await waitAck('import-fichier', 600) // test d'interface : jusqu'à 3 min
    const ajouter = (click ?? clickButton)('Ajouter à mes données')
    await wait(3000)
    say('fichier', { avant, bouton, ajouter, après: await db.countAllEntries() })
  } catch (e) {
    say('échec', e?.message || String(e))
  } finally {
    await disk?.remove(IMPORT_TEST_FILE)?.catch?.(() => {})
  }
}

/**
 * Essai de l'export par la feuille de partage d'iOS (étape I3), le geste réel : Vos données s'ouvre sans recharger
 * la page ; le test d'interface (`DonneesUITests/testEnregistrerLaSauvegardeDansFichiers`) touche « Télécharger la
 * sauvegarde » (fichier écrit dans Documents puis feuille de partage), « Enregistrer dans Fichiers », le dossier
 * Halcya, « Enregistrer » puis « Garder les deux » : une 2e copie apparaît dans Documents. La sonde compte les
 * fichiers `healthtrack-export-*` avant et après (+2 attendus). Résultats dans la console (`[export] …`).
 */
export async function probeShareExport({ log, signal, waitAck, wait, navigate, reveal, list }) {
  const say = (what, value) => log(`[export] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    const names =
      list ??
      (async () => {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        return (await Filesystem.readdir({ path: '', directory: Directory.Documents })).files.map((f) => f.name)
      })
    const exports = async () => (await names()).filter((n) => n.startsWith('healthtrack-export-')).length
    const go =
      navigate ??
      ((path) => {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    const avant = await exports()
    go('/data')
    await wait(3000)
    const bouton = (reveal ?? revealButton)('Télécharger la sauvegarde')
    await wait(800)
    await signal('export-partage') // le test d'interface exporte, partage et enregistre, puis la feuille est capturée
    await waitAck('export-partage', 600) // test d'interface : jusqu'à 3 min
    await wait(2000)
    say('partage', { bouton, avant, après: await exports() })
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/**
 * Essai du rapport PDF pour le médecin (N6b, correctif 09), le geste réel : Vos données s'ouvre sans recharger la
 * page et « Préparer le rapport » est touché ; le test d'interface (`DonneesUITests/testEnregistrerLeRapportDansFichiers`)
 * touche « Créer le PDF » (fichier écrit dans Documents puis feuille de partage), « Enregistrer dans Fichiers », le
 * dossier Halcya, « Enregistrer » puis « Garder les deux » : une 2e copie apparaît dans Documents. La sonde compte les
 * fichiers `Halcya-rapport-*.pdf` avant et après (+2 attendus), lit la taille du premier et le message de la carte.
 * Résultats dans la console (`[rapport] …`).
 */
export async function probeShareReport({ log, signal, waitAck, wait, navigate, click, reveal, list, size, status }) {
  const say = (what, value) => log(`[rapport] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  try {
    const fs = async () => import('@capacitor/filesystem')
    const names =
      list ??
      (async () => {
        const { Filesystem, Directory } = await fs()
        return (await Filesystem.readdir({ path: '', directory: Directory.Documents })).files.map((f) => f.name)
      })
    const bytes =
      size ??
      (async (path) => {
        const { Filesystem, Directory } = await fs()
        return (await Filesystem.stat({ path, directory: Directory.Documents })).size
      })
    const reports = async () => (await names()).filter((n) => n.startsWith('Halcya-rapport-') && n.endsWith('.pdf'))
      .sort((a, b) => a.length - b.length || (a < b ? -1 : 1)) // celui de l'app d'abord, puis « … 2.pdf »
    const go =
      navigate ??
      ((path) => {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    const avant = (await reports()).length
    go('/data')
    await wait(3000)
    const préparer = (click ?? clickButton)('Préparer le rapport')
    await wait(800)
    const bouton = (reveal ?? revealButton)('Créer le PDF')
    await wait(800)
    await signal('rapport-partage') // le test d'interface crée, partage et enregistre, puis la feuille est capturée
    await waitAck('rapport-partage', 600) // test d'interface : jusqu'à 3 min
    await wait(2000)
    const après = await reports()
    const message = (status ?? (() => document.querySelector('[data-testid="doctor-report"] [role="status"]')?.textContent ?? null))()
    say('partage', { préparer, bouton, avant, après: après.length, octets: après.length ? await bytes(après[0]) : null, message })
  } catch (e) {
    say('échec', e?.message || String(e))
  }
}

/** « Reprendre mes données » de `SnapshotWelcome.jsx`, touché comme le ferait la personne. */
function clickButton(label) {
  const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label)
  button?.click()
  return Boolean(button)
}

/**
 * Essai de la copie de secours proposée à l'onboarding (étape I3, correctif 23) : ce que voit la personne quand iOS a
 * repris la base faute de place, la copie de secours restant sur l'iPhone (elle n'est plus dans la sauvegarde iCloud
 * depuis le 1/11 : après une restauration, c'est l'export qui ramène les données). La copie est mise à jour, la base vidée sans
 * toucher la copie, l'onboarding rouvert sans recharger la page (le mode capture ne reprend pas après un
 * rechargement), capturé ; puis « Reprendre mes données » est touché et capturé, la base recomptée et le thème
 * (retiré du localStorage comme sur un nouvel iPhone) vérifié revenu avec la copie. L'onboarding est
 * ensuite noté fait, comme avant. Résultats dans la console (`[restauration] …`).
 */
export async function probeSnapshotWelcome({ log, signal, waitAck, wait, storage, localStorage, writeSnapshot, navigate, clickRestore }) {
  const say = (what, value) => log(`[restauration] ${what} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  const onboarding = localStorage.getItem('healthtrack_onboarding')
  const theme = localStorage.getItem('healthtrack_theme') // un réglage gardé dans la copie, retiré comme sur un nouvel iPhone
  try {
    const db = storage ?? (await import('../storage/localHealthStorage'))
    const save =
      writeSnapshot ??
      (async () => {
        const [{ saveSnapshot }, { Filesystem, Directory, Encoding }] = await Promise.all([import('./snapshot.js'), import('@capacitor/filesystem')])
        const writeFile = (path, data) => Filesystem.writeFile({ path, data, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true })
        return saveSnapshot({ countAllEntries: db.countAllEntries, exportToJson: db.exportToJson, writeFile, storage: localStorage })
      })
    const go =
      navigate ??
      ((path) => {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
    const count = await db.countAllEntries()
    const copie = await save()
    await db.deleteAllEntries()
    localStorage.removeItem('healthtrack_theme')
    say('avant', { count, copie, vidée: await db.countAllEntries() })
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ step: 0 }))
    go('/bienvenue')
    window.scrollTo?.({ top: 0, behavior: 'instant' }) // la page d'avant (Vos données) était défilée
    await wait(3000) // la copie est lue, la carte s'affiche
    await signal('restauration-onboarding')
    await waitAck('restauration-onboarding')
    const bouton = (clickRestore ?? (() => clickButton('Reprendre mes données')))()
    await wait(5000) // import de toute la base
    await signal('restauration-reprise')
    await waitAck('restauration-reprise')
    say('après', { bouton, count: await db.countAllEntries(), réglages: theme == null || localStorage.getItem('healthtrack_theme') === theme })
  } catch (e) {
    say('échec', e?.message || String(e))
  } finally {
    if (onboarding) localStorage.setItem('healthtrack_onboarding', onboarding)
    if (theme != null && localStorage.getItem('healthtrack_theme') == null) localStorage.setItem('healthtrack_theme', theme)
  }
}

/**
 * Sonde vocale (étape I8) : `VoiceProbe` en Swift répond comme celui d'Android ; le verdict est celui de
 * `voiceProbe.js` (`on_device_fr` si le français se reconnaît sur le téléphone). Aucun micro, aucun son. Résultat dans
 * la console (`[voix] …`).
 */
/**
 * Lecture du visage (I7) : le plugin FaceSense de l'iPhone répond, avec les modèles embarqués, en mode « app_open »,
 * sans valence ni éveil ; puis une lecture de test. Le simulateur n'a pas de caméra : le script de captures dépose un
 * portrait du domaine public (tests d'Android) et accorde la permission ; la rafale lue est importée comme sur Android
 * (`importPendingFaceBursts`). Sans portrait, la lecture s'arrête avant la caméra. Jamais un score dans la console.
 */
export async function probeFace({ log, plugin, importBursts }) {
  const { faceSensePlugin } = await import('../services/faceSense')
  const p = plugin === undefined ? faceSensePlugin() : plugin
  if (!p) {
    log('[visage] sonde {"plugin":false}')
    return
  }
  try {
    const s = await p.status()
    const t = await p.test()
    const importer = importBursts ?? (await import('../services/faceBursts')).importPendingFaceBursts
    const r = await importer({ plugin: p })
    log(`[visage] sonde ${JSON.stringify({ plugin: true, models: s.models, mode: s.mode, affect: s.affectModel, outcome: t?.outcome, imported: r?.imported ?? 0 })}`)
  } catch (e) {
    log(`[visage] sonde ${JSON.stringify({ plugin: true, error: String(e?.message || e) })}`)
  }
}

export async function probeVoice({ log, plugin }) {
  const { probeVoice: probe, voiceVerdict, voiceProbePlugin } = await import('../services/voiceProbe')
  const p = await probe(plugin ?? voiceProbePlugin())
  log(`[voix] sonde ${JSON.stringify(p ? { verdict: voiceVerdict(p), available: p.available, onDevice: p.onDevice } : { verdict: null })}`)
}
