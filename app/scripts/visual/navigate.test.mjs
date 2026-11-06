import { describe, it, expect } from 'vitest'
import { gotoRoute } from './navigate.mjs'

// Faux `page` Playwright : chaque appel à goto consomme un résultat de la liste.
function fakePage({ gotos = ['ok'], idle = 'ok', rendered = 'ok' } = {}) {
  const calls = []
  const outcome = (r) => (r === 'ok' ? Promise.resolve() : Promise.reject(new Error(r)))
  return {
    calls,
    goto: (url, opts) => { calls.push(['goto', url, opts.waitUntil]); return outcome(gotos.shift() ?? 'ok') },
    waitForLoadState: (state) => { calls.push(['state', state]); return outcome(idle) },
    locator: (sel) => ({ first: () => ({ waitFor: () => { calls.push(['rendered', sel]); return outcome(rendered) } }) }),
  }
}

describe('navigation du banc de captures (VISUAL-FLAKY-1)', () => {
  it('attend la fin du chargement puis le rendu de React, pas le réseau au repos', async () => {
    const page = fakePage()
    await gotoRoute(page, 'http://x/')
    expect(page.calls[0]).toEqual(['goto', 'http://x/', 'load'])
    expect(page.calls.some(([k, s]) => k === 'rendered' && s === '#root > *')).toBe(true)
  })

  it('un réseau jamais au repos ne fait plus échouer la page', async () => {
    const page = fakePage({ idle: 'Timeout 5000ms exceeded' })
    await expect(gotoRoute(page, 'http://x/')).resolves.toBeUndefined()
  })

  it('un chargement raté est retenté une fois', async () => {
    const page = fakePage({ gotos: ['Timeout 20000ms exceeded', 'ok'] })
    await gotoRoute(page, 'http://x/a')
    expect(page.calls.filter(([k]) => k === 'goto')).toHaveLength(2)
  })

  it('deux échecs de suite remontent l\'erreur', async () => {
    const page = fakePage({ gotos: ['boom', 'boom'] })
    await expect(gotoRoute(page, 'http://x/a')).rejects.toThrow('boom')
  })

  it('une page qui ne rend rien échoue', async () => {
    const page = fakePage({ rendered: 'Timeout 10000ms exceeded' })
    await expect(gotoRoute(page, 'http://x/')).rejects.toThrow('Timeout')
  })
})
