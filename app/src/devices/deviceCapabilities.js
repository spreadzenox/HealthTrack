/**
 * Ce que chaque app santé partage, mesure par mesure (ACC-5, nouvel accueil du 08/11) : sert à l'écran « Voici ce que
 * Halcya recevra ». Le statut vient d'abord de ce qui est vraiment arrivé ces 30 jours ; ce catalogue ne donne que la
 * raison d'une mesure « pas partagée » (l'appareil la mesure, l'app ne la donne pas) ou « en partie ».
 * Tiré du tableau des 15 configurations de journal/PERSONAS.md (maquette « Nouvel accueil Halcya », v3) ; les cas
 * « à vérifier » n'y figurent pas : sans donnée reçue, ils restent « pas mesuré ».
 */
import { matchHealthApp } from './healthApps'

/** Mesures montrées, dans l'ordre, avec leur thème (couleur de DESIGN.md). */
export const MEASURES = [
  { id: 'steps', label: 'Pas', theme: 'activity' },
  { id: 'sleep', label: 'Durée du sommeil', theme: 'sleep' },
  { id: 'stages', label: 'Phases du sommeil', theme: 'sleep' },
  { id: 'heartRate', label: 'Fréquence cardiaque', theme: 'body' },
  { id: 'restingHeartRate', label: 'FC au repos', theme: 'body' },
  { id: 'hrv', label: 'Variabilité cardiaque', theme: 'body' },
  { id: 'temperature', label: 'Température', theme: 'body' },
  { id: 'spo2', label: 'Oxygène du sang', theme: 'body' },
  { id: 'weight', label: 'Poids', theme: 'body' },
  { id: 'bloodPressure', label: 'Tension', theme: 'body' },
  { id: 'cycle', label: 'Cycle', theme: 'body' },
]

export const THEMES = [
  { id: 'activity', label: 'Activité' },
  { id: 'sleep', label: 'Sommeil' },
  { id: 'body', label: 'Corps' },
]

const NOT_SHARED = 'x'
const PARTIAL = 'p'
const HUAWEI_WIP = 'en cours chez Halcya'
const OTHER_WATCH = {
  hrv: [NOT_SHARED, 'pas partagée avec Health Connect'],
  temperature: [NOT_SHARED, 'pas partagée'],
}

/** app (id de healthApps.js) → mesure → [statut, raison en une ligne]. */
export const CAPABILITIES = {
  samsung_health: {
    restingHeartRate: [NOT_SHARED, 'Samsung ne la partage pas avec Health Connect'],
    hrv: [NOT_SHARED, 'votre montre la mesure, Samsung ne la partage avec aucune app'],
    temperature: [NOT_SHARED, 'réservée aux partenaires de Samsung'],
    bloodPressure: [NOT_SHARED, 'réservée aux partenaires de Samsung'],
  },
  mi_fitness: {
    heartRate: [PARTIAL, 'seulement pendant l’effort'],
    restingHeartRate: [NOT_SHARED, 'Xiaomi ne la partage pas'],
    hrv: [NOT_SHARED, 'votre bracelet la mesure, Xiaomi ne la partage avec aucune app'],
    spo2: [NOT_SHARED, 'mesurée, jamais partagée par Xiaomi'],
  },
  garmin: {
    hrv: [NOT_SHARED, 'votre montre la mesure, Garmin ne la partage pas avec Health Connect'],
    temperature: [NOT_SHARED, 'Garmin ne la partage pas'],
    spo2: [NOT_SHARED, 'Garmin ne la partage pas'],
    weight: [PARTIAL, 'balance Garmin Index : oui'],
  },
  fitbit: { spo2: [NOT_SHARED, 'Google la lit mais ne la partage pas'] },
  pixel_watch: { spo2: [NOT_SHARED, 'Google la lit mais ne la partage pas'] },
  zepp: OTHER_WATCH,
  polar: OTHER_WATCH,
  coros: OTHER_WATCH,
  suunto: OTHER_WATCH,
  withings: {
    weight: [PARTIAL, 'Withings demande Withings+ pour les comptes créés depuis le 12/10'],
    bloodPressure: [PARTIAL, 'Withings demande Withings+ pour les comptes créés depuis le 12/10'],
  },
  // Montre Huawei lue en direct (pas par Health Connect) : seulement quand elle est reliée ou à relier
  huawei_health: {
    stages: [PARTIAL, HUAWEI_WIP],
    restingHeartRate: [PARTIAL, HUAWEI_WIP],
    hrv: [PARTIAL, HUAWEI_WIP],
    temperature: [PARTIAL, HUAWEI_WIP],
    spo2: [PARTIAL, HUAWEI_WIP],
  },
}

const SLEEP_STAGES = new Set(['light', 'deep', 'rem'])
const HEART_SUBTYPES = { heartRate: 'heartRate', restingHeartRate: 'restingHeartRate', heartRateVariability: 'hrv', oxygenSaturation: 'spo2' }

/** Mesures (ids de MEASURES) qu'apporte une entrée importée. */
export function measuresOf(entry) {
  const p = entry?.payload || {}
  switch (entry?.type) {
    case 'steps':
      return ['steps']
    case 'sleep':
      return SLEEP_STAGES.has(p.sleepState) ? ['sleep', 'stages'] : ['sleep']
    case 'heart_rate': {
      const m = HEART_SUBTYPES[p.subtype || 'heartRate']
      return m ? [m] : []
    }
    case 'body_temperature':
      return ['temperature']
    case 'weight':
      return ['weight']
    case 'blood_pressure':
      return ['bloodPressure']
    case 'menstruation':
    case 'cycle':
      return ['cycle']
    default:
      return []
  }
}

/**
 * Statut de chaque mesure : « reçu » (arrivé ces 30 jours), « en partie » (arrivé, ou annoncé, avec une limite),
 * « pas partagée » (l'appareil la mesure, son app ne la donne pas), sinon « pas mesuré ».
 * @param {{ entries: object[], appIds?: string[] }} p appIds : apps qui envoient ou qui sont installées
 * @returns {{ groups: Array<{ theme: string, label: string, items: Array<{ id, label, status, reason }> }>, notMeasured: string[] }}
 */
export function measureStatuses({ entries = [], appIds = [] }) {
  const received = new Set()
  const senders = new Set()
  for (const e of entries) {
    const ms = measuresOf(e)
    ms.forEach((m) => received.add(m))
    const app = matchHealthApp(e?.payload?.sourceName)
    if (app && ms.length) senders.add(app.id)
  }
  const apps = [...new Set([...senders, ...appIds])]
  const items = MEASURES.map((m) => {
    const notes = apps.map((id) => CAPABILITIES[id]?.[m.id]).filter(Boolean)
    const partial = notes.find((n) => n[0] === PARTIAL)
    const hidden = notes.find((n) => n[0] === NOT_SHARED)
    if (received.has(m.id)) return { ...m, status: partial ? 'partial' : 'received', reason: partial?.[1] ?? null }
    if (partial) return { ...m, status: 'partial', reason: partial[1] }
    if (hidden) return { ...m, status: 'not_shared', reason: hidden[1] }
    return { ...m, status: 'none', reason: null }
  })
  const groups = THEMES.map((t) => ({ theme: t.id, label: t.label, items: items.filter((i) => i.theme === t.id && i.status !== 'none') }))
    .filter((g) => g.items.length)
  return { groups, notMeasured: items.filter((i) => i.status === 'none').map((i) => i.label) }
}

/** Libellé court du statut. */
export const STATUS_LABEL = { received: 'reçu', partial: 'en partie', not_shared: 'pas partagée' }
