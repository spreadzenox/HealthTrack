import { describe, it, expect, beforeEach } from 'vitest'
import { getBodySettings, setBodySettings, ageFromBirthYear, sanitizeBodySettings } from './bodySettings'

describe('bodySettings', () => {
  beforeEach(() => localStorage.clear())

  it('ne renvoie rien tant que rien n\'est saisi', () => {
    expect(getBodySettings()).toEqual({})
  })

  it('mémorise sexe, année de naissance et taille', () => {
    setBodySettings({ sex: 'F', birthYear: 1990, heightCm: 165 })
    expect(getBodySettings()).toEqual({ sex: 'F', birthYear: 1990, heightCm: 165 })
  })

  it('accepte des champs texte (formulaire) et écarte les valeurs invalides', () => {
    setBodySettings({ sex: 'X', birthYear: '1850', heightCm: '172' })
    expect(getBodySettings()).toEqual({ heightCm: 172 })
    setBodySettings({ sex: 'M', birthYear: '1985', heightCm: '' })
    expect(getBodySettings()).toEqual({ sex: 'M', birthYear: 1985 })
  })

  it('mémorise le niveau d\'activité choisi (valeur inconnue écartée)', () => {
    setBodySettings({ sex: 'F', activity: 'active' })
    expect(getBodySettings()).toEqual({ sex: 'F', activity: 'active' })
    setBodySettings({ activity: 'marathon' })
    expect(getBodySettings()).toEqual({})
  })

  it('sanitizeBodySettings nettoie un profil venu d\'ailleurs (sauvegarde)', () => {
    expect(sanitizeBodySettings({ sex: 'M', birthYear: 1980, heightCm: 180, activity: 'moderate', extra: 1 }))
      .toEqual({ sex: 'M', birthYear: 1980, heightCm: 180, activity: 'moderate' })
    expect(sanitizeBodySettings(null)).toEqual({})
    expect(sanitizeBodySettings('oops')).toEqual({})
  })

  it('ignore un contenu illisible', () => {
    localStorage.setItem('healthtrack_body_profile', '{oops')
    expect(getBodySettings()).toEqual({})
  })

  it('calcule l\'âge à partir de l\'année de naissance', () => {
    expect(ageFromBirthYear(1990, new Date('2026-10-11T10:00:00Z'))).toBe(36)
    expect(ageFromBirthYear(undefined)).toBeUndefined()
  })
})
