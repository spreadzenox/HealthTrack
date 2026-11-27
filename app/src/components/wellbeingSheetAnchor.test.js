import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const css = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const bodyOf = (selector) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel]) => sel.split(',').map((s) => s.trim()).includes(selector))
    .map(([, , body]) => body)
    .join(';')

// POLISH-SIM-178 (27/11, « Stressé et pressé ») : la fenêtre de la note était centrée ; au choix de la note, les
// précisions s'ouvraient et « Enregistrer » descendait de 200 px sous le doigt. La fenêtre est posée en bas de
// l'écran, comme les feuilles de Ma journée : elle grandit vers le haut et les boutons ne bougent plus.
describe('fenêtre du bien-être : boutons à place fixe (POLISH-SIM-178)', () => {
  it('la fenêtre est posée en bas de l’écran, pas centrée', () => {
    expect(bodyOf('.wellbeing-modal-backdrop')).toMatch(/align-items:\s*flex-end/)
  })
  it('les boutons restent visibles quand la fenêtre défile', () => {
    const body = bodyOf('.wellbeing-modal-actions')
    expect(body).toMatch(/position:\s*sticky/)
    expect(body).toMatch(/bottom:\s*0/)
    expect(body).toMatch(/background:\s*var\(--surface\)/)
  })
})
