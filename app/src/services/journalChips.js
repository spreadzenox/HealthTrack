import { weatherSummaryParts } from './weather'
import { formatScreenMinutes } from './phoneUsage'
import { formatDuration } from '../utils/format'
import { appLocale } from '../i18n/locale.js'

const frNumber = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: 1 })

/**
 * Pastel de chaque mesure du résumé (POL-6, palette de journal/DESIGN.md) : menthe = corps et bien-être, pêche = repas
 * (le ventre), lilas = ce qu'on fait et ce qui entoure la journée (pas, dépense, écran, météo : une tuile neutre
 * paraissait noire en thème sombre, POL-PLAY-27).
 */
const CHIP_THEMES = {
  Pas: 'lilac',
  Dépense: 'lilac',
  Écran: 'lilac',
  'Réseaux sociaux': 'lilac',
  Repas: 'peach',
  Météo: 'lilac',
}

export function chipTheme(label) {
  return CHIP_THEMES[label] || (/ repas$/.test(label) ? 'peach' : 'mint')
}

/**
 * Plage du score de stress de la montre (1–99), avec les mots de l'échelle de la montre elle-même (1–29 détendu,
 * 30–59 normal, 60–79 moyen, 80–99 élevé) : « 37 / 99 » déroutait (POL-PLAY-15). Une description, pas un jugement.
 */
export function watchStressBand(score) {
  if (score < 30) return 'détendu'
  if (score < 60) return 'normal'
  if (score < 80) return 'moyen'
  return 'élevé'
}

/** Résumé chiffré d'une journée : seules les valeurs disponibles sont affichées. */
export function summaryChips(s) {
  const chips = []
  const fr = (v) => v.toLocaleString(appLocale())
  if (s.sleepMinutes != null) chips.push([s.sleepEstimated ? 'Sommeil (estimé)' : 'Sommeil', formatDuration(s.sleepMinutes)])
  if (s.steps != null) chips.push(['Pas', fr(Math.round(s.steps))])
  if (s.restingHr != null) chips.push(['FC au repos', `${Math.round(s.restingHr)} bpm`])
  if (s.hrv != null) chips.push(['VFC nuit', `${Math.round(s.hrv)} ms`])
  if (s.hrvDay != null) chips.push(['VFC jour', `${s.hrvDay} ms`])
  if (s.spo2 != null) chips.push(['SpO₂', `${frNumber(s.spo2)} %`])
  if (s.respiratoryRate != null) chips.push(['Respiration', `${frNumber(s.respiratoryRate)} /min`])
  if (s.temperatureC != null) chips.push(['Température', `${frNumber(s.temperatureC)} °C`])
  if (s.skinTempC != null) chips.push(['Temp. peau', `${frNumber(s.skinTempC)} °C`])
  if (s.watchStress != null) chips.push(['Stress montre', `${s.watchStress} · ${watchStressBand(s.watchStress)}`])
  if (s.bloodPressure) chips.push(['Tension', `${s.bloodPressure.systolic}/${s.bloodPressure.diastolic} mmHg`])
  if (s.glucoseMgDl != null) {
    chips.push(['Glycémie', `${(s.glucoseMgDl / 100).toLocaleString(appLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/L`])
  }
  if (s.heartRate) {
    const { min, max } = s.heartRate
    chips.push(['FC', min === max ? `${Math.round(min)} bpm` : `${Math.round(min)} à ${Math.round(max)} bpm`])
  }
  if (s.burnedKcal != null) chips.push(['Dépense', `${fr(s.burnedKcal)} kcal`])
  // Une seule note, ou des cigarettes : déjà lisibles dans les lignes du jour, juste en dessous
  if (s.wellbeing?.count > 1) chips.push(['Bien-être', `${frNumber(s.wellbeing.average)} / 5`])
  if (s.meals > 0) {
    // Le nombre passe dans le titre (« 3 repas ») : la valeur tient sur une ligne (POL-PLAY-8)
    if (s.mealKcal > 0) chips.push([s.meals > 1 ? `${s.meals} repas` : 'Repas', `≈\u00a0${fr(s.mealKcal)}\u00a0kcal`])
    else chips.push(['Repas', String(s.meals)])
  }
  if (s.screenMinutes != null) chips.push(['Écran', formatScreenMinutes(s.screenMinutes)])
  if (s.socialMinutes > 0) chips.push(['Réseaux sociaux', formatScreenMinutes(s.socialMinutes)])
  if (s.weather) {
    const w = weatherSummaryParts(s.weather)
    if (w.length) chips.push(['Météo', w[0]])
  }
  return chips
}
