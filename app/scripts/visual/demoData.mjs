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
  // Séance de sport la veille → un peu mieux le lendemain (effet décalé, section « Effets décalés »).
  let prevWorkout = false
  // Montre oubliée ou déchargée ~1 jour sur 8 (pas de nuit, de FC ni de VFC ; le téléphone compte
  // toujours les pas). RNG séparé ; jamais sur les 4 derniers jours (cartes du tableau de bord stables).
  const watchRand = mulberry32(seed + 2000)
  // Repas pas saisis ~1 jour sur 9, plus souvent après une courte nuit (on note moins quand on est
  // fatigué) : l'alimentation n'agit pas sur le bien-être dans la démo, un lien serait un artefact.
  // RNG séparé ; jamais sur les 4 derniers jours.
  const mealRand = mulberry32(seed + 3000)
  // Météo (Open-Meteo, journées terminées seulement) : RNG séparé ; une chute de pression d'au moins
  // 5 hPa en un jour retire un peu de bien-être (utilisateur « sensible à la météo »). Graine choisie pour
  // éviter une corrélation fortuite pollen / pollution (la graine 4000 en donnait une, artefact du hasard).
  const weatherRand = mulberry32(seed + 4003)
  const phoneRand = mulberry32(seed + 5009)
  // Lecture du visage (consigne du 19/10 au soir) : rafales du déverrouillage des 30 derniers jours (assez pour les Analyses « humeur estimée »), un sourire qui
  // suit un peu la note du jour ; RNG séparé. Jamais d'image, seulement les indices (format de FaceRecord.java).
  const faceRand = mulberry32(seed + 6007)
  // Les 3 derniers jours portent aussi la valence / l'éveil du modèle embarqué (étape 2, téléchargé depuis peu).
  const expressions = (score, f) => {
    const raw = {
      exHappiness: Math.max(0.02, 0.25 + 0.12 * (score - 2.6) + f() * 2), exNeutral: 0.5 + f() * 2,
      exSurprise: 0.06, exSadness: Math.max(0.01, 0.07 - 0.03 * (score - 2.6)), exAnger: 0.03, exFear: 0.02,
      exDisgust: 0.02, exContempt: 0.03,
    }
    const sum = Object.values(raw).reduce((s, v) => s + v, 0)
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v / sum]))
  }
  const pushFaceBursts = (day, score, withAffect = false) => {
    for (const h of [8, 10, 13, 16, 19]) {
      const t = at(day, h, Math.floor(faceRand() * 50))
      if (Date.parse(t) > now.getTime()) continue
      const f = () => (faceRand() - 0.5) * 0.08
      const valid = faceRand() < 0.15 ? 2 : 3
      entries.push({
        type: 'face_burst',
        source: 'face_sense',
        at: t,
        payload: {
          v: 1, trigger: 'unlock', frames: 3, valid,
          values: {
            smile: Math.max(0, 0.12 + 0.06 * (score - 2.6) + f()), duchenne: Math.max(0, 0.06 + 0.03 * (score - 2.6) + f() / 2),
            browDown: 0.2 + f(), browInnerUp: 0.1 + f(), mouthFrown: Math.max(0, 0.05 + f() / 2), eyeOpen: 0.78 + f(),
            jawOpen: 0.05, asymmetry: 0.02, yaw: Math.round(faceRand() * 12),
            // Lumière du visage (I127b) : correcte le jour, pénombre à 19 h (lecture comptée un peu moins).
            light: h === 19 ? 0.22 : 0.48,
            // Duo B0 + MobileFaceNet (I126) : moyenne des deux et leur écart de valence, souvent faible.
            ...(withAffect ? { valence: 0.1 + 0.15 * (score - 2.6) + f() * 2, arousal: -0.1 + f() * 3, affectFrames: valid, affectGap: 0.08 + Math.abs(f()), affectModels: 2 } : {}),
            // Probabilités des 8 expressions (POL-2, FaceAffect.EXPRESSIONS) : surtout neutre et joie, qui suit la note.
            ...(withAffect ? expressions(score, f) : {}),
          },
          rejected: valid < 3 ? { turned: 1 } : {},
        },
      })
    }
  }
  // Ventre (accueil « Aujourd'hui ») : une ou deux notes par jour sur les 10 derniers jours ; RNG séparé.
  const gutRand = mulberry32(seed + 7001)
  const GUT = ['calm', 'calm', 'calm', 'discomfort', 'discomfort', 'pain']
  let pressure = 1016

  for (let i = days; i >= 0; i--) {
    const day = new Date(now)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - i)
    const weekend = day.getDay() === 0 || day.getDay() === 6

    const sick = illness && i <= 2
    const prevPressure = pressure
    pressure = Math.round((pressure + (1015 - pressure) * 0.25 + (weatherRand() - 0.5) * 14) * 10) / 10
    const sleepMin = Math.round(420 + noise(70) + (weekend ? 40 : 0)) - (sick ? 80 : 0)
    const steps = Math.max(1500, Math.round(8000 + noise(4500) + (weekend ? -1500 : 0)))
    const cigarettes = Math.max(0, Math.round(4 - (days - i) / 25 + noise(3)))
    const restingHr = Math.round(62 - (sleepMin - 420) / 40 + cigarettes * 0.4 + noise(3)) + (sick ? 9 : 0)
    const hrv = Math.round(48 + (sleepMin - 420) / 8 - cigarettes + noise(6)) - (sick ? 12 : 0)

    const watchOff = watchRand() < 0.12 && i > 3

    const bedtime = new Date(day)
    bedtime.setDate(bedtime.getDate() - 1)
    bedtime.setHours(23, Math.round(rand() * 50) + (weekend ? 45 : 0), 0, 0) // couché plus tard le week-end
    const wake = new Date(bedtime.getTime() + sleepMin * 60000)
    if (!watchOff) {
      entries.push({
        type: 'sleep',
        source: 'health_connect',
        at: bedtime.toISOString(),
        payload: { durationMinutes: sleepMin, endDate: wake.toISOString(), unit: 'minute', sleepState: 'asleep', connector: 'health_connect', sourceName: 'Gadgetbridge' },
      })
    }

    if (i === 0) pushFaceBursts(day, 3, true)
    if (i === 0) continue // aujourd'hui : journée en cours, seulement le sommeil de la nuit

    entries.push({
      type: 'steps',
      source: 'health_connect',
      at: at(day, 0),
      payload: { value: steps, unit: 'count', period: 'day', endDate: at(day, 23, 59), connector: 'health_connect', sourceName: 'Gadgetbridge' },
    })
    entries.push({
      type: 'calories',
      source: 'health_connect',
      at: at(day, 0),
      payload: { value: Math.round(1900 + steps * 0.045 + noise(120)), unit: 'kcal', period: 'day', endDate: at(day, 23, 59), connector: 'health_connect', sourceName: 'Gadgetbridge' },
    })
    const watchEntries = [{
      type: 'heart_rate',
      source: 'health_connect',
      at: at(day, 7),
      payload: { bpm: restingHr, unit: 'bpm', subtype: 'restingHeartRate', connector: 'health_connect', sourceName: 'Gadgetbridge' },
    }]
    for (const h of [9, 14, 19]) {
      watchEntries.push({
        type: 'heart_rate',
        source: 'health_connect',
        at: at(day, h),
        payload: { bpm: Math.round(restingHr + 15 + noise(12)), unit: 'bpm', subtype: 'heartRate', connector: 'health_connect', sourceName: 'Gadgetbridge' },
      })
    }
    watchEntries.push({
      type: 'heart_rate',
      source: 'health_connect',
      at: at(day, 6, 30),
      payload: { value: hrv, unit: 'ms', subtype: 'heartRateVariability', connector: 'health_connect', sourceName: 'Gadgetbridge' },
    })
    // VFC de journée de la montre Huawei en direct (M2, `during: 'day'`) ; valeurs déterministes (pas de tirage)
    for (const [h, delta] of [[10, -14], [16, -9]]) {
      watchEntries.push({
        type: 'heart_rate',
        source: 'huawei_watch',
        at: at(day, h, 3),
        payload: { value: Math.max(15, hrv + delta), unit: 'ms', subtype: 'heartRateVariability', during: 'day', watchClass: 500044, connector: 'huawei_watch', sourceName: 'Montre Huawei' },
      })
    }
    // Température de la peau au poignet (montre Huawei en direct, M3, `subtype: 'skin'`) ; valeurs déterministes
    for (const [h, t] of [[2, 33.4], [5, 33.9]]) {
      watchEntries.push({
        type: 'body_temperature',
        source: 'huawei_watch',
        at: at(day, h, 10),
        payload: { valueC: t, subtype: 'skin', site: 'wrist', watchClass: 400012, connector: 'huawei_watch', sourceName: 'Montre Huawei' },
      })
    }
    // Stress calculé par la montre Huawei en direct (M4, `watch_stress`) ; valeurs déterministes
    for (const [h, v] of [[11, 28], [17, 46]]) {
      watchEntries.push({
        type: 'watch_stress',
        source: 'huawei_watch',
        at: at(day, h, 20),
        payload: { value: v, unit: 'score', level: v < 30 ? 1 : 2, connector: 'huawei_watch', sourceName: 'Montre Huawei' },
      })
    }
    // Respiration et température de nuit (montre via Gadgetbridge → Health Connect) ; valeurs
    // déterministes pour ne pas décaler le tirage aléatoire des autres données de démo.
    watchEntries.push({
      type: 'respiratory_rate',
      source: 'health_connect',
      at: at(day, 4),
      payload: { value: 13.6 + ((i * 7) % 5) / 5, unit: 'rpm', connector: 'health_connect', sourceName: 'Gadgetbridge' },
    }, {
      type: 'body_temperature',
      source: 'health_connect',
      at: at(day, 4),
      payload: { valueC: 36.3 + ((i * 3) % 4) / 10, connector: 'health_connect', sourceName: 'Gadgetbridge' },
    })
    if (!watchOff) entries.push(...watchEntries)
    const workout = rand() < 0.35
    if (workout) {
      entries.push({
        type: 'activity',
        source: 'health_connect',
        at: at(day, 18),
        payload: { workoutType: rand() < 0.5 ? 'running' : 'cycling', durationSeconds: 1800 + Math.round(rand() * 1800), totalCalories: Math.round(250 + rand() * 250), totalDistanceMeters: Math.round(4000 + rand() * 6000), endDate: at(day, 19), connector: 'health_connect', sourceName: 'Gadgetbridge' },
      })
    }
    if (i === 1) {
      // Séance synthétique de la montre (M7) : courbe de FC minute par minute et allures au km, sans tirage aléatoire.
      const bpm = Array.from({ length: 32 }, (_, m) => Math.round(118 + 30 * Math.min(1, m / 8) + 6 * Math.sin(m / 3)))
      entries.push({
        type: 'activity',
        source: 'huawei_watch',
        at: at(day, 7, 30),
        payload: { workoutType: 'running', durationSeconds: 1920, totalCalories: 330, totalDistanceMeters: 5600, steps: 5100, minHeartRate: 104, maxHeartRate: 162, avgHeartRate: 143, heartRateCurve: { stepSeconds: 60, bpm }, paceSplitsSecPerKm: [352, 340, 334, 329, 331], endDate: at(day, 8, 2), connector: 'huawei_watch', sourceName: 'Montre Huawei' },
      })
    }
    for (let c = 0; c < cigarettes; c++) {
      entries.push({ type: 'cigarette', source: 'app_cigarette', at: at(day, 9 + c * 2, 10 + c), payload: { count: 1 } })
    }
    const mealCount = rand() < 0.7 ? 2 : 1
    const mealsForgotten = mealRand() < (sleepMin < 390 ? 0.35 : 0.06) && i > 3
    for (let m = 0; m < mealCount; m++) {
      const meal = MEALS[Math.floor(rand() * MEALS.length)]
      if (!mealsForgotten) entries.push({ type: 'food', source: 'app_food', at: at(day, m === 0 ? 12 : 20, 15), payload: { items: toItems(meal), provider: 'gemini' } })
    }
    if (i <= 9) {
      for (const h of gutRand() < 0.5 ? [10] : [10, 17]) {
        const t = at(day, h, Math.floor(gutRand() * 50))
        if (Date.parse(t) <= now.getTime()) entries.push({ type: 'gut', source: 'app_gut', at: t, payload: { level: GUT[Math.floor(gutRand() * GUT.length)] } })
      }
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
      (prevWorkout ? 0.35 : 0) +
      (weekend ? 0.4 : 0) -
      (pressure - prevPressure <= -5 ? 0.6 : 0) + // chute de pression : un peu moins bien (sensibilité météo)
      noise(0.6)
    entries.push({
      type: 'wellbeing',
      source: 'app_wellbeing',
      at: at(day, 21, 30),
      payload: { score: Math.max(0, Math.min(5, Math.round(score))), ...(tags.length > 0 && { tags }) },
    })
    if (i <= 29) pushFaceBursts(day, score, i <= 2)
    prevTags = tags
    prevWorkout = workout

    if (i >= 1) {
      const tMax = Math.round((17 - (days - i) * 0.06 + (weatherRand() - 0.5) * 6) * 10) / 10
      const sunny = weatherRand()
      const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      entries.push({
        type: 'weather',
        source: 'open_meteo',
        at: at(day, 12),
        payload: {
          date,
          tempMaxC: tMax,
          tempMinC: Math.round((tMax - 7 - weatherRand() * 3) * 10) / 10,
          precipMm: sunny < 0.35 ? Math.round(weatherRand() * 80) / 10 : 0,
          sunshineH: Math.round(sunny * 9 * 10) / 10,
          pressureHpa: pressure,
          pressureChangeHpa: Math.round((pressure - prevPressure) * 10) / 10,
          humidityPct: Math.round(65 + (1 - sunny) * 25),
          aqi: Math.round(15 + weatherRand() * 30),
          pollen: { grass: Math.round(weatherRand() * 15) },
          pollenMax: null,
          place: 'Paris',
          connector: 'open_meteo',
        },
      })
      const last = entries[entries.length - 1].payload
      last.pollenMax = last.pollen.grass
    }

    if (i >= 1) {
      // Téléphone (temps d'écran) : journées terminées.
      const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      entries.push({
        type: 'phone_usage',
        source: 'phone',
        at: at(day, 12),
        payload: {
          date,
          screenMinutes: Math.round(120 + phoneRand() * 140),
          lateScreenMinutes: Math.round(20 + phoneRand() * 70),
          unlocks: Math.round(35 + phoneRand() * 40),
          sleepEstimate: null,
        },
      })
    }

    // Fuseau horaire du jour (« Voyage » déduit) : quatre courts séjours à Londres.
    const abroad = [[10, 11], [30, 32], [50, 52], [65, 66]].some(([from, to]) => i >= from && i <= to)
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    entries.push({
      type: 'context',
      source: 'app_context',
      at: at(day, 12),
      payload: { date: dateKey, tz: abroad ? 'Europe/London' : 'Europe/Paris', tzOffset: abroad ? 60 : 120 },
    })
  }

  return entries
}
