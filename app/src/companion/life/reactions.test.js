import { describe, it, expect } from 'vitest'
import { diffToday, pickReaction } from './reactions'

const day = '2026-11-16'
const at = (h) => new Date(2026, 10, 16, h, 0).toISOString()
const e = (id, type, h, payload = {}, source = 'app') => ({ id, type, at: at(h), source, payload, created_at: at(h) })

describe('diffToday', () => {
  it('premier regard de la session : on mesure sans réagir', () => {
    const r = diffToday(null, [e(1, 'food', 8)], day)
    expect(r.added).toEqual([])
    expect(r.next).toEqual({ day, ids: { 1: 'food' } })
  })

  it('une saisie nouvelle (même faite sur la page Repas) est vue au retour', () => {
    const prev = { day, ids: { 1: 'food' } }
    const r = diffToday(prev, [e(1, 'food', 8), e(2, 'food', 13)], day)
    expect(r.added.map((x) => x.id)).toEqual([2])
    expect(pickReaction(r, { name: 'Pilou' }).sub).toBe('Bravo, Pilou est rassasié.')
  })

  it('les mesures automatiques ne font pas réagir', () => {
    const r = diffToday({ day, ids: {} }, [e(3, 'steps', 9), e(4, 'sleep', 7)], day)
    expect(r.added).toEqual([])
    expect(pickReaction(r)).toBeNull()
  })

  it('une saisie qui disparaît : il rembobine', () => {
    const r = diffToday({ day, ids: { 1: 'habit' } }, [], day)
    expect(r.undone).toBe(true)
    expect(pickReaction(r).move).toBe('rewind')
  })

  it('« Non » remplacé par « Oui » : la nouvelle réponse l’emporte sur l’annulation', () => {
    const r = diffToday({ day, ids: { 1: 'habit' } }, [e(2, 'habit', 12, { habit: 'meditation', label: 'Méditation', done: true })], day)
    expect(pickReaction(r).move).toBe('meditate')
  })

  it('nouvelle journée : on repart sans réagir à hier', () => {
    const r = diffToday({ day: '2026-11-15', ids: {} }, [e(1, 'food', 8)], day)
    expect(r.added).toEqual([])
  })
})

describe('annulation : le bus apprend ce qui a été annulé', () => {
  it('kind du bus et identifiant', () => {
    const r = pickReaction(diffToday({ day, ids: { 7: 'food' } }, [], day))
    expect(r.undone).toEqual({ id: '7', kind: 'meal' })
    expect(r.entry).toBeNull()
  })
})
