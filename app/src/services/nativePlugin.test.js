import { describe, it, expect, vi } from 'vitest'
import { notThenable } from './nativePlugin'

// Le proxy de registerPlugin (@capacitor/core 8) fabrique une méthode pour tout nom, y compris `then` ; la vraie
// renvoie une promesse rejetée sans jamais appeler resolve/reject : ici, une promesse qui ne se règle jamais suffit
// à reproduire le blocage (sans rejet orphelin dans la suite de tests)
function capacitorLikeProxy(impl) {
  return new Proxy({}, { get: (_, prop) => impl[prop] ?? (() => new Promise(() => {})) })
}

describe('notThenable', () => {
  it('le proxy brut renvoyé par une fonction async ne se résout jamais (le défaut corrigé)', async () => {
    const load = async () => capacitorLikeProxy({})
    const outcome = await Promise.race([load().then(() => 'résolu'), new Promise((r) => setTimeout(() => r('bloqué'), 50))])
    expect(outcome).toBe('bloqué')
  })

  it('renvoyé par une fonction async, le plugin enveloppé se résout et garde ses méthodes', async () => {
    const getProducts = vi.fn(async () => ({ products: [1] }))
    const load = async () => notThenable(capacitorLikeProxy({ getProducts }))
    const plugin = await load()
    expect(plugin.then).toBeUndefined()
    await expect(plugin.getProducts({})).resolves.toEqual({ products: [1] })
    expect(getProducts).toHaveBeenCalledWith({})
  })
})
