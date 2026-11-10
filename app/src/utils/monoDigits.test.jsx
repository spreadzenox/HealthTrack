import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { monoDigits } from './monoDigits'

const monos = (c) => [...c.querySelectorAll('.mono')].map((s) => s.textContent)

describe('monoDigits (leçon 11 : mono pour les chiffres seulement)', () => {
  it('« 6 h 30 » : les nombres en mono, « h » dans la police du texte, texte inchangé', () => {
    const { container } = render(<p>{monoDigits('6 h 30')}</p>)
    expect(container.textContent).toBe('6 h 30')
    expect(monos(container)).toEqual(['6', '30'])
  })

  it('espace des milliers et virgule hors mono (sinon « 10  085 », « 36 , 6 ») ; le signe reste avec ses chiffres', () => {
    const { container } = render(<p>{monoDigits('2\u202f285 kcal · +0,4 pt · −1,2')}</p>)
    expect(container.textContent).toBe('2\u202f285 kcal · +0,4 pt · −1,2')
    expect(monos(container)).toEqual(['2', '285', '+0', '4', '−1', '2'])
  })

  it('« 1 922 entrées » : l’espace entre le nombre et le mot reste hors mono', () => {
    const { container } = render(<p>{monoDigits('1 922 entrées')}</p>)
    expect(monos(container)).toEqual(['1', '922'])
    // le groupe avant l’espace des milliers prend une petite marge ; rien avant « entrées »
    expect([...container.querySelectorAll('.mono-sep')].map((x) => x.textContent)).toEqual(['1'])
    expect(container.textContent).toBe('1 922 entrées')
  })

  it('sans chiffre : le texte tel quel', () => {
    expect(monoDigits('—')).toBe('—')
    expect(monoDigits('')).toBe('')
    expect(monoDigits(null)).toBe(null)
  })
})
