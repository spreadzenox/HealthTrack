import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'
import { stripComments } from './wordingRules.js'
import { TREND_MEASURES } from '../services/trendsData'
import { BASELINE_METRICS } from '../services/baselines'
import { FACTORS } from '../services/analysisResults'
import { summaryChips } from '../services/journalChips'
import { READ_TYPE_LABELS } from '../connectors/HealthConnectConnector'

/**
 * POLISH-SIM-86 : le Journal disait « SpO₂ » et « FC au repos », Sources « oxygène du sang » et « cœur au repos » :
 * une persona n'y voyait pas les mêmes mesures. Un seul nom dans les textes visibles, celui de Sources.
 */
const SRC = join(process.cwd(), 'src')
// Journal technique de la montre (mode diagnostic caché) : pas un texte de l'app
const ALLOWED = new Set(['devices/huawei/sync.js'])

function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'changelog' && name !== '__mocks__') sources(p, out)
    } else if (/\.(js|jsx)$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}

const filesSaying = (re) =>
  sources(SRC)
    .filter((p) => !ALLOWED.has(relative(SRC, p)))
    .filter((p) => stripComments(readFileSync(p, 'utf8')).some((line) => re.test(line)))
    .map((p) => relative(SRC, p))

describe('oxygène du sang, cœur au repos : un seul nom (POLISH-SIM-86)', () => {
  it('aucun texte de l’app ne dit « SpO₂ » ni « saturation en oxygène »', () => {
    expect(filesSaying(/SpO₂|SpO2\b|[Ss]aturation en oxygène/)).toEqual([])
  })

  it('aucun texte de l’app ne dit « FC au repos », « FC repos » ni « FC de repos »', () => {
    expect(filesSaying(/FC (au |de )?repos/)).toEqual([])
  })

  it('Journal, Tendances, normes, Analyses et Sources portent le même nom', () => {
    const chips = summaryChips({ restingHr: 58, spo2: 97 }).map(([label]) => label)
    expect(chips).toEqual(['Cœur au repos', 'Oxygène du sang'])
    expect(TREND_MEASURES.find((m) => m.key === 'restingHr').label).toBe('Cœur au repos')
    expect(BASELINE_METRICS.restingHeartRate.label).toBe('Cœur au repos')
    expect(FACTORS.find((f) => f.key === 'restingHR').label).toBe('Cœur au repos')
    expect(READ_TYPE_LABELS.restingHeartRate).toBe('cœur au repos')
    expect(READ_TYPE_LABELS.oxygenSaturation).toBe('oxygène du sang')
  })
})
