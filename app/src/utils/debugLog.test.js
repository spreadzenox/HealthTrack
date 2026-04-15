import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  debugLog,
  debugInfo,
  debugWarn,
  debugError,
  debugDebug,
  getDebugEntries,
  clearDebugLog,
  subscribeDebugLog,
} from './debugLog'

describe('debugLog', () => {
  beforeEach(() => {
    clearDebugLog()
  })

  it('appends an entry with the correct shape', () => {
    debugLog('info', 'TestTag', 'Hello world')
    const entries = getDebugEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      level: 'info',
      tag: 'TestTag',
      message: 'Hello world',
    })
    expect(entries[0].ts).toBeTruthy()
    expect(entries[0].id).toBe(1)
  })

  it('appends optional data payload', () => {
    debugInfo('Tag', 'msg', { foo: 'bar' })
    const entries = getDebugEntries()
    expect(entries[0].data).toEqual({ foo: 'bar' })
  })

  it('does not set data when not provided', () => {
    debugInfo('Tag', 'msg')
    const entries = getDebugEntries()
    expect(entries[0].data).toBeUndefined()
  })

  it('convenience wrappers set the correct level', () => {
    debugInfo('T', 'info msg')
    debugWarn('T', 'warn msg')
    debugError('T', 'error msg')
    debugDebug('T', 'debug msg')
    const entries = getDebugEntries()
    expect(entries.map((e) => e.level)).toEqual(['info', 'warn', 'error', 'debug'])
  })

  it('clearDebugLog empties the buffer', () => {
    debugInfo('T', 'a')
    debugInfo('T', 'b')
    clearDebugLog()
    expect(getDebugEntries()).toHaveLength(0)
  })

  it('getDebugEntries returns a copy (mutation does not affect buffer)', () => {
    debugInfo('T', 'msg')
    const copy = getDebugEntries()
    copy.push({ id: 999, level: 'info', tag: 'X', message: 'injected', ts: '' })
    expect(getDebugEntries()).toHaveLength(1)
  })

  it('notifies subscribers when a new entry is added', () => {
    const listener = vi.fn()
    const unsub = subscribeDebugLog(listener)
    debugInfo('T', 'trigger')
    expect(listener).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('notifies subscribers when clearDebugLog is called', () => {
    const listener = vi.fn()
    const unsub = subscribeDebugLog(listener)
    clearDebugLog()
    expect(listener).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('unsubscribed listener is not called', () => {
    const listener = vi.fn()
    const unsub = subscribeDebugLog(listener)
    unsub()
    debugInfo('T', 'after unsub')
    expect(listener).not.toHaveBeenCalled()
  })

  it('IDs are sequential and increment after clear', () => {
    debugInfo('T', 'a')
    debugInfo('T', 'b')
    const entries1 = getDebugEntries()
    expect(entries1[0].id).toBe(1)
    expect(entries1[1].id).toBe(2)

    clearDebugLog()
    debugInfo('T', 'c')
    const entries2 = getDebugEntries()
    expect(entries2[0].id).toBe(1)
  })
})
