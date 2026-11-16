/**
 * Le monde de Pilou (lot MONDE, étape 13 du brief : Compagnon 5) : le cycle du jour sur la lumière dorée, la météo
 * sur l'îlot, la croissance au fil des semaines, le widget et les notifications. Rien que des fonctions pures et
 * testées ; la scène (app/src/companion/scene/) les consomme par le contrat (app/src/companion/CONTRAT.md) et ce
 * dossier n'écrit jamais dans le sien.
 */
import { lightAt, worldDayKey, LIGHT_FADE_MS } from './daylight.js'
import { weatherDecor } from './weather.js'
import { islandGrowth, seasonOf } from './growth.js'

export * from './daylight.js'
export * from './weather.js'
export * from './growth.js'
export * from './widget.js'

/**
 * Tout l'état du monde à un instant : lumière, météo, croissance, saison, et l'étiquette en bas à gauche de l'îlot
 * (specs/ile.SPEC.md § 0 : la météo, l'heure et le sommeil de Pilou sont toujours écrits). La nuit, l'étiquette dit
 * que Pilou dort ; sinon elle dit la météo s'il y en a une.
 *
 * @param {object} p
 * @param {Date} [p.now]
 * @param {object|null} [p.weather] météo du moment (weatherSync › current)
 * @param {number} [p.usageDays] jours où quelque chose a été noté
 * @param {number|null} [p.latitude] position arrondie de la météo, pour l'hémisphère
 * @param {number} [p.wakeMinute] lever habituel (minute du jour), sinon 7 h
 * @param {number} [p.bedMinute] coucher habituel, sinon 22 h 30
 * @param {boolean} [p.reducedMotion]
 * @param {string} [p.name] le nom choisi pour Pilou
 */
export function worldState({
  now = new Date(),
  weather = null,
  usageDays = 0,
  latitude = null,
  wakeMinute,
  bedMinute,
  reducedMotion = false,
  name = 'Pilou',
} = {}) {
  const light = lightAt(now, { wakeMinute, bedMinute })
  const decor = weatherDecor(weather, { night: light.night, reducedMotion, now })
  const growth = islandGrowth(usageDays)
  const season = seasonOf(now, latitude)
  const who = String(name || 'Pilou').trim() || 'Pilou'
  const label = light.asleep ? `${who} dort. Le reste peut attendre demain.` : decor.label
  return {
    day: worldDayKey(now),
    light,
    weather: decor,
    growth,
    season,
    label,
    // toutes les lignes utiles, la première en tête (la nuit : le sommeil de Pilou, puis la météo)
    labels: [label, light.asleep ? decor.label : null].filter(Boolean),
    lightFadeMs: reducedMotion ? LIGHT_FADE_MS : 2000,
  }
}
