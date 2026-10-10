/**
 * Générateur déterministe de données de démo réalistes pour la vérification visuelle.
 *
 * Les séries sont corrélées (sommeil, pas, cigarettes → bien-être) pour que
 * les pages Recommandations / Tableau de bord affichent des résultats crédibles.
 * Les payloads reprennent exactement les formats écrits par les connecteurs.
 */

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MEALS = [
  [
    { ingredient: 'Yaourt nature', quantity_g: 125 },
    { ingredient: 'Banane, chair sans peau, crue', quantity_g: 120 },
    { ingredient: 'Café, non instantané, sans sucres ajoutés, prêt à boire', quantity_g: 150 },
  ],
  [
    { ingredient: 'Riz blanc cuit', quantity_g: 180 },
    { ingredient: 'Saumon, cuit à la vapeur', quantity_g: 130 },
    { ingredient: "Brocoli, bouilli/cuit à l'eau (aliment moyen)", quantity_g: 100 },
  ],
  [
    { ingredient: "Poulet, cuisse, viande bouillie/cuite à l'eau", quantity_g: 150 },
    { ingredient: "Pomme de terre, bouillie/cuite à l'eau", quantity_g: 200 },
    { ingredient: 'Haricot vert, cuit', quantity_g: 120 },
  ],
  [
    { ingredient: 'Oeuf brouillé, avec matière grasse', quantity_g: 120 },
    { ingredient: 'Haricot vert, cuit', quantity_g: 80 },
  ],
]

const toItems = (meal) =>
  meal.map((it) => ({ ...it, quantity: `${Math.round(it.quantity_g)} g` }))

function at(day, hours, minutes = 0) {
  const d = new Date(day)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

/**
 * @param {{ days?: number, seed?: number, now?: Date, illness?: boolean }} [opts]
 *   illness : simule un début d'infection les 3 derniers jours (FC repos ↑, VFC ↓, sommeil ↓)
 *   pour voir le « Radar forme » en alerte.
 * @returns {Array<{ type: string, source: string, at: string, payload: object }>}
 */
export function generateDemoEntries({ days = 75, seed = 42, now = new Date(), illness = false } = {}) {
  const rand = mulberry32(seed)
  const noise = (amp) => (rand() - 0.5) * 2 * amp
  const entries = []
  let weight = 78.4
  // Tags de comportements : RNG séparé pour ne pas décaler les autres séries.
  // Utilisés depuis 40 jours seulement (comme un utilisateur qui découvre la fonction).
  const tagRand = mulberry32(seed + 1000)
  let prevTags = []

  for (let i = days; i >= 0; i--) {
    const day = new Date(now)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - i)
    const weekend = day.getDay() === 0 || day.getDay() === 6

    const sick = illness && i <= 2
    const sleepMin = Math.round(420 + noise(70) + (weekend ? 40 : 0)) - (sick ? 80 : 0)
    const steps = Math.max(1500, Math.round(8000 + noise(4500) + (weekend ? -1500 : 0)))
    const cigarettes = Math.max(0, Math.round(4 - (days - i) / 25 + noise(3)))
    const restingHr = Math.round(62 - (sleepMin - 420) / 40 + cigarettes * 0.4 + noise(3)) + (sick ? 9 : 0)
    const hrv = Math.round(48 + (sleepMin - 420) / 8 - cigarettes + noise(6)) - (sick ? 12 : 0)

    const bedtime = new Date(day)
    bedtime.setDate(bedtime.getDate() - 1)
    bedtime.setHours(23, Math.round(rand() * 50), 0, 0)
    const wake = new Date(bedtime.getTime() + sleepMin * 60000)
    entries.push({
      type: 'sleep',
      source: 'health_connect',
      at: bedtime.toISOString(),
      payload: { durationMinutes: sleepMin, endDate: wake.toISOString(), unit: 'minute', sleepState: 'asleep', connector: 'health_connect' },
    })

    if (i === 0) continue // aujourd'hui : journée en cours, seulement le sommeil de la nuit

    entries.push({
      type: 'steps',
      source: 'health_connect',
      at: at(day, 0),
      payload: { value: steps, unit: 'count', period: 'day', endDate: at(day, 23, 59), connector: 'health_connect' },
    })
    entries.push({
      type: 'calories',
      source: 'health_connect',
      at: at(day, 0),
      payload: { value: Math.round(1900 + steps * 0.045 + noise(120)), unit: 'kcal', period: 'day', endDate: at(day, 23, 59), connector: 'health_connect' },
    })
    entries.push({
      type: 'heart_rate',
      source: 'health_connect',
      at: at(day, 7),
      payload: { bpm: restingHr, unit: 'bpm', subtype: 'restingHeartRate', connector: 'health_connect' },
    })
    for (const h of [9, 14, 19]) {
      entries.push({
        type: 'heart_rate',
        source: 'health_connect',
        at: at(day, h),
        payload: { bpm: Math.round(restingHr + 15 + noise(12)), unit: 'bpm', subtype: 'heartRate', connector: 'health_connect' },
      })
    }
    entries.push({
      type: 'heart_rate',
      source: 'health_connect',
      at: at(day, 6, 30),
      payload: { value: hrv, unit: 'ms', subtype: 'heartRateVariability', connector: 'health_connect' },
    })
    if (rand() < 0.35) {
      entries.push({
        type: 'activity',
        source: 'health_connect',
        at: at(day, 18),
        payload: { workoutType: rand() < 0.5 ? 'running' : 'cycling', durationSeconds: 1800 + Math.round(rand() * 1800), totalCalories: Math.round(250 + rand() * 250), totalDistanceMeters: Math.round(4000 + rand() * 6000), endDate: at(day, 19), connector: 'health_connect' },
      })
    }
    for (let c = 0; c < cigarettes; c++) {
      entries.push({ type: 'cigarette', source: 'app_cigarette', at: at(day, 9 + c * 2, 10 + c), payload: { count: 1 } })
    }
    const mealCount = rand() < 0.7 ? 2 : 1
    for (let m = 0; m < mealCount; m++) {
      const meal = MEALS[Math.floor(rand() * MEALS.length)]
      entries.push({ type: 'food', source: 'app_food', at: at(day, m === 0 ? 12 : 20, 15), payload: { items: toItems(meal), provider: 'gemini' } })
    }
    if (i % 3 === 0) {
      weight += noise(0.4) - 0.05
      const fat = 22 + noise(0.8)
      const body = { valueKg: +weight.toFixed(1), fatRatioPct: +fat.toFixed(1), muscleMassKg: +(weight * 0.42).toFixed(1) }
      entries.push({ type: 'weight', source: 'withings', at: at(day, 7, 30), payload: body })
      entries.push({ type: 'body_composition', source: 'withings', at: at(day, 7, 30), payload: body })
    }

    const tags = []
    if (i <= 40) {
      // Alcohol mostly on Friday / Saturday evenings (the next day is a week-end day).
      const beforeWeekend = day.getDay() === 5 || day.getDay() === 6
      if (tagRand() < (beforeWeekend ? 0.6 : 0.1)) tags.push('alcohol')
      if (tagRand() < 0.3) tags.push('late_screen')
      if (tagRand() < 0.2) tags.push('stress')
      if (tagRand() < 0.25) tags.push('coffee_late')
      if (i === 12 || i === 13) tags.push('sick')
    }
    const score =
      2.6 +
      (sleepMin - 420) / 60 +
      (steps - 8000) / 6000 -
      cigarettes * 0.15 -
      (prevTags.includes('alcohol') ? 0.8 : 0) -
      (prevTags.includes('late_screen') ? 0.3 : 0) -
      (tags.includes('stress') ? 0.9 : 0) -
      (tags.includes('sick') ? 1.5 : 0) +
      (weekend ? 0.4 : 0) +
      noise(0.6)
    entries.push({
      type: 'wellbeing',
      source: 'app_wellbeing',
      at: at(day, 21, 30),
      payload: { score: Math.max(0, Math.min(5, Math.round(score))), ...(tags.length > 0 && { tags }) },
    })
    prevTags = tags
  }

  return entries
}
