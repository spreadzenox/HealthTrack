import { describe, it, expect } from 'vitest'
import { personaEntries, keepForEquipment } from './personaData.mjs'
import { generateDemoEntries } from '../visual/demoData.mjs'
import { summarizeHealthConnectSources, missingWatchMetrics } from '../../src/devices/healthApps.js'

const now = new Date('2026-11-08T15:00:00')
const demo = generateDemoEntries({ now })
const types = (list) => new Set(list.map((e) => e.type))

describe('personaEntries', () => {
  it('jour 14 : rien de plus ancien que 14 jours, rien dans le futur', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'full', now })
    const from = new Date('2026-10-26T00:00:00')
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((e) => new Date(e.at) >= from && new Date(e.at) <= now)).toBe(true)
  })

  it('jour 1 : aucune saisie dans l\'app, mais l\'historique de la montre (30 jours)', () => {
    const list = personaEntries(demo, { day: 1, equipment: 'watch', now })
    expect([...types(list)].some((t) => ['food', 'gut', 'wellbeing', 'face_burst', 'stool'].includes(t))).toBe(false)
    expect(types(list).has('sleep')).toBe(true)
    expect(list.some((e) => new Date(e.at) < new Date('2026-10-20'))).toBe(true)
  })

  it('jour 1 : ni météo ni temps d\'écran, que l\'app ne lit qu\'une fois la source activée (POLISH-SIM-45)', () => {
    const list = personaEntries(demo, { day: 1, equipment: 'watch', now })
    expect(types(list).has('weather')).toBe(false)
    expect(types(list).has('phone_usage')).toBe(false)
  })

  it('jour 14 : météo et temps d\'écran, activés à l\'accueil', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'watch', now })
    expect(types(list).has('weather')).toBe(true)
    expect(types(list).has('phone_usage')).toBe(true)
  })

  it('téléphone seul : pas et calories seulement côté import', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'phone', now })
    expect(types(list).has('sleep')).toBe(false)
    expect(types(list).has('heart_rate')).toBe(false)
    expect(types(list).has('steps')).toBe(true)
    expect(types(list).has('food')).toBe(true)
  })

  it('téléphone seul au jour 1 : les pas de la journée en cours, comme Health Connect les donne (POLISH-SIM-40)', () => {
    const list = personaEntries(demo, { day: 1, equipment: 'phone', now })
    const today = list.filter((e) => e.type === 'steps' && new Date(e.at).toDateString() === now.toDateString())
    expect(today).toHaveLength(1)
    expect(today[0].payload.value).toBeGreaterThan(0)
    expect(new Date(today[0].payload.endDate).getTime()).toBeLessThanOrEqual(now.getTime())
  })

  it('montre sans VFC : ni VFC, ni montre Huawei, ni poids', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'watch', now })
    expect(list.some((e) => e.payload?.subtype === 'heartRateVariability')).toBe(false)
    expect(list.some((e) => e.source === 'huawei_watch')).toBe(false)
    expect(types(list).has('weight')).toBe(false)
    expect(types(list).has('sleep')).toBe(true)
  })

  it('montre Samsung (watch) : ni FC au repos, ni température, ni respiration (Samsung ne les écrit pas)', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'watch', now })
    expect(list.some((e) => e.payload?.subtype === 'restingHeartRate')).toBe(false)
    expect(types(list).has('body_temperature')).toBe(false)
    expect(types(list).has('respiratory_rate')).toBe(false)
    expect(list.some((e) => e.payload?.subtype === 'heartRate')).toBe(true)
  })

  it('nom de source réaliste selon le matériel, jamais « Gadgetbridge »', () => {
    const names = (equipment) => new Set(personaEntries(demo, { day: 14, equipment, now })
      .filter((e) => e.source === 'health_connect').map((e) => e.payload?.sourceName))
    expect([...names('watch')]).toEqual(['Samsung Health'])
    expect([...names('phone')]).toEqual(['Samsung Health'])
    expect([...names('watch-hrv')]).toEqual(['Fitbit'])
    expect(demo.some((e) => e.payload?.sourceName === 'Gadgetbridge')).toBe(true)
  })

  it('POLISH-SIM-35 : la Galaxy Watch envoie l’oxygène du sang chaque nuit ; ni Fitbit (config. 13) ni téléphone seul', () => {
    const spo2 = (equipment, day = 14) => personaEntries(demo, { day, equipment, now })
      .filter((e) => e.type === 'heart_rate' && e.payload?.subtype === 'oxygenSaturation')
    for (const eq of ['watch', 'full']) {
      const list = spo2(eq)
      expect(list.length).toBeGreaterThanOrEqual(13)
      expect(list.every((e) => e.source === 'health_connect' && e.payload.value >= 90 && e.payload.value <= 100 && e.payload.unit === 'percent')).toBe(true)
    }
    expect(spo2('watch', 1).some((e) => new Date(e.at) < new Date('2026-10-20'))).toBe(true) // historique importé
    expect(spo2('huawei').every((e) => e.source === 'huawei_watch')).toBe(true)
    expect(spo2('huawei').length).toBeGreaterThan(0)
    expect(spo2('phone')).toHaveLength(0)
    expect(spo2('watch-hrv')).toHaveLength(0)
    const [watch] = summarizeHealthConnectSources(personaEntries(demo, { day: 14, equipment: 'watch', now }), now)
    expect(missingWatchMetrics(watch.metrics)).not.toContain('oxygène du sang')
  })

  it('--source : l’app qui écrit dans Health Connect suit le téléphone tiré (Pixel → Google Fit, Amazfit → Zepp)', () => {
    const names = new Set(personaEntries(demo, { day: 14, equipment: 'phone', now, sourceName: 'Google Fit' })
      .filter((e) => e.source === 'health_connect').map((e) => e.payload?.sourceName))
    expect([...names]).toEqual(['Google Fit'])
  })

  it('saisie « peu » (persona pressée) : ni repas ni ventre, quelques notes de bien-être, visage gardé', () => {
    const all = personaEntries(demo, { day: 45, equipment: 'watch', now })
    const few = personaEntries(demo, { day: 45, equipment: 'watch', now, notes: 'few' })
    expect([...types(few)].some((t) => ['food', 'gut', 'stool', 'cigarette', 'fodmap_challenge'].includes(t))).toBe(false)
    const notes = (list) => new Set(list.filter((e) => e.type === 'wellbeing').map((e) => e.at.slice(0, 10))).size
    expect(notes(few)).toBeGreaterThan(0)
    expect(notes(few)).toBeLessThanOrEqual(Math.ceil(notes(all) / 3))
    expect(few.filter((e) => e.type === 'face_burst').length).toBe(all.filter((e) => e.type === 'face_burst').length)
    expect(types(few).has('sleep')).toBe(true)
  })

  it('objectif « cycle » (jour > 1) : des règles notées tous les 28 jours environ, avec symptômes', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'phone', now, goals: ['cycle', 'gut'] })
    const periods = list.filter((e) => e.type === 'cycle' && e.payload.subtype === 'period')
    const starts = new Set(periods.map((e) => e.at.slice(0, 10)))
    expect(starts.size).toBeGreaterThanOrEqual(8) // deux règles de 4 à 5 jours en 45 jours
    expect(list.some((e) => e.type === 'cycle' && e.payload.subtype === 'symptom')).toBe(true)
    expect(list.every((e) => e.type !== 'cycle' || e.source === 'app_cycle')).toBe(true)
    expect(list.every((e) => new Date(e.at) <= now)).toBe(true)
  })

  it('sans objectif « cycle », ou au jour 1, aucune donnée de cycle', () => {
    expect(personaEntries(demo, { day: 45, equipment: 'phone', now, goals: ['gut'] }).some((e) => e.type === 'cycle')).toBe(false)
    expect(personaEntries(demo, { day: 1, equipment: 'phone', now, goals: ['cycle'] }).some((e) => e.type === 'cycle')).toBe(false)
  })

  it('POLISH-SIM-32 : objectif ventre, profil complet : une note digestive chaque jour, pas seulement les 10 derniers', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'phone', now, goals: ['gut'] })
    const gut = list.filter((e) => e.type === 'gut')
    const days = new Set(gut.map((e) => { const d = new Date(e.at); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }))
    expect(days.size).toBeGreaterThanOrEqual(44) // la note du soir d'aujourd'hui peut ne pas être encore là
    expect(gut.filter((e) => e.payload.level !== 'calm').length).toBeGreaterThanOrEqual(5)
    expect(gut.every((e) => new Date(e.at) <= now)).toBe(true)
    // sans l'objectif ventre, ou avec le profil « few », rien n'est ajouté
    const noGoal = personaEntries(demo, { day: 45, equipment: 'phone', now, goals: [] }).filter((e) => e.type === 'gut')
    expect(noGoal.length).toBeLessThan(gut.length)
    expect(personaEntries(demo, { day: 45, equipment: 'phone', now, goals: ['gut'], notes: 'few' }).some((e) => e.type === 'gut')).toBe(false)
  })

  it('POLISH-SIM-63 : aucune cigarette, aucune persona n\'a activé ce compteur', () => {
    expect(types(demo).has('cigarette')).toBe(true)
    for (const equipment of ['phone', 'watch', 'full']) {
      expect(types(personaEntries(demo, { day: 45, equipment, now })).has('cigarette')).toBe(false)
    }
  })

  it('POLISH-SIM-66 : sans balance, ni pesée ni composition corporelle ; avec (full), les deux', () => {
    expect(types(demo).has('body_composition')).toBe(true)
    for (const equipment of ['phone', 'watch', 'watch-hrv', 'huawei']) {
      const t = types(personaEntries(demo, { day: 45, equipment, now }))
      expect(t.has('weight')).toBe(false)
      expect(t.has('body_composition')).toBe(false)
    }
    expect(types(personaEntries(demo, { day: 45, equipment: 'full', now })).has('body_composition')).toBe(true)
  })

  it('POLISH-SIM-79 : Apple Watch (config. 3) : VFC et oxygène du sang, source « Apple Watch », pas de balance', () => {
    const list = personaEntries(demo, { day: 14, equipment: 'apple-watch', now })
    expect(list.some((e) => e.payload?.subtype === 'heartRateVariability')).toBe(true)
    expect(list.filter((e) => e.payload?.subtype === 'oxygenSaturation').length).toBeGreaterThanOrEqual(13)
    expect(list.some((e) => e.source === 'huawei_watch')).toBe(false)
    expect(types(list).has('weight')).toBe(false)
    expect(list.filter((e) => e.source === 'health_connect' && e.payload?.sourceName).every((e) => e.payload.sourceName === 'Apple Watch')).toBe(true)
  })

  it('téléphone + balance (config. 5) : pas, calories et pesées ; ni sommeil ni cœur', () => {
    const list = personaEntries(demo, { day: 45, equipment: 'phone-scale', now })
    const t = types(list)
    expect(t.has('steps')).toBe(true)
    expect(t.has('weight') || t.has('body_composition')).toBe(true)
    expect(t.has('sleep')).toBe(false)
    expect(t.has('heart_rate')).toBe(false)
    const day1 = types(personaEntries(demo, { day: 1, equipment: 'phone-scale', now }))
    expect(day1.has('weight') || day1.has('body_composition')).toBe(true) // historique importé de la balance
  })

  it('refuse un profil de saisie inconnu', () => {
    expect(() => personaEntries(demo, { day: 14, equipment: 'phone', now, notes: 'jamais' })).toThrow(/inconnu/)
  })

  it('refuse un matériel inconnu', () => {
    expect(() => keepForEquipment({ type: 'sleep' }, 'tablette')).toThrow(/inconnu/)
  })
})
