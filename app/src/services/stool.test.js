import { describe, expect, it } from 'vitest'
import {
  BRISTOL_TYPES,
  STOOL_FORMS,
  STOOL_TYPE,
  formOfBristol,
  stoolCounts,
  stoolEntryLabel,
  stoolForm,
  stoolPayload,
} from './stool'

const at = (d, h = 9) => new Date(2026, 9, d, h).toISOString()

describe('forme des selles (I176)', () => {
  it('les 7 types de Bristol se répartissent dans les 3 formes, sans trou ni doublon', () => {
    const all = STOOL_FORMS.flatMap((f) => f.bristol).sort()
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(BRISTOL_TYPES.map((t) => t.n)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect([1, 2, 3, 5, 6, 7].map(formOfBristol)).toEqual(['hard', 'hard', 'normal', 'normal', 'loose', 'loose'])
    expect(formOfBristol(0)).toBeNull()
    expect(formOfBristol(8)).toBeNull()
  })

  it('payload : la forme seule, ou le type précis qui impose sa forme', () => {
    expect(stoolPayload({ form: 'normal' })).toEqual({ form: 'normal' })
    expect(stoolPayload({ form: 'normal', bristol: 7 })).toEqual({ form: 'loose', bristol: 7 })
    expect(() => stoolPayload({ form: 'autre' })).toThrow()
  })

  it('lecture tolérante : forme connue, sinon déduite du type ; libellés courts', () => {
    expect(stoolForm({ payload: { bristol: 2 } })).toBe('hard')
    expect(stoolForm({ payload: { form: 'x' } })).toBeNull()
    expect(stoolEntryLabel({ payload: { form: 'normal' } })).toBe('Normales')
    expect(stoolEntryLabel({ payload: { form: 'hard', bristol: 2 } })).toBe('Dures · type 2')
    expect(stoolEntryLabel({ payload: {} })).toBeNull()
  })

  it('décompte sur la période ; null sans aucune note (la section du rapport disparaît)', () => {
    const entries = [
      { type: STOOL_TYPE, at: at(1), payload: { form: 'hard', bristol: 1 } },
      { type: STOOL_TYPE, at: at(2), payload: { form: 'normal' } },
      { type: STOOL_TYPE, at: at(2, 18), payload: { form: 'loose' } },
      { type: STOOL_TYPE, at: at(20), payload: { form: 'normal' } },
      { type: STOOL_TYPE, at: 'pas une date', payload: { form: 'normal' } },
      { type: 'gut', at: at(2), payload: { level: 'pain' } },
    ]
    expect(stoolCounts(entries, '2026-10-01', '2026-10-14')).toEqual({ total: 3, days: 2, hard: 1, normal: 1, loose: 1 })
    expect(stoolCounts(entries)).toMatchObject({ total: 4, days: 3 })
    expect(stoolCounts([])).toBeNull()
  })
})
