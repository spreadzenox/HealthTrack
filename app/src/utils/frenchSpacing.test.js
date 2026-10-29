import { describe, it, expect, afterEach } from 'vitest'
import { fixFrenchSpacing, installFrenchSpacing } from './frenchSpacing'

const NB = ' '

describe('fixFrenchSpacing', () => {
  it('lie les guillemets au mot qu’ils encadrent', () => {
    expect(fixFrenchSpacing('Passez de « je note » à « je comprends »'))
      .toBe(`Passez de «${NB}je note${NB}» à «${NB}je comprends${NB}»`)
  })

  it('lie les signes doubles au mot qui précède', () => {
    expect(fixFrenchSpacing('Toujours gratuit : journal ; graphiques ? oui !'))
      .toBe(`Toujours gratuit${NB}: journal${NB}; graphiques${NB}? oui${NB}!`)
  })

  it('ne touche pas au reste du texte', () => {
    expect(fixFrenchSpacing('12:30 · 2,7 / 5 — rien à changer')).toBe('12:30 · 2,7 / 5 — rien à changer')
    expect(fixFrenchSpacing('')).toBe('')
  })

  it('ne transforme pas un deux-points en début de texte', () => {
    expect(fixFrenchSpacing(' : suite')).toBe(' : suite')
  })
})

describe('installFrenchSpacing', () => {
  let stop
  afterEach(() => {
    stop?.()
    document.body.innerHTML = ''
  })

  const flush = () => new Promise((r) => setTimeout(r, 0))

  it('corrige le texte déjà affiché puis celui ajouté ou modifié ensuite', async () => {
    document.body.innerHTML = '<div id="r"><h1>Passez de « je note »</h1></div>'
    const root = document.getElementById('r')
    stop = installFrenchSpacing(root)
    expect(root.querySelector('h1').textContent).toBe(`Passez de «${NB}je note${NB}»`)

    const p = document.createElement('p')
    p.textContent = 'Gratuit : oui'
    root.appendChild(p)
    await flush()
    expect(p.textContent).toBe(`Gratuit${NB}: oui`)

    p.firstChild.nodeValue = 'Prêt ?'
    await flush()
    expect(p.textContent).toBe(`Prêt${NB}?`)
  })

  it('laisse les champs de saisie et le code tels quels', async () => {
    document.body.innerHTML = '<div id="r"><textarea>a : b</textarea><code>x : y</code></div>'
    const root = document.getElementById('r')
    stop = installFrenchSpacing(root)
    expect(root.querySelector('textarea').value).toBe('a : b')
    expect(root.querySelector('code').textContent).toBe('x : y')
  })
})
