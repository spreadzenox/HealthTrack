import { describe, it, expect } from 'vitest'
import { firstWeek, openGift, markReadySeen, giftText, digestionCountdown, GIFTS, WEEK_DAYS } from './firstWeek'

const mem = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}
const D = (day, h = 10) => new Date(2026, 10, day, h)

describe('première semaine', () => {
  it('sept jours avant les premières analyses, comme Objectifs', () => {
    expect(WEEK_DAYS).toBe(7)
    expect(GIFTS.map((g) => g.id)).toEqual(['shrub', 'lantern', 'scarf', 'pebbles', 'butterfly', 'cloud', 'rainbow'])
  })

  it('jour 1 : un cadeau à ouvrir, une seule fois par jour', () => {
    const storage = mem()
    const w = firstWeek({ noted: 0 }, { now: D(16), storage })
    expect(w).toMatchObject({ state: 'week', day: 1, filled: 0 })
    expect(w.todayGift.id).toBe('shrub')
    openGift(1, { now: D(16), storage })
    const after = firstWeek({ noted: 1, todayNoted: true }, { now: D(16, 20), storage })
    expect(after.todayGift).toBeNull()
    expect(after.gifts[0].given).toBe(true)
  })

  it('un jour sans rien ne fait pas reculer la barre : elle attend', () => {
    const storage = mem()
    openGift(3, { now: D(18), storage })
    const w = firstWeek({ noted: 2, todayNoted: false }, { now: D(20), storage })
    expect(w.day).toBe(3)
    expect(w.filled).toBe(2)
    expect(w.todayGift).toBeNull()
    expect(w.gifts.slice(0, 3).every((g) => g.given)).toBe(true)
  })

  it('le 7e jour : la carte des analyses, puis plus rien après « Découvrir »', () => {
    const storage = mem()
    openGift(6, { now: D(21), storage })
    expect(firstWeek({ noted: 7, todayNoted: true }, { now: D(22), storage }).state).toBe('ready')
    expect(firstWeek({ noted: 7 }, { now: D(23), storage }).state).toBe('ready')
    markReadySeen({ storage })
    expect(firstWeek({ noted: 8 }, { now: D(24), storage }).state).toBe('done')
  })

  it('un utilisateur d’avant la refonte, déjà au-delà de 7 jours, ne voit ni barre ni fête', () => {
    expect(firstWeek({ noted: 40 }, { now: D(16), storage: mem() }).state).toBe('done')
  })

  it('textes', () => {
    expect(giftText(GIFTS[2], 'Pilou')).toBe('Une écharpe pour Pilou ! Prochain cadeau demain.')
    expect(giftText(GIFTS[6])).toBe('Un arc-en-ciel pour l’îlot ! La semaine est complète.')
    expect(digestionCountdown(7)).toBe('Confort digestif : premier score dans 7 jours.')
    expect(digestionCountdown(1)).toBe('Confort digestif : premier score demain.')
  })
})
