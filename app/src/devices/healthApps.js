/**
 * « Mes appareils » : quelles apps santé / montres sont présentes sur le téléphone, et lesquelles
 * envoient vraiment des données à HealthTrack (via Health Connect) ?
 *
 * - Détection des apps installées : `@capacitor/app-launcher` `canOpenUrl({ url: <package> })`
 *   (PackageManager.getPackageInfo côté Android). Android 11+ ne laisse voir que les paquets
 *   déclarés dans `<queries>` (AndroidManifest.xml) : tout paquet de HEALTH_APPS doit y figurer
 *   (vérifié par healthApps.test.js).
 * - Sources réelles : chaque mesure Health Connect garde `payload.sourceName` (nom de l'app qui
 *   l'a écrite, ou son nom de paquet si Android ne donne pas le nom).
 *
 * Aucune liste de modèles de montres : on raisonne par app compagnon (une app = une famille
 * d'appareils), ce qui couvre toute une gamme d'un coup. journal/IDEES.md (I3).
 */

/**
 * `writesHealthConnect` : l'app sait écrire dans Health Connect (il suffit de l'activer chez elle).
 * `bridgeFor` : l'app sert de passerelle pour les apps listées (Gadgetbridge / Health Sync pour Huawei).
 * `guideId` : guide de « Votre montre n'apparaît pas ? » (src/data/watchGuides.jsx).
 */
export const HEALTH_APPS = [
  { id: 'huawei_health', name: 'Huawei Health', packages: ['com.huawei.health'], writesHealthConnect: false, guideId: 'huawei' },
  { id: 'honor_health', name: 'Honor Santé', packages: ['com.hihonor.health'], writesHealthConnect: false, guideId: 'huawei' },
  {
    id: 'gadgetbridge',
    name: 'Gadgetbridge',
    packages: ['nodomain.freeyourgadget.gadgetbridge', 'nodomain.freeyourgadget.gadgetbridge.nightly'],
    writesHealthConnect: true,
    bridgeFor: ['huawei_health', 'honor_health', 'zepp', 'zepp_life', 'mi_fitness'],
    guideId: 'huawei',
    enableHint: 'Gadgetbridge → Réglages → Intégrations externes → Health Connect.',
  },
  {
    id: 'health_sync',
    name: 'Health Sync',
    packages: ['nl.appyhapps.healthsync'],
    writesHealthConnect: true,
    bridgeFor: ['huawei_health', 'honor_health', 'garmin', 'polar', 'suunto', 'coros'],
    guideId: 'huawei',
    enableHint: 'Health Sync : choisissez « Health Connect » comme destination.',
  },
  {
    id: 'samsung_health',
    name: 'Samsung Health',
    packages: ['com.sec.android.app.shealth'],
    writesHealthConnect: true,
    guideId: 'samsung',
    enableHint: 'Samsung Health → ⋮ → Paramètres → Health Connect.',
  },
  { id: 'zepp', name: 'Zepp (Amazfit)', packages: ['com.huami.watch.hmwatchmanager'], writesHealthConnect: true, guideId: 'xiaomi', enableHint: 'Zepp → Profil → Comptes → Health Connect.' },
  { id: 'zepp_life', name: 'Zepp Life (Mi Band)', packages: ['com.xiaomi.hm.health'], writesHealthConnect: true, guideId: 'xiaomi', enableHint: 'Zepp Life → Profil → Ajouter des comptes → Health Connect.' },
  { id: 'mi_fitness', name: 'Mi Fitness (Xiaomi)', packages: ['com.mi.health', 'com.xiaomi.wearable'], writesHealthConnect: true, guideId: 'xiaomi', enableHint: 'Mi Fitness → Profil → Applis tierces → Health Connect.' },
  { id: 'garmin', name: 'Garmin Connect', packages: ['com.garmin.android.apps.connectmobile'], writesHealthConnect: true, guideId: 'garmin', enableHint: 'Garmin Connect → Plus → Paramètres → Applications connectées → Health Connect.' },
  { id: 'fitbit', name: 'Fitbit', packages: ['com.fitbit.FitbitMobile'], writesHealthConnect: true, guideId: 'other', enableHint: 'Fitbit → Profil → Health Connect.' },
  { id: 'google_fit', name: 'Google Fit', packages: ['com.google.android.apps.fitness'], writesHealthConnect: true, guideId: 'other', enableHint: 'Google Fit → Profil → Paramètres → Health Connect.' },
  { id: 'pixel_watch', name: 'Pixel Watch', packages: ['com.google.android.apps.wear.companion'], writesHealthConnect: true, guideId: 'other', enableHint: 'Les données passent par Fitbit : activez Health Connect dans l’app Fitbit.' },
  { id: 'withings', name: 'Withings', packages: ['com.withings.wiscale2'], writesHealthConnect: true, guideId: 'other', enableHint: 'Connecteur Withings de HealthTrack (ci-dessus), ou Withings → Profil → Health Connect.' },
  { id: 'oura', name: 'Oura', packages: ['com.ouraring.oura'], writesHealthConnect: true, guideId: 'other', enableHint: 'Oura → ☰ → Paramètres → Health Connect.' },
  { id: 'polar', name: 'Polar Flow', packages: ['fi.polar.polarflow'], writesHealthConnect: true, guideId: 'other', enableHint: 'Polar Flow → Paramètres → Partage → Health Connect.' },
  { id: 'suunto', name: 'Suunto', packages: ['com.stt.android.suunto'], writesHealthConnect: true, guideId: 'other', enableHint: 'Suunto → Profil → Partenaires → Health Connect.' },
  { id: 'coros', name: 'COROS', packages: ['com.yf.smart.coros.dist'], writesHealthConnect: true, guideId: 'other', enableHint: 'COROS → Profil → Paramètres → Applis tierces → Health Connect.' },
  { id: 'whoop', name: 'WHOOP', packages: ['com.whoop.android'], writesHealthConnect: true, guideId: 'other', enableHint: 'WHOOP → Profil → Intégrations → Health Connect.' },
  { id: 'strava', name: 'Strava', packages: ['com.strava'], writesHealthConnect: true, guideId: 'other', enableHint: 'Strava → Paramètres → Applications, services et appareils → Health Connect.' },
]

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')

/** App du catalogue correspondant à un `sourceName` Health Connect (nom affiché ou paquet). */
export function matchHealthApp(sourceName) {
  const s = norm(sourceName)
  if (!s) return null
  const byPackage = HEALTH_APPS.find((app) => app.packages.some((p) => norm(p) === s))
  if (byPackage) return byPackage
  // Nom affiché : le plus long préfixe gagne (« Zepp Life » ne doit pas tomber sur « Zepp »).
  let best = null
  let bestLen = 0
  for (const app of HEALTH_APPS) {
    const n = norm(app.name.replace(/\(.*\)/, ''))
    if (n && s.startsWith(n) && n.length > bestLen) {
      best = app
      bestLen = n.length
    }
  }
  return best
}

/**
 * Apps du catalogue installées sur le téléphone.
 * @param {(pkg: string) => Promise<boolean>} isInstalled
 * @returns {Promise<Array<object & { package: string }>>}
 */
export async function detectInstalledApps(isInstalled) {
  const results = await Promise.all(
    HEALTH_APPS.map(async (app) => {
      for (const pkg of app.packages) {
        try {
          if (await isInstalled(pkg)) return { ...app, package: pkg }
        } catch {
          // paquet invisible ou pont natif absent : considéré comme non installé
        }
      }
      return null
    }),
  )
  return results.filter(Boolean)
}

/**
 * Mesure suivie dans « qui envoie quoi » : le type d'entrée, affiné par le sous-type pour la FC
 * (Health Connect range FC, FC repos, VFC et SpO₂ dans « heart_rate »). Ordre = ordre d'affichage.
 */
export const METRICS = [
  { key: 'heartRate', label: 'cœur', watch: true },
  { key: 'restingHeartRate', label: 'FC repos', watch: true },
  { key: 'heartRateVariability', label: 'VFC', watch: true },
  { key: 'oxygenSaturation', label: 'SpO₂', watch: true },
  { key: 'sleep', label: 'sommeil', watch: true },
  { key: 'steps', label: 'pas', watch: true },
  { key: 'calories', label: 'dépense' },
  { key: 'activity', label: 'séances' },
  { key: 'respiratory_rate', label: 'respiration' },
  { key: 'body_temperature', label: 'température' },
  { key: 'blood_pressure', label: 'tension' },
  { key: 'blood_glucose', label: 'glycémie' },
  { key: 'weight', label: 'poids' },
  { key: 'body_composition', label: 'masse grasse' },
]
const METRIC_BY_KEY = new Map(METRICS.map((m) => [m.key, m]))

/** Clé de mesure d'une entrée (null si non suivie). */
export function metricKey(entry) {
  const key = entry?.type === 'heart_rate' ? entry.payload?.subtype || 'heartRate' : entry?.type
  return METRIC_BY_KEY.has(key) ? key : null
}

const DAY_MS = 24 * 3600 * 1000
/** Une mesure est « habituelle » si elle est arrivée au moins 7 jours sur les 14 qui précèdent la dernière. */
const HABIT_WINDOW_DAYS = 14
const HABIT_MIN_DAYS = 7
/** Une mesure habituelle est « arrêtée » après 3 jours pleins sans rien. */
const STOP_AFTER_DAYS = 3

/**
 * « Qui envoie quoi » pour une source : par mesure, la dernière date, le nombre de jours reçus,
 * et si une mesure habituelle s'est arrêtée (« plus de VFC depuis 4 jours »). Fonction pure.
 * Les jours comptés sont des tranches de 24 h avant la dernière mesure (indépendant du fuseau).
 * @param {Array<{ at: string, type: string, payload?: object }>} entries entrées d'une même source
 * @param {Date} now
 * @returns {Array<{ key: string, label: string, lastAt: string, days: number, habitual: boolean, stopped: boolean, gapDays: number }>}
 */
export function sourceCoverage(entries, now = new Date()) {
  const byKey = new Map()
  for (const e of entries || []) {
    const key = metricKey(e)
    const t = Date.parse(e?.at)
    if (!key || !Number.isFinite(t)) continue
    const cur = byKey.get(key) || []
    cur.push(t)
    byKey.set(key, cur)
  }
  return METRICS.filter((m) => byKey.has(m.key)).map((m) => {
    const times = byKey.get(m.key)
    const last = Math.max(...times)
    const recentDays = new Set()
    for (const t of times) {
      const d = Math.floor((last - t) / DAY_MS)
      if (d < HABIT_WINDOW_DAYS) recentDays.add(d)
    }
    const habitual = recentDays.size >= HABIT_MIN_DAYS
    const gapDays = Math.max(0, Math.floor((now.getTime() - last) / DAY_MS))
    return {
      key: m.key,
      label: m.label,
      lastAt: new Date(last).toISOString(),
      days: recentDays.size,
      habitual,
      stopped: habitual && gapDays >= STOP_AFTER_DAYS,
      gapDays,
    }
  })
}

/**
 * Mesures courantes d'une montre jamais reçues de cette source (« Pas reçu : VFC, SpO₂ »).
 * Seulement pour une source qui envoie déjà du cœur : une balance n'a pas à envoyer de VFC.
 */
export function missingWatchMetrics(metrics) {
  const keys = new Set((metrics || []).map((m) => m.key))
  if (!keys.has('heartRate') && !keys.has('restingHeartRate')) return []
  return METRICS.filter((m) => m.watch && !keys.has(m.key)).map((m) => m.label)
}

/**
 * Apps qui ont réellement écrit des mesures Health Connect lues par HealthTrack.
 * @param {Array<{ source: string, at: string, type: string, payload?: object }>} entries
 * @param {Date} [now]
 * @returns {Array<{ name: string, app: object|null, lastAt: string, count: number, types: string[], metrics: object[] }>}
 */
export function summarizeHealthConnectSources(entries, now = new Date()) {
  const bySource = new Map()
  for (const e of entries || []) {
    if (e?.source !== 'health_connect') continue
    const raw = e.payload?.sourceName
    if (!raw) continue
    const app = matchHealthApp(raw)
    const key = app ? app.id : raw
    const cur = bySource.get(key) || { name: app ? app.name : raw, app, lastAt: e.at, count: 0, types: new Set(), entries: [] }
    cur.count += 1
    cur.types.add(e.type)
    cur.entries.push(e)
    if (e.at > cur.lastAt) cur.lastAt = e.at
    bySource.set(key, cur)
  }
  return [...bySource.values()]
    .map(({ entries: own, ...s }) => ({ ...s, types: [...s.types].sort(), metrics: sourceCoverage(own, now) }))
    .sort((a, b) => (b.lastAt < a.lastAt ? -1 : 1))
}

const RECENT_MS = 3 * 24 * 3600 * 1000

/**
 * Une ligne par app détectée ou par source réelle, avec ce qu'il reste à faire.
 * status : 'ok' (données récentes), 'stale' (plus de données depuis 3 jours), 'action' (à brancher),
 * 'bridged' (couverte par une passerelle qui envoie déjà ses données).
 * @param {{ installed: object[], sources: object[], now?: Date }} args
 */
export function adviseDevices({ installed = [], sources = [], now = new Date() }) {
  const sourceById = new Map(sources.filter((s) => s.app).map((s) => [s.app.id, s]))
  const installedIds = new Set(installed.map((a) => a.id))
  const isRecent = (s) => s && now.getTime() - new Date(s.lastAt).getTime() <= RECENT_MS
  const rows = []

  for (const app of installed) {
    const src = sourceById.get(app.id)
    const base = { id: app.id, name: app.name, package: app.package, guideId: app.guideId, source: src || null }
    if (src) {
      rows.push({ ...base, status: isRecent(src) ? 'ok' : 'stale', message: isRecent(src) ? 'Envoie ses données' : 'Plus de données depuis quelques jours : ouvrez l’app pour synchroniser la montre.' })
      continue
    }
    const bridges = installed.filter((b) => b.bridgeFor?.includes(app.id))
    // Une passerelle qui envoie des données compte même si sa détection a échoué.
    const activeBridge = sources.find((s) => s.app?.bridgeFor?.includes(app.id) && isRecent(s))?.app
    if (activeBridge) {
      rows.push({ ...base, status: 'bridged', message: `Vos données passent par ${activeBridge.name}.` })
    } else if (!app.writesHealthConnect) {
      rows.push({
        ...base,
        status: 'action',
        message: bridges.length
          ? `N’écrit pas dans Health Connect. ${bridges[0].name} est installé : activez son envoi vers Health Connect.`
          : 'N’écrit pas dans Health Connect : passez par Gadgetbridge (gratuit) pour récupérer vos données.',
      })
    } else {
      rows.push({ ...base, status: 'action', message: `Rien reçu pour l’instant. ${app.enableHint || 'Activez son partage vers Health Connect.'}` })
    }
  }

  for (const src of sources) {
    if (src.app && installedIds.has(src.app.id)) continue
    rows.push({
      id: src.app?.id || `src:${src.name}`,
      name: src.name,
      package: null,
      guideId: src.app?.guideId || null,
      source: src,
      status: isRecent(src) ? 'ok' : 'stale',
      message: isRecent(src) ? 'Envoie ses données' : 'Plus de données depuis quelques jours.',
    })
  }

  const order = { action: 0, stale: 1, ok: 2, bridged: 3 }
  return rows.sort((a, b) => order[a.status] - order[b.status])
}
