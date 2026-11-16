import { describe, it, expect, vi } from 'vitest'
import { createBus, bus, EVENTS, EXPRESSIONS, SEQUENCES, THEMES } from './bus'

describe('bus du compagnon', () => {
  it('appelle les écouteurs avec la charge utile, de façon synchrone', () => {
    const b = createBus()
    const fn = vi.fn()
    b.on(EVENTS.MEAL_LOGGED, fn)
    b.emit(EVENTS.MEAL_LOGGED, { slot: 'lunch', count: 1, total: 3 })
    expect(fn).toHaveBeenCalledWith({ slot: 'lunch', count: 1, total: 3 }, 'meal:logged')
  })

  it('on() rend une fonction d’arrêt ; off() marche aussi', () => {
    const b = createBus()
    const fn = vi.fn()
    const stop = b.on('x', fn)
    stop()
    b.emit('x')
    const fn2 = vi.fn()
    b.on('x', fn2)
    b.off('x', fn2)
    b.emit('x')
    expect(fn).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
    expect(b.count('x')).toBe(0)
  })

  it('once() n’écoute qu’une fois', () => {
    const b = createBus()
    const fn = vi.fn()
    b.once('x', fn)
    b.emit('x', { a: 1 })
    b.emit('x', { a: 2 })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ a: 1 }, 'x')
  })

  it('garde la dernière charge utile et la rejoue sur demande', () => {
    const b = createBus()
    expect(b.last(EVENTS.MOOD_CHANGED)).toBeUndefined()
    b.emit(EVENTS.MOOD_CHANGED, { value: 0.5, word: 'Content', done: 2, planned: 4 })
    expect(b.last(EVENTS.MOOD_CHANGED).value).toBe(0.5)
    const late = vi.fn()
    b.on(EVENTS.MOOD_CHANGED, late, { replay: true })
    expect(late).toHaveBeenCalledWith(expect.objectContaining({ value: 0.5 }), 'mood:changed')
    const noReplay = vi.fn()
    b.on(EVENTS.MOOD_CHANGED, noReplay)
    expect(noReplay).not.toHaveBeenCalled()
  })

  it('un écouteur en erreur ne casse ni l’émetteur ni les autres', () => {
    const b = createBus()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = vi.fn()
    b.on('x', () => { throw new Error('boum') })
    b.on('x', ok)
    expect(() => b.emit('x')).not.toThrow()
    expect(ok).toHaveBeenCalled()
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })

  it('« * » reçoit tout avec le type', () => {
    const b = createBus()
    const all = vi.fn()
    b.on('*', all)
    b.emit(EVENTS.HABIT_NOTED, { habitId: 'meditation', answer: 'no' })
    expect(all).toHaveBeenCalledWith({ habitId: 'meditation', answer: 'no' }, 'habit:noted')
  })

  it('un écouteur qui se retire pendant l’émission ne gêne pas les suivants', () => {
    const b = createBus()
    const second = vi.fn()
    const stop = b.on('x', () => stop())
    b.on('x', second)
    b.emit('x')
    expect(second).toHaveBeenCalled()
  })

  it('refuse un type vide ou « * » et un écouteur manquant', () => {
    const b = createBus()
    expect(() => b.emit('')).toThrow()
    expect(() => b.emit('*')).toThrow()
    expect(() => b.on('x')).toThrow()
  })

  it('clear() vide écouteurs et mémoire', () => {
    const b = createBus()
    const fn = vi.fn()
    b.on('x', fn)
    b.emit('x', { a: 1 })
    b.clear()
    b.emit('y')
    expect(b.last('x')).toBeUndefined()
    expect(b.count('x')).toBe(0)
  })

  it('le bus de l’app existe et les noms sont uniques', () => {
    expect(typeof bus.emit).toBe('function')
    const names = Object.values(EVENTS)
    expect(new Set(names).size).toBe(names.length)
    expect(EXPRESSIONS).toHaveLength(12)
    expect(EXPRESSIONS).not.toContain('triste')
    for (const s of SEQUENCES) expect([...EXPRESSIONS, 'reveil']).toContain(s)
    expect(THEMES).toContain('miel')
  })

  it('chaque événement du code est décrit dans CONTRAT.md', async () => {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    const md = readFileSync(resolve(__dirname, 'CONTRAT.md'), 'utf-8')
    for (const name of Object.values(EVENTS)) expect(md, name).toContain(`\`${name}`)
  })
})
