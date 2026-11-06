import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { keepWhole } from './keepWhole'

// KEEP-WHOLE (06/11, revue C1 à 360 px) : « Vos pistes du bien- / être arrivent dans 5 jours » se coupait au trait
// d'union. Les mots composés d'un titre restent d'un seul tenant, sans changer le texte (scripts et tests le cherchent tel quel).
describe('keepWhole', () => {
  it('garde un mot composé dans un span insécable, texte inchangé', () => {
    const { container } = render(<h3>{keepWhole('Vos pistes du bien-être arrivent dans 5 jours')}</h3>)
    expect(container.textContent).toBe('Vos pistes du bien-être arrivent dans 5 jours')
    const spans = container.querySelectorAll('span')
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe('bien-être')
    expect(spans[0].style.whiteSpace).toBe('nowrap')
  })

  it('traite chaque mot composé, majuscules et apostrophes comprises', () => {
    const { container } = render(<p>{keepWhole('Bien-être et peut-être aujourd’hui')}</p>)
    expect([...container.querySelectorAll('span')].map((s) => s.textContent)).toEqual(['Bien-être', 'peut-être'])
  })

  it('laisse un texte sans trait d’union tel quel', () => {
    expect(keepWhole('Vos pistes du ventre arrivent dans 3 jours')).toBe('Vos pistes du ventre arrivent dans 3 jours')
    expect(keepWhole('')).toBe('')
    expect(keepWhole('2026-11-06')).toBe('2026-11-06')
  })
})
