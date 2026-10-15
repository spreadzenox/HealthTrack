import { describe, it, expect } from 'vitest'
import {
  BEHAVIOR_TAGS,
  MIN_TAG_DAYS,
  getTagMeta,
  nextDateKey,
  permutationPValue,
  stratifiedPermutationPValue,
  computeTagEffects,
  autoDetectedTagIds,
  AUTO_LATE_SCREEN_MIN,
  EVENING_SPORT_FROM_HOUR,
  isWorkoutEntry,
} from './behaviorTags'

// Builds a wellbeing check-in at 21:30 local time, `daysAgo` days before a fixed date.
function checkin(dayIndex, score, tags) {
  const d = new Date(2026, 8, 1, 21, 30) // 1 Sept 2026, local time
  d.setDate(d.getDate() + dayIndex)
  const payload = { score }
  if (tags) payload.tags = tags
  return { type: 'wellbeing', source: 'app_wellbeing', at: d.toISOString(), payload }
}

describe('BEHAVIOR_TAGS', () => {
  it('defines unique ids, French labels and the day the effect is measured', () => {
    const ids = BEHAVIOR_TAGS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of BEHAVIOR_TAGS) {
      expect(t.label).toBeTruthy()
      expect(t.emoji).toBeTruthy()
      expect(['same', 'next']).toContain(t.effectDay)
    }
    expect(getTagMeta('alcohol').effectDay).toBe('next')
    expect(getTagMeta('stress').effectDay).toBe('same')
    expect(getTagMeta('unknown')).toBeNull()
  })
})

describe('nextDateKey', () => {
  it('handles month and year boundaries', () => {
    expect(nextDateKey('2026-09-30')).toBe('2026-10-01')
    expect(nextDateKey('2026-12-31')).toBe('2027-01-01')
    expect(nextDateKey('2028-02-28')).toBe('2028-02-29')
  })
})

describe('permutationPValue', () => {
  it('is small for clearly separated groups and large for identical ones', () => {
    expect(permutationPValue([1, 1, 2, 1, 1, 2], [4, 5, 4, 5, 4, 5])).toBeLessThan(0.01)
    expect(permutationPValue([3, 4, 3, 4, 3], [4, 3, 4, 3, 4])).toBeGreaterThan(0.5)
  })

  it('is deterministic', () => {
    const a = [2, 3, 3, 2, 4, 3]
    const b = [3, 4, 4, 3, 5]
    expect(permutationPValue(a, b)).toBe(permutationPValue(a, b))
  })

  it('never returns 0 (add-one estimator)', () => {
    expect(permutationPValue([0, 0, 0, 0, 0], [5, 5, 5, 5, 5])).toBeGreaterThan(0)
  })
})

describe('stratifiedPermutationPValue', () => {
  it('equals the plain test with a single stratum', () => {
    const a = [2, 3, 3, 2, 4, 3]
    const b = [3, 4, 4, 3, 5]
    expect(stratifiedPermutationPValue([{ a, b }])).toBe(permutationPValue(a, b))
  })

  it('only shuffles labels within each stratum', () => {
    // Inside each stratum the groups are identical: no effect, whatever the
    // gap between strata (group A sits mostly in the high stratum).
    const strata = [
      { a: [5, 4, 5, 4, 5, 4, 5, 4], b: [4, 5] },
      { a: [2, 1], b: [1, 2, 1, 2, 1, 2, 1, 2] },
    ]
    expect(stratifiedPermutationPValue(strata)).toBeGreaterThan(0.5)
    const a = strata.flatMap((s) => s.a)
    const b = strata.flatMap((s) => s.b)
    expect(permutationPValue(a, b)).toBeLessThan(0.05)
  })
})

describe('computeTagEffects', () => {
  it('returns no_tags when the user never used a tag', () => {
    const entries = [checkin(0, 3), checkin(1, 4), checkin(2, 2)]
    expect(computeTagEffects(entries).status).toBe('no_tags')
  })

  it('ignores unknown tags and non-wellbeing entries', () => {
    const entries = [
      checkin(0, 3, ['not_a_tag']),
      { type: 'steps', at: new Date(2026, 8, 2).toISOString(), payload: { value: 1000, tags: ['alcohol'] } },
    ]
    expect(computeTagEffects(entries).status).toBe('no_tags')
  })

  it('measures "next day" tags on the following day wellbeing', () => {
    // Alcohol every other day; the day AFTER alcohol is bad (1), other days good (4).
    const entries = []
    for (let i = 0; i < 20; i++) {
      const alcohol = i % 2 === 0
      const afterAlcohol = i % 2 === 1
      entries.push(checkin(i, afterAlcohol ? 1 : 4, alcohol ? ['alcohol'] : []))
    }
    const res = computeTagEffects(entries)
    expect(res.status).toBe('ok')
    const e = res.effects.find((x) => x.tagId === 'alcohol')
    expect(e).toBeDefined()
    expect(e.effectDay).toBe('next')
    // Last day (i = 19) has no following day → excluded: 10 with, 9 without.
    expect(e.nWith).toBe(10)
    expect(e.nWithout).toBe(9)
    expect(e.meanWith).toBeCloseTo(1)
    expect(e.meanWithout).toBeCloseTo(4)
    expect(e.diff).toBeCloseTo(-3)
    expect(e.p).toBeLessThan(0.01)
    expect(e.evidence).toBe('solide')
  })

  it('measures "same day" tags on the same day wellbeing', () => {
    const entries = []
    for (let i = 0; i < 14; i++) {
      const stressed = i % 3 === 0
      entries.push(checkin(i, stressed ? 2 : 4, stressed ? ['stress'] : []))
    }
    const e = computeTagEffects(entries).effects.find((x) => x.tagId === 'stress')
    expect(e.nWith).toBe(5)
    expect(e.nWithout).toBe(9)
    expect(e.diff).toBeCloseTo(-2)
  })

  it('only counts days from the first time any tag was used', () => {
    const entries = []
    // 10 old days without the feature (they must not count as "without stress").
    for (let i = 0; i < 10; i++) entries.push(checkin(i, 5))
    for (let i = 10; i < 22; i++) {
      const stressed = i % 2 === 0
      entries.push(checkin(i, stressed ? 2 : 3, stressed ? ['stress'] : []))
    }
    const res = computeTagEffects(entries)
    expect(res.trackedDays).toBe(12)
    const e = res.effects.find((x) => x.tagId === 'stress')
    expect(e.nWith + e.nWithout).toBe(12)
    expect(e.meanWithout).toBeCloseTo(3)
  })

  it('merges several check-ins of the same day (mean score, union of tags)', () => {
    const entries = []
    for (let i = 0; i < 12; i++) {
      const stressed = i % 2 === 0
      entries.push(checkin(i, stressed ? 1 : 4, stressed ? ['stress'] : []))
      // A second check-in the same day, without tags, with a higher score.
      const d = new Date(2026, 8, 1, 10, 0)
      d.setDate(d.getDate() + i)
      entries.push({ type: 'wellbeing', at: d.toISOString(), payload: { score: stressed ? 3 : 4 } })
    }
    const e = computeTagEffects(entries).effects.find((x) => x.tagId === 'stress')
    expect(e.nWith).toBe(6)
    expect(e.meanWith).toBeCloseTo(2)
  })

  it(`lists tags with fewer than ${MIN_TAG_DAYS} days on either side as pending`, () => {
    const entries = []
    for (let i = 0; i < 12; i++) {
      entries.push(checkin(i, 3, i < 2 ? ['sick'] : []))
    }
    const res = computeTagEffects(entries)
    expect(res.effects.find((x) => x.tagId === 'sick')).toBeUndefined()
    const pending = res.pending.find((x) => x.tagId === 'sick')
    expect(pending).toMatchObject({ nWith: 2, nWithout: 10 })
    // Tags never used do not clutter the pending list.
    expect(res.pending.find((x) => x.tagId === 'alcohol')).toBeUndefined()
  })

  it('applies Benjamini-Hochberg across tags and sorts by |difference|', () => {
    const entries = []
    for (let i = 0; i < 30; i++) {
      const tags = []
      if (i % 2 === 0) tags.push('stress')
      if (i % 3 === 0) tags.push('late_screen')
      entries.push(checkin(i, (i % 2 === 0 ? 2 : 4) + (i % 5 === 0 ? 0.5 : 0), tags))
    }
    const res = computeTagEffects(entries)
    expect(res.effects.length).toBe(2)
    expect(Math.abs(res.effects[0].diff)).toBeGreaterThanOrEqual(Math.abs(res.effects[1].diff))
    for (const e of res.effects) expect(e.q).toBeGreaterThanOrEqual(e.p)
    expect(res.effects[0].tagId).toBe('stress')
  })

  describe('week-end control', () => {
    // Day 0 = Tuesday 1 Sept 2026. Wellbeing is higher on Saturdays and Sundays.
    // Alcohol: every Friday (→ Saturday), Saturdays of even weeks (→ Sunday) and
    // Tuesdays of weeks 0, 3 and 6 (→ Wednesday): mostly before a week-end day.
    function weekendData(alcoholEffect) {
      const entries = []
      const alcoholDays = new Set()
      for (let i = 0; i < 56; i++) {
        const dow = new Date(2026, 8, 1 + i).getDay()
        const week = Math.floor(i / 7)
        if (dow === 5 || (dow === 6 && week % 2 === 0) || (dow === 2 && week % 3 === 0)) alcoholDays.add(i)
      }
      for (let i = 0; i < 56; i++) {
        const dow = new Date(2026, 8, 1 + i).getDay()
        const base = dow === 0 || dow === 6 ? 4.5 : 3
        const score = base + (alcoholDays.has(i - 1) ? alcoholEffect : 0)
        entries.push(checkin(i, score, alcoholDays.has(i) ? ['alcohol'] : ['stress']))
      }
      return entries
    }

    it('does not credit a tag with the week-end mood', () => {
      const e = computeTagEffects(weekendData(0)).effects.find((x) => x.tagId === 'alcohol')
      // Raw comparison: days after alcohol look much better (they are week-ends).
      expect(e.diffRaw).toBeGreaterThan(0.8)
      expect(e.meanWith - e.meanWithout).toBeCloseTo(e.diffRaw)
      // Same type of day compared with the same type of day: no effect.
      expect(Math.abs(e.diff)).toBeLessThan(0.05)
      expect(e.p).toBeGreaterThan(0.3)
      expect(e.evidence).not.toBe('solide')
    })

    it('still finds a real effect hidden by the week-end', () => {
      const e = computeTagEffects(weekendData(-1)).effects.find((x) => x.tagId === 'alcohol')
      // Raw: the week-end bonus (+1.5) masks the hangover (−1).
      expect(e.diffRaw).toBeGreaterThan(0)
      expect(e.diff).toBeCloseTo(-1)
      expect(e.p).toBeLessThan(0.01)
    })

    it('leaves a tag that only ever happens before a week-end as pending', () => {
      const entries = []
      for (let i = 0; i < 56; i++) {
        const dow = new Date(2026, 8, 1 + i).getDay()
        const base = dow === 0 || dow === 6 ? 4.5 : 3
        entries.push(checkin(i, base, dow === 5 || dow === 6 ? ['alcohol'] : ['stress']))
      }
      const res = computeTagEffects(entries)
      expect(res.effects.find((x) => x.tagId === 'alcohol')).toBeUndefined()
      expect(res.pending.find((x) => x.tagId === 'alcohol')).toMatchObject({ weekendOnly: true })
    })
  })
})

// phone_usage of the day dayIndex: its late screen covers the evening BEFORE (22:00 → 04:00).
function phoneDay(dayIndex, lateScreenMinutes) {
  const d = new Date(2026, 8, 1, 12, 0)
  d.setDate(d.getDate() + dayIndex)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { type: 'phone_usage', source: 'phone', at: d.toISOString(), payload: { date, screenMinutes: 200, lateScreenMinutes, unlocks: 40 } }
}

describe('late screen detected by the phone (no check-in tag needed)', () => {
  it('declares late_screen as automatic from phone_usage', () => {
    expect(getTagMeta('late_screen').auto).toBe('phone_usage')
    expect(AUTO_LATE_SCREEN_MIN).toBe(30)
  })

  it('analyses late screen from phone_usage even when no tag was ever used', () => {
    // Evening of day i: late screen when i is even; phone_usage of day i+1 carries it.
    const entries = []
    for (let i = 0; i < 20; i++) {
      entries.push(checkin(i, i % 2 === 1 ? 1 : 4))
      entries.push(phoneDay(i + 1, i % 2 === 0 ? 75 : 5))
    }
    const res = computeTagEffects(entries)
    expect(res.status).toBe('ok')
    const e = res.effects.find((x) => x.tagId === 'late_screen')
    expect(e).toBeDefined()
    expect(e.auto).toBe(true)
    expect(e.nWith).toBe(10)
    expect(e.nWithout).toBe(9)
    expect(e.diff).toBeCloseTo(-3)
  })

  it('the measured value wins over the declared tag, the tag still counts where nothing was measured', () => {
    const entries = []
    for (let i = 0; i < 20; i++) {
      // Days 0-9: declared only (tag on even days). Days 10-19: measured, and contradicts a stale tag.
      const tags = i < 10 && i % 2 === 0 ? ['late_screen'] : i >= 10 ? ['late_screen'] : []
      entries.push(checkin(i, i % 2 === 1 ? 1 : 4, tags))
      if (i >= 10) entries.push(phoneDay(i + 1, i % 2 === 0 ? 60 : 0))
    }
    const e = computeTagEffects(entries).effects.find((x) => x.tagId === 'late_screen')
    expect(e.nWith).toBe(10)
    expect(e.nWithout).toBe(9)
    expect(e.diff).toBeCloseTo(-3)
  })

  it('does not count days without a phone measurement as "without" for a user who never tagged', () => {
    const entries = []
    for (let i = 0; i < 20; i++) entries.push(checkin(i, 3, i === 0 ? ['alcohol'] : []))
    for (let i = 15; i < 19; i++) entries.push(phoneDay(i + 1, 60))
    const res = computeTagEffects(entries)
    const pending = res.pending.find((x) => x.tagId === 'late_screen')
    // 4 measured late evenings; the 15 earlier untagged, unmeasured days still count as « sans »
    // only because tagging had started (day 0) — they are declared days.
    expect(pending.nWith).toBe(4)
  })
})

describe('autoDetectedTagIds', () => {
  it('lists late_screen only when the phone capture is on', () => {
    expect(autoDetectedTagIds({ phoneUsage: true })).toEqual(['late_screen'])
    expect(autoDetectedTagIds({ phoneUsage: false })).toEqual([])
  })

  it('lists evening_sport only when workouts are captured (watch or Health Connect)', () => {
    expect(autoDetectedTagIds({ workouts: true })).toEqual(['evening_sport'])
    expect(autoDetectedTagIds({ phoneUsage: true, workouts: true })).toEqual(['late_screen', 'evening_sport'])
  })
})

// Workout starting at `hour` on day dayIndex.
function workout(dayIndex, hour, minutes = 45, source = 'huawei_watch') {
  const d = new Date(2026, 8, 1, hour, 0)
  d.setDate(d.getDate() + dayIndex)
  return { type: 'activity', source, at: d.toISOString(), payload: { workoutType: 'running', durationSeconds: minutes * 60 } }
}

describe('evening sport deduced from workouts (I85)', () => {
  it('declares evening_sport as automatic from workouts, from 18:00', () => {
    expect(getTagMeta('evening_sport').auto).toBe('workouts')
    expect(EVENING_SPORT_FROM_HOUR).toBe(18)
  })

  it('recognises workouts, not distance-only activity entries or very short ones', () => {
    expect(isWorkoutEntry(workout(0, 19))).toBe(true)
    expect(isWorkoutEntry(workout(0, 19, 5))).toBe(false)
    expect(isWorkoutEntry({ type: 'activity', at: '2026-09-01T18:00:00Z', payload: { distanceMeters: 300 } })).toBe(false)
    expect(isWorkoutEntry({ type: 'steps', at: '2026-09-01T18:00:00Z', payload: { durationSeconds: 3600 } })).toBe(false)
  })

  it('analyses evening sport from recorded workouts, with no tag ever used', () => {
    // Evening sport on even days (19:00), morning sport on some odd days (does not count), next day better.
    const entries = []
    for (let i = 0; i < 20; i++) {
      entries.push(checkin(i, i % 2 === 1 ? 4 : 2))
      if (i % 2 === 0) entries.push(workout(i, 19))
      else if (i % 4 === 1) entries.push(workout(i, 8))
    }
    const e = computeTagEffects(entries).effects.find((x) => x.tagId === 'evening_sport')
    expect(e).toBeDefined()
    expect(e.auto).toBe(true)
    // Evenings 0..18 even → next day measured on 1..19 (10 with); odd evenings 1..17 → 9 without (19 has no next day)
    expect(e.nWith).toBe(10)
    expect(e.nWithout).toBe(9)
    expect(e.diff).toBeCloseTo(2)
  })

  it('a declared « Sport le soir » still counts on an evening the watch did not record', () => {
    const entries = []
    for (let i = 0; i < 20; i++) {
      const declared = i === 4 || i === 6 // sport without the watch
      entries.push(checkin(i, i % 2 === 1 ? 4 : 2, declared ? ['evening_sport'] : []))
      if (i % 2 === 0 && !declared) entries.push(workout(i, 19))
    }
    const e = computeTagEffects(entries).effects.find((x) => x.tagId === 'evening_sport')
    expect(e.nWith).toBe(10)
  })

  it('does not read days before the first recorded workout as « without » for a user who never tagged', () => {
    const entries = []
    for (let i = 0; i < 20; i++) entries.push(checkin(i, 3))
    for (const i of [14, 16, 18]) entries.push(workout(i, 19))
    const res = computeTagEffects(entries)
    const pending = res.pending.find((x) => x.tagId === 'evening_sport')
    expect(pending).toMatchObject({ nWith: 3, nWithout: 2 })
  })
})
