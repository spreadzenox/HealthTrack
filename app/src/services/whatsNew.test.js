import { describe, it, expect, beforeEach } from 'vitest'
import { getUnseenEntries, getLastSeenId, markAllSeen } from './whatsNew'

const CHANGELOG = [
  { id: '2026-10-10-a', date: '2026-10-10', title: 'Trois' },
  { id: '2026-10-09-a', date: '2026-10-09', title: 'Deux' },
  { id: '2026-10-08-a', date: '2026-10-08', title: 'Un' },
]

describe('whatsNew', () => {
  beforeEach(() => localStorage.clear())

  it('returns every entry when nothing has been seen yet', () => {
    expect(getUnseenEntries(CHANGELOG, null)).toHaveLength(3)
  })

  it('returns only entries newer than the last seen one', () => {
    expect(getUnseenEntries(CHANGELOG, '2026-10-09-a').map((e) => e.title)).toEqual(['Trois'])
  })

  it('returns nothing when the newest entry was seen', () => {
    expect(getUnseenEntries(CHANGELOG, '2026-10-10-a')).toEqual([])
  })

  it('treats an unknown last seen id as "everything is new"', () => {
    expect(getUnseenEntries(CHANGELOG, 'removed-id')).toHaveLength(3)
  })

  it('persists the newest id when marking all as seen', () => {
    expect(getLastSeenId()).toBeNull()
    markAllSeen(CHANGELOG)
    expect(getLastSeenId()).toBe('2026-10-10-a')
    expect(getUnseenEntries(CHANGELOG, getLastSeenId())).toEqual([])
  })

  it('does nothing when marking an empty changelog', () => {
    markAllSeen([])
    expect(getLastSeenId()).toBeNull()
  })
})
