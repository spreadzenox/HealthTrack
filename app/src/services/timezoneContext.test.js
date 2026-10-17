import { describe, it, expect, vi, beforeEach } from 'vitest'

const upsertEntries = vi.fn(async () => ({ inserted: 1, skipped: 0 }))
vi.mock('../storage/localHealthStorage', () => ({ upsertEntries: (...a) => upsertEntries(...a) }))

const { timezoneContextEntry, recordTimezoneContext } = await import('./timezoneContext')

describe('timezoneContextEntry', () => {
  it('describes the local day, zone and offset, dated at local noon (one per day and zone)', () => {
    const now = new Date(2026, 9, 17, 8, 5)
    const e = timezoneContextEntry(now, 'Europe/Paris')
    expect(e).toEqual({
      type: 'context',
      source: 'app_context',
      at: new Date(2026, 9, 17, 12).toISOString(),
      payload: { date: '2026-10-17', tz: 'Europe/Paris', tzOffset: -now.getTimezoneOffset() },
    })
    expect(timezoneContextEntry(new Date(2026, 9, 17, 22, 0), 'Europe/Paris').at).toBe(e.at)
  })

  it('returns null without a known time zone', () => {
    expect(timezoneContextEntry(new Date(), '')).toBeNull()
  })
})

describe('recordTimezoneContext', () => {
  beforeEach(() => upsertEntries.mockClear())

  it('writes the entry once per day and zone (no database write on each return to the app)', async () => {
    const now = new Date(2026, 9, 17, 9)
    await recordTimezoneContext(now, 'Europe/Paris')
    await recordTimezoneContext(new Date(2026, 9, 17, 11), 'Europe/Paris')
    expect(upsertEntries).toHaveBeenCalledTimes(1)
    await recordTimezoneContext(new Date(2026, 9, 17, 15), 'Europe/London')
    await recordTimezoneContext(new Date(2026, 9, 18, 9), 'Europe/London')
    expect(upsertEntries).toHaveBeenCalledTimes(3)
    expect(upsertEntries.mock.calls[1][0][0].payload.tz).toBe('Europe/London')
  })

  it('never throws when the database is unavailable', async () => {
    upsertEntries.mockRejectedValueOnce(new Error('idb'))
    await expect(recordTimezoneContext(new Date(2026, 9, 19, 9), 'Europe/Paris')).resolves.toBe(false)
  })
})
