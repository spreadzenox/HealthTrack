import { describe, it, expect } from 'vitest'
import { withTimeout, isTimeout } from './withTimeout'

describe('withTimeout', () => {
  it('rend la valeur si la promesse répond à temps', async () => {
    await expect(withTimeout(Promise.resolve(3), 50)).resolves.toBe(3)
  })
  it('rejette « délai dépassé » si la promesse ne répond jamais', async () => {
    const e = await withTimeout(new Promise(() => {}), 10, 'apps').catch((x) => x)
    expect(isTimeout(e)).toBe(true)
    expect(e.message).toBe('apps : délai dépassé (1 s)')
  })
  it('laisse passer l’erreur d’origine', async () => {
    const e = await withTimeout(Promise.reject(new Error('non')), 50).catch((x) => x)
    expect(e.message).toBe('non')
    expect(isTimeout(e)).toBe(false)
  })
  it('sans délai valide : attente simple', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 0)).resolves.toBe('ok')
  })
})
