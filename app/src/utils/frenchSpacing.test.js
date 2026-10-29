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

  it('lie un nombre à son unité (POL-PLAY-37)', () => {
    expect(fixFrenchSpacing('· 1004 hPa (−8)')).toBe(`· 1004${NB}hPa (−8)`)
    expect(fixFrenchSpacing('7 h 30, 2,5 km, 12 °C, 50 %, 4,99 €, 320 kcal, 64 bpm, 14 j'))
      .toBe(`7${NB}h 30, 2,5${NB}km, 12${NB}°C, 50${NB}%, 4,99${NB}€, 320${NB}kcal, 64${NB}bpm, 14${NB}j`)
  })

  it('ne lie pas un nombre au mot qui suit', () => {
    expect(fixFrenchSpacing('2 mois, 3 semaines, 5 grammes')).toBe('2 mois, 3 semaines, 5 grammes')
  })

  it('garde les milliers ensemble', () => {
    expect(fixFrenchSpacing('3 553 aliments, 12 480 pas')).toBe(`3${NB}553 aliments, 12${NB}480${NB}pas`)
  })

  it('garde une date d’un seul tenant : jour, mois et année (POL-PLAY-39)', () => {
    expect(fixFrenchSpacing('jusqu’au 18 nov. 2026 : rien')).toBe(`jusqu’au 18${NB}nov.${NB}2026${NB}: rien`)
    expect(fixFrenchSpacing('le 1er décembre')).toBe(`le 1er${NB}décembre`)
    expect(fixFrenchSpacing('29 oct.')).toBe(`29${NB}oct.`)
    expect(fixFrenchSpacing('3 mai 2027')).toBe(`3${NB}mai${NB}2027`)
    // un mot qui commence comme un mois n'est pas une date
    expect(fixFrenchSpacing('2 maisons')).toBe('2 maisons')
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
