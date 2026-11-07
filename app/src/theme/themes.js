/**
 * Une couleur par thème, partout (leçon 12 du propriétaire, journal/DESIGN.md § 9 ; AUJ-8) : le nom du pastel de
 * chaque thème, tel que l'utilisent les tokens (`--mint-bg`, `--night-label`…) et l'attribut `data-tone`.
 * Une mesure, une analyse ou une source prend la couleur de son thème, sur tous les écrans.
 */
export const THEME_TONES = {
  wellbeing: 'mint', // vert = bien-être
  digestion: 'peach', // orange = digestion et nutrition
  activity: 'lilac', // lilas = activité et sport
  sleep: 'night', // bleu nuit = sommeil
  body: 'rose', // rose framboise = corps (FC, VFC, respiration, température, stress)
  context: 'stone', // gris neutre = contexte (écran, météo)
}

/** Thème de chaque mesure (clés des résumés du jour, des écarts et des facteurs d'analyse). */
const MEASURE_THEMES = {
  wellbeing: 'wellbeing', mood: 'wellbeing', face: 'wellbeing',
  gut: 'digestion', stool: 'digestion', meals: 'digestion', meal: 'digestion', kcal: 'digestion', nutrition: 'digestion',
  steps: 'activity', burnedKcal: 'activity', activeMinutes: 'activity', exercise: 'activity', distance: 'activity',
  sleep: 'sleep', sleepMinutes: 'sleep', watchSleepScore: 'sleep', bedtime: 'sleep',
  hrv: 'body', hrvDay: 'body', restingHr: 'body', sleepHr: 'body', heartRate: 'body', spo2: 'body',
  respiratoryRate: 'body', temperatureC: 'body', skinTempC: 'body', watchStress: 'body', stress: 'body',
  bloodPressure: 'body', glucoseMgDl: 'body', weight: 'body',
  screen: 'context', screenMinutes: 'context', socialMinutes: 'context', weather: 'context', phone: 'context',
}

/** Thème d'une mesure ; `context` pour une mesure inconnue (jamais une couleur qui laisserait croire à un autre thème). */
export function measureTheme(key) {
  return MEASURE_THEMES[key] ?? 'context'
}

/** Pastel (`mint`, `peach`…) d'une mesure. */
export function measureTone(key) {
  return THEME_TONES[measureTheme(key)]
}
