import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { FIRST_RESULTS_DAY } from './firstResults'
import { UNLOCK_DAYS } from '../services/analysisResults'
import { GUT_PISTES_MIN_NOTE_DAYS, PISTES_MIN_DAYS } from '../services/today'

const SRC = join(import.meta.dirname, '..')
const files = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) files(p, out)
    else if (/\.jsx?$/.test(p) && !/\.test\./.test(p)) out.push(p)
  }
  return out
}

describe('calendrier unique des premiers résultats (ACC-10)', () => {
  it('jour 14 pour le bien-être, jour 28 pour la digestion, partout la même constante', () => {
    expect(FIRST_RESULTS_DAY).toEqual({ wellbeing: 14, digestion: 28 })
    expect(UNLOCK_DAYS.wellbeing.short).toBe(FIRST_RESULTS_DAY.wellbeing)
    expect(UNLOCK_DAYS.digestion.short).toBe(FIRST_RESULTS_DAY.digestion)
    expect(PISTES_MIN_DAYS).toBe(FIRST_RESULTS_DAY.wellbeing)
    expect(GUT_PISTES_MIN_NOTE_DAYS).toBe(FIRST_RESULTS_DAY.digestion)
  })

  it('aucun texte ne promet les pistes vers le 21e jour (ancien délai)', () => {
    const hits = files(SRC).filter((f) => /<Ordinal n=\{21\}|vers le 21|pistes[^.]{0,40}21 jours/.test(readFileSync(f, 'utf8'))).map((f) => relative(SRC, f))
    expect(hits).toEqual([])
  })
})
