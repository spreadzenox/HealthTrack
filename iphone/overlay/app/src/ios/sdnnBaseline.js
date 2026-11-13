/**
 * Version iOS (HealthTrack-iOS) — norme personnelle de la VFC de l'app Santé. L'iPhone mesure la VFC en SDNN, pas
 * en RMSSD comme Android (`journal/RECHERCHE.md`) : elle est rangée à part (`heartRateVariabilitySdnn`) et sa norme
 * se calcule à part, avec la même méthode que la VFC d'Android (`baselines.js` : échelle log, 60 jours de norme,
 * 7 jours récents). Une observation, jamais un diagnostic, comme les autres normes.
 */
import { BASELINE_METRICS } from '../services/baselines'
import { DISTRIBUTION } from '../config/distribution'

export const SDNN_BASELINE = { ...BASELINE_METRICS.heartRateVariability, key: 'heartRateVariabilitySdnn', label: 'VFC (SDNN)' }

/** Normes propres à l'iPhone, en plus de celles d'Android (aucune ailleurs : les tests d'Android n'en voient pas). */
export const iosBaselineMetrics = (distribution = DISTRIBUTION) => (distribution === 'appstore' ? [SDNN_BASELINE] : [])

/** Axe « VFC » du radar : la SDNN sur iPhone (comparée à la norme de la personne, comme la RMSSD sur Android). */
export const radarHrvMetric = (distribution = DISTRIBUTION) =>
  distribution === 'appstore' ? SDNN_BASELINE : BASELINE_METRICS.heartRateVariability
