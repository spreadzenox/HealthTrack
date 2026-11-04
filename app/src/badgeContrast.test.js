import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const read = (relative) => readFileSync(join(process.cwd(), 'src/', relative), 'utf8')
const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[2] ?? ''
}

// Contrôle « CONTRASTE FAIBLE » de `npm run visual` (04/11, WCAG 1.4.3) : les étiquettes vertes « Reçu »,
// « Automatique » (Sources) et « Dans votre norme », « Horaires variables » (Tendances) étaient en émeraude sur un
// voile émeraude à 15 % (3,7 à 4:1 en thème clair). Elles prennent le couple menthe des tokens, dont le contraste
// ≥ 4,5:1 est vérifié dans les deux thèmes par tokens.test.js.
describe('étiquettes vertes lisibles', () => {
  it.each([
    ['components/MyDevices.css', '.device-status-ok'],
    ['components/BaselineCards.css', '.baseline-badge'],
  ])('%s %s : texte et fond menthe des tokens', (file, selector) => {
    const body = rule(read(file), selector)
    expect(body).toMatch(/background:\s*var\(--mint-bg\)/)
    expect(body).toMatch(/color:\s*var\(--mint-label\)/)
  })
})
