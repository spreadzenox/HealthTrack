import { describe, it, expect } from 'vitest'
import { influenceFamilies, familyOf, familyDetail, familyUsuals, familyPeriods, familyBars, eveningsText, LEVEL_WORDS } from './influenceFamilies'

const f = (key, label, effect, { theme = 'sleep', actionable = true, net = true, outOfScale = false } = {}) => ({ key, label, theme, actionable, effect, net, outOfScale })
const h = (id, status, factors = []) => ({ id, status, factors })
const outcome = (short = [], medium = [], extra = {}) => ({
  status: 'partial',
  horizons: { short: h('short', 'ready', short), medium: h('medium', 'ready', medium), long: h('long', 'locked', [f('sleepMinutes', 'Sommeil', 2)]) },
  ...extra,
})

describe('familles de ce qui va avec un objectif (refonte « Compagnon », étape 6b)', () => {
  it('range chaque facteur dans sa famille ; le corps et la météo n’en ont pas', () => {
    expect(familyOf(f('sleepMinutes', 'Sommeil', 0))).toBe('sleep')
    expect(familyOf(f('screen_late_minutes', 'Écran tard le soir', 0, { theme: 'context' }))).toBe('sleep')
    expect(familyOf(f('fodmap_fructans', 'Fructanes', 0, { theme: 'nutrition' }))).toBe('nutrition')
    expect(familyOf(f('steps', 'Pas', 0, { theme: 'activity' }))).toBe('activity')
    expect(familyOf(f('habit_meditation', 'Méditation', 0, { theme: 'habit' }))).toBe('habit')
    expect(familyOf(f('social_minutes', 'Réseaux sociaux', 0, { theme: 'context' }))).toBe('screen')
    expect(familyOf(f('hrv_ms', 'Variabilité cardiaque', 0, { theme: 'body', actionable: false }))).toBeNull()
    expect(familyOf(f('weather_sunshine_h', 'Soleil', 0, { theme: 'context', actionable: false }))).toBeNull()
  })

  it('rien avant les premiers résultats', () => {
    expect(influenceFamilies(null)).toEqual([])
    expect(influenceFamilies({ status: 'locked', horizons: { short: h('short', 'locked') } })).toEqual([])
  })

  it('trois niveaux d’après le lien net le plus fort de la famille, la plus forte en premier', () => {
    const rows = influenceFamilies(outcome(
      [f('steps', 'Pas', 0.1, { theme: 'activity' }), f('sleepMinutes', 'Sommeil', -0.6), f('fiber_g', 'Fibres', 0.3, { theme: 'nutrition' })],
      [f('sleepMinutes', 'Sommeil', 0.2), f('kcal', 'Calories mangées', 0.26, { theme: 'nutrition' })],
    ))
    expect(rows.map((r) => [r.id, r.level, r.lead])).toEqual([['sleep', 3, 'Sommeil'], ['nutrition', 2, 'Fibres'], ['activity', 1, 'Pas']])
    expect(rows.map((r) => r.word)).toEqual([LEVEL_WORDS[3], LEVEL_WORDS[2], LEVEL_WORDS[1]])
    expect(rows[0].tone).toBe('night')
  })

  it('un lien pas net, hors échelle ou d’un délai pas encore prêt ne compte pas', () => {
    const rows = influenceFamilies(outcome([
      f('sleepMinutes', 'Sommeil', 0.9, { net: false }),
      f('fiber_g', 'Fibres', 3, { theme: 'nutrition', outOfScale: true }),
    ]))
    expect(rows.map((r) => [r.id, r.level, r.state, r.lead])).toEqual([
      ['sleep', 0, 'none', null], ['nutrition', 0, 'none', null], ['activity', 0, 'nodata', null],
    ])
    // POLISH-SIM-104 : les mêmes mots que la légende des barres hachurées (« pas assez net »), plus « pas de lien »
    // au-dessus de chiffres comme GOS −1,1 pt
    expect(rows[0].word).toBe('Pas assez net pour l’instant')
    expect(rows[2].word).toBe('Pas assez de données')
    // POLISH-SIM-170 : une famille sans données dit ce qui manque et où le donner ; les autres n'ont pas d'action
    expect(rows[2].action).toEqual({ text: 'Il faut vos pas au moins un jour sur deux.', to: '/connectors' })
    expect(rows[0].action).toBeNull()
  })

  it('POLISH-SIM-170 : chaque famille toujours montrée a son action quand elle manque de données', () => {
    const rows = influenceFamilies(outcome([f('hrv_ms', 'Variabilité cardiaque', 0.8, { theme: 'body', actionable: false })]))
    expect(Object.fromEntries(rows.map((r) => [r.id, r.action]))).toEqual({
      sleep: { text: 'Il faut vos nuits au moins un jour sur deux.', to: '/connectors' },
      nutrition: { text: 'Notez vos repas au moins un jour sur deux.', to: '/food' },
      activity: { text: 'Il faut vos pas au moins un jour sur deux.', to: '/connectors' },
    })
  })

  it('habitudes et écrans : seulement avec un lien net', () => {
    const quiet = influenceFamilies(outcome([f('habit_a', 'Méditation', 0.4, { theme: 'habit', net: false }), f('screen_minutes', 'Temps d’écran', 0.1, { theme: 'context', net: false })]))
    expect(quiet.map((r) => r.id)).toEqual(['sleep', 'nutrition', 'activity'])
    const rows = influenceFamilies(outcome([f('habit_a', 'Méditation', 0.4, { theme: 'habit' }), f('screen_minutes', 'Temps d’écran', -0.55, { theme: 'context' })]))
    expect(rows.map((r) => [r.id, r.level, r.tone])).toEqual([['screen', 3, 'stone'], ['habit', 2, 'honey'], ['sleep', 0, 'night'], ['nutrition', 0, 'peach'], ['activity', 0, 'lilac']])
  })

  it('le corps et la météo, même nets, n’entrent dans aucune famille', () => {
    const rows = influenceFamilies(outcome([f('hrv_ms', 'Variabilité cardiaque', 0.8, { theme: 'body', actionable: false })]))
    expect(rows.every((r) => r.level === 0)).toBe(true)
  })

  it('REFONTE-6c : le détail d’une famille, ses facteurs par délai prêt et ses liens nets', () => {
    const o = outcome(
      [f('sleepMinutes', 'Sommeil', 0.3), f('screen_late_minutes', 'Écran tard le soir', -0.5, { theme: 'context' }), f('steps', 'Pas', 0.4, { theme: 'activity' })],
      [f('sleepMinutes', 'Sommeil', 0.6), f('sleep_regularity', 'Régularité du coucher', 0.2, { net: false })],
      { beatsPersistence: true },
    )
    const d = familyDetail(o, 'sleep')
    expect([d.id, d.label, d.tone, d.bars]).toEqual(['sleep', 'Sommeil', 'night', true])
    expect(d.horizons.map((x) => [x.id, x.factors.map((y) => y.key)])).toEqual([
      ['short', ['sleepMinutes', 'screen_late_minutes']], ['medium', ['sleepMinutes', 'sleep_regularity']],
    ])
    // Un lien net par facteur, au délai où il est le plus fort, le plus fort d'abord
    expect(d.pistes.map((x) => [x.key, x.effect])).toEqual([['sleepMinutes', 0.6], ['screen_late_minutes', -0.5]])
    expect(d.count).toBe(3)
    // POLISH-SIM-160 : leurs noms, une fois chacun
    expect(d.names).toEqual(['Sommeil', 'Écran tard le soir', 'Régularité du coucher'])
  })

  it('REFONTE-6c : un délai sans facteur de la famille n’apparaît pas ; pas de barres si la méthode ne prévoit pas mieux', () => {
    const d = familyDetail(outcome([f('steps', 'Pas', 0.4, { theme: 'activity' })], [f('sleepMinutes', 'Sommeil', 0.2, { net: false })]), 'activity')
    expect(d.horizons.map((x) => x.id)).toEqual(['short'])
    expect(d.bars).toBe(false)
    expect(d.pistes.map((x) => x.key)).toEqual(['steps'])
  })

  it('REFONTE-6c : rien pour une famille inconnue, avant les résultats, ou sans facteur comparé', () => {
    expect(familyDetail(outcome([f('steps', 'Pas', 0.4, { theme: 'activity' })]), 'corps')).toBeNull()
    expect(familyDetail({ status: 'locked', horizons: {} }, 'sleep')).toBeNull()
    expect(familyDetail(null, 'sleep')).toBeNull()
    expect(familyDetail(outcome([f('steps', 'Pas', 0.4, { theme: 'activity' })]), 'nutrition')).toBeNull()
  })

  it('POLISH-FODMAP-ABSENT : Alimentation nomme les groupes FODMAP pas comparés (aucun repas riche en eux)', () => {
    const n = { theme: 'nutrition' }
    const d = familyDetail(outcome(
      [f('fodmap_lactose', 'Lactose', 0.2, n), f('fodmap_gos', 'GOS', 0.1, { ...n, net: false })],
      [f('fodmap_fructose', 'Fructose en excès', 0.1, n), f('fodmap_sorbitol', 'Sorbitol', 0.1, n), f('fiber_g', 'Fibres', 0.1, n)],
    ), 'nutrition')
    expect(d.fodmapNotCompared).toEqual([
      { id: 'fructans', label: 'Fructanes', hint: 'blé, oignon, ail' },
      { id: 'mannitol', label: 'Mannitol', hint: 'champignons, pois mange-tout' },
    ])
    // Les autres familles n'en parlent pas
    expect(familyDetail(outcome([f('sleepMinutes', 'Sommeil', 0.3)]), 'sleep').fodmapNotCompared).toEqual([])
  })

  it('REFONTE-6c : un effet hors échelle reste dans les barres, jamais dans les liens nets', () => {
    const d = familyDetail(outcome([f('fiber_g', 'Fibres', 3, { theme: 'nutrition', outOfScale: true })]), 'nutrition')
    expect(d.horizons[0].factors).toHaveLength(1)
    expect(d.pistes).toEqual([])
  })
})

describe('REFONTE-6b-2 : la valeur habituelle de chaque famille (SPEC comprendre § 6.3, « Sommeil · 7 h 05 par nuit »)', () => {
  const now = new Date('2026-07-20T10:00:00')
  const day = (n, summary) => {
    const d = new Date(now.getTime() - n * 86_400_000)
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { dateKey, summary }
  }

  it('sommeil et pas : la médiane des 14 jours passés (la même habitude que l’Accueil), repas : le compte sur 14 jours', () => {
    const days = []
    for (let n = 1; n <= 14; n++) days.push(day(n, { sleepMinutes: n <= 7 ? 420 : 430, steps: 8000 + n * 10, meals: n % 2 }))
    days.push(day(0, { sleepMinutes: 300, steps: 500, meals: 2 }))
    const u = familyUsuals(days, now)
    expect(u.sleep).toBe('7 h 05 par nuit')
    expect(u.activity).toMatch(/^8\s?075 pas par jour$/)
    // aujourd'hui compte pour les repas (13 jours passés + aujourd'hui) : 7 impairs entre 1 et 13, plus 2
    expect(u.nutrition).toBe('9 repas en 14 jours')
  })

  it('rien sans 7 jours de mesure, ni sans repas ; les jours plus anciens que 14 jours sont ignorés', () => {
    const days = []
    for (let n = 1; n <= 6; n++) days.push(day(n, { sleepMinutes: 420, steps: 8000, meals: 0 }))
    for (let n = 15; n <= 30; n++) days.push(day(n, { sleepMinutes: 420, steps: 8000, meals: 3 }))
    expect(familyUsuals(days, now)).toEqual({})
    expect(familyUsuals(null, now)).toEqual({})
  })

  it('un seul repas : au singulier', () => {
    expect(familyUsuals([day(2, { meals: 1 })], now)).toEqual({ nutrition: '1 repas en 14 jours' })
  })

  it('REFONTE-6c-3 (SPEC § 6.5, « Vos 14 dernières nuits · en moyenne 7 h 05 ») : la ligne d’en-tête du détail d’une famille', () => {
    const days = []
    for (let n = 1; n <= 14; n++) days.push(day(n, { sleepMinutes: n <= 7 ? 420 : 430, steps: 8000 + n * 10, meals: n % 2 }))
    days.push(day(0, { sleepMinutes: 300, steps: 500, meals: 2 }))
    const p = familyPeriods(days, now)
    expect(p.sleep).toBe('Vos 14 dernières nuits · d’habitude 7 h 05')
    expect(p.activity).toMatch(/^Vos 14 derniers jours · d’habitude 8\s?075 pas par jour$/)
    expect(p.nutrition).toBe('Vos 14 derniers jours · 9 repas notés')
    expect(familyPeriods([day(2, { meals: 1 })], now)).toEqual({ nutrition: 'Vos 14 derniers jours · 1 repas noté' })
    expect(familyPeriods(null, now)).toEqual({})
  })

  it('REFONTE-6c-4 (SPEC § 6.5, « Barres des 14 nuits ») : une barre par jour, de la plus ancienne à la plus récente', () => {
    const days = []
    for (let n = 1; n <= 14; n++) days.push(day(n, { sleepMinutes: n === 3 ? null : 400 + n, steps: 8000 + n, meals: n % 2 }))
    days.push(day(0, { sleepMinutes: 300, steps: 500, meals: 2 }))
    const b = familyBars(days, now)
    // sommeil et pas : les 14 jours passés, comme la valeur habituelle ; aujourd'hui n'est pas fini
    expect(b.sleep.days).toHaveLength(14)
    expect(b.sleep.days[0]).toEqual({ dateKey: days[13].dateKey, value: 414 })
    expect(b.sleep.days[13]).toEqual({ dateKey: days[0].dateKey, value: 401 })
    expect(b.sleep.days[11].value).toBeNull()
    expect(b.sleep.usual).toBe(408)
    expect(b.activity.days.map((d) => d.value)[13]).toBe(8001)
    // repas : 13 jours passés et aujourd'hui, comme « 9 repas notés »
    expect(b.nutrition.days).toHaveLength(14)
    expect(b.nutrition.days[13]).toEqual({ dateKey: days[14].dateKey, value: 2 })
    expect(b.nutrition.days[0].value).toBe(1)
    expect(b.nutrition.usual).toBeNull()
  })

  it('REFONTE-6c-5 (SPEC § 6.5) : point sur les soirs d’écran tard, et les deux moyennes dès 3 nuits de chaque côté', () => {
    const days = []
    // nuits 1 à 4 : écran tard (≥ 30 min après 22 h), 6 h 40 ; nuits 5 à 12 : 7 h 20 ; 13 : écran inconnu ; 14 : 10 min
    for (let n = 1; n <= 14; n++) {
      const late = n <= 4 ? 45 : n === 13 ? undefined : n === 14 ? 10 : 0
      days.push(day(n, { sleepMinutes: n <= 4 ? 400 : 440, ...(late === undefined ? {} : { lateScreenMinutes: late }) }))
    }
    const b = familyBars(days, now).sleep
    expect(b.days[13].late).toBe(true)
    expect(b.days[0].late).toBe(false)
    expect('late' in b.days[1]).toBe(false)
    expect(b.evenings).toEqual({ late: 400, other: 440, lateCount: 4, otherCount: 9, diff: -40 })
  })

  it('REFONTE-6c-5 : pas de moyennes sous 3 nuits d’un côté, ni sur une nuit estimée par le téléphone (lien circulaire)', () => {
    const days = []
    for (let n = 1; n <= 14; n++) {
      days.push(day(n, { sleepMinutes: 420, sleepEstimated: n <= 3, lateScreenMinutes: n <= 4 ? 60 : 0 }))
    }
    const b = familyBars(days, now).sleep
    // nuits 1 à 3 estimées par le téléphone : seule la nuit 4 reste parmi les soirs d'écran tard
    expect(b.evenings).toBeNull()
    expect(b.days[13].late).toBe(true)
    expect(familyBars(days, now).activity).toBeUndefined()
  })

  it('REFONTE-6c-5 : la phrase des deux moyennes', () => {
    expect(eveningsText({ late: 400, other: 440, lateCount: 4, otherCount: 9, diff: -40 })).toEqual({
      late: 'Soirs avec écran après 22 h : 6 h 40',
      other: 'Autres soirs : 7 h 20',
      diff: '−40 min',
      note: 'Observé sur 13 nuits : un lien, pas une preuve.',
    })
    expect(eveningsText({ late: 450, other: 440, lateCount: 3, otherCount: 3, diff: 10 }).diff).toBe('+10 min')
    expect(eveningsText({ late: 440, other: 440, lateCount: 3, otherCount: 3, diff: 0 }).diff).toBe('pas d’écart')
    expect(eveningsText(null)).toBeNull()
  })

  it('pas de barres sans la ligne d’en-tête (rien sans mesure)', () => {
    expect(familyBars([day(2, { meals: 1 })], now)).toEqual({ nutrition: { days: expect.any(Array), usual: null } })
    expect(Object.keys(familyBars(null, now))).toEqual([])
  })
})
