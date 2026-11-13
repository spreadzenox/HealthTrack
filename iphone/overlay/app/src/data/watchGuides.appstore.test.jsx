import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'

// Version iOS (HealthTrack-iOS) : sur iPhone, les montres passent par l'app Santé d'Apple ; ni Health Connect, ni
// Gadgetbridge, ni connexion Bluetooth directe (journal/RECHERCHE.md, recherche du 27/10/2026)
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import { watchGuidesFor } from './watchGuides'
import WatchGuides from '../components/WatchGuides'

const text = (guide) => [guide.title, guide.intro, guide.caveats, ...guide.steps.map((s) => (typeof s === 'string' ? s : renderToStaticMarkup(s)))].join(' ')

describe('Guides des montres sur iPhone', () => {
  it('chaque guide passe par l’app Santé, sans Health Connect, Gadgetbridge ni Android', () => {
    const guides = watchGuidesFor()
    // mêmes identifiants qu'Android (liens « Voir le guide » des appareils détectés), plus l'Apple Watch
    expect(guides.map((g) => g.id)).toEqual(['apple', 'huawei', 'samsung', 'xiaomi', 'garmin', 'other'])
    for (const g of guides) {
      expect(text(g)).not.toMatch(/Health Connect|Gadgetbridge|Android|F-Droid|Play Store/)
      expect(g.links ?? []).toEqual([])
    }
    expect(text(guides.find((g) => g.id === 'garmin'))).toMatch(/app Santé/)
    expect(text(guides.find((g) => g.id === 'samsung'))).toMatch(/ne s’associent pas à un iPhone/)
  })

  it('l’introduction parle de l’app Santé ; pas de liste d’étapes vide (Samsung)', () => {
    const { container } = render(<WatchGuides />)
    // Phrase d'Android depuis v673 (SLOP-1b-3) : « Choisissez sa marque : on vous montre comment envoyer ses mesures vers… »
    expect(screen.getByText(/envoyer ses mesures vers/)).toHaveTextContent('envoyer ses mesures vers l’app Santé.')
    expect(container.querySelectorAll('#guide-samsung ol')).toHaveLength(0)
    expect(container.querySelectorAll('#guide-garmin ol li')).toHaveLength(3)
  })
})
