/**
 * TS-2 — Changements durables de toutes les courbes, depuis les entrées (séparé de changes.js, qui reste pur et que
 * la méthode d'Analyses importe sans cycle).
 */
import { buildAnalysisMatrix } from '../analysisResults'
import { estimateStatesFromEntries } from './stateSpace'
import { localDateKey } from '../analysisEngine'
import { CHANGE_METRICS, detectChanges } from './changes'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/**
 * Changements de toutes les courbes suivies, depuis les entrées. Bien-être et confort digestif : l'estimation TS-1
 * (digestionOwn, les jours où une information digestive existe ; jamais déduite du bien-être) ; les autres : les
 * valeurs du jour.
 * @returns {Record<string, Array>} clé → changements (liste vide si rien)
 */
export function changesFromEntries(entries, { now = new Date() } = {}) {
  const today = localDateKey(now.toISOString())
  const out = Object.fromEntries(CHANGE_METRICS.map((m) => [m.key, []]))
  const states = estimateStatesFromEntries(entries, { now, ahead: 0 })
  if (states) {
    const past = states.days.filter((d) => !d.future)
    out.wellbeing = detectChanges(new Map(past.filter((d) => d.observed.wellbeing).map((d) => [d.date, d.wellbeing.mean])))
    out.digestion = detectChanges(new Map(past.filter((d) => d.observed.digestion).map((d) => [d.date, d.digestionOwn.mean])))
  }
  const { days } = buildAnalysisMatrix(entries)
  for (const m of CHANGE_METRICS) {
    if (m.key === 'wellbeing' || m.key === 'digestion') continue
    const s = new Map([...days].filter(([dk, v]) => dk <= today && isNum(v[m.key])).map(([dk, v]) => [dk, v[m.key]]))
    out[m.key] = detectChanges(s)
  }
  return out
}
