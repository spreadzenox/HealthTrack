import { describe, it, expect, beforeEach } from 'vitest'
import { getUnseenEntries, getLastSeenId, markAllSeen, bannerHeadline } from './whatsNew'

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

describe('bannerHeadline (REFONTE-UPG-2)', () => {
  const unseen = [
    { id: '2026-11-16-1030-c', title: 'Nouvelle police' },
    { id: '2026-11-15-0435-b', title: 'Nouveaux onglets', aLaUne: true },
    { id: '2026-11-14-0000-a', title: 'Ancienne' },
  ]

  it('met en avant une note « à la une » parmi les non lues, même si elle n’est pas la plus récente', () => {
    expect(bannerHeadline(unseen).title).toBe('Nouveaux onglets')
  })

  it('prend la plus récente quand aucune note non lue n’est à la une', () => {
    expect(bannerHeadline([unseen[0], unseen[2]]).title).toBe('Nouvelle police')
  })

  it('rien à montrer sans note non lue', () => {
    expect(bannerHeadline([])).toBeNull()
  })
})
