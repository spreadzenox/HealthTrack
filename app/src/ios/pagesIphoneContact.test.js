import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// FUSION-4 : depuis la fusion (13/11), l'ancien dépôt de l'iPhone ne reçoit plus rien. Les pages embarquées de
// l'iPhone (Réglages → Confidentialité et Conditions) renvoient, comme la page d'assistance du site, aux tickets de
// ce dépôt.
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')

describe("pages embarquées de l'iPhone : contact", () => {
  for (const page of ['public/confidentialite-iphone.html', 'public/conditions-iphone.html']) {
    it(`${page} renvoie aux tickets de ce dépôt`, () => {
      const html = read(page)
      expect(html).not.toMatch(/HealthTrack-iOS/)
      expect(html).toContain('href="https://github.com/spreadzenox/HealthTrack/issues"')
    })
  }
})
