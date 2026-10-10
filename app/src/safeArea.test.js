import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

// Android 15+ (targetSdk 36) dessine l'app sous la barre d'état et la barre de navigation.
// Sans viewport-fit=cover, Capacitor n'injecte pas --safe-area-inset-* et, sur les WebView ≤ 139,
// env(safe-area-inset-*) vaut souvent 0 : la barre d'onglets passerait sous la navigation Android.
describe('zones système (edge-to-edge Android)', () => {
  it('index.html déclare viewport-fit=cover', () => {
    const viewport = read('../index.html').match(/<meta name="viewport" content="([^"]+)"/)
    expect(viewport?.[1]).toContain('viewport-fit=cover')
  })

  it('les encarts privilégient les variables injectées par Capacitor, env() en repli', () => {
    const css = read('./index.css')
    expect(css).toContain('--safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px))')
    expect(css).toContain('--safe-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))')
  })

  it("aucune feuille de style n'utilise env(safe-area-inset-*) directement", () => {
    for (const file of ['./App.css', './components/TabBar.css', './pages/Connectors.css']) {
      expect(read(file), file).not.toMatch(/env\(safe-area-inset/)
    }
  })
})
