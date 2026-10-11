import { describe, it, expect, beforeEach } from 'vitest'
import { getWithingsUserProfile, setWithingsUserProfile } from './withingsSettings'
import { withingsUserToProfile } from '../services/withingsApi'

describe('profil utilisateur Withings', () => {
  beforeEach(() => localStorage.clear())

  it('lit gender selon l\'API Withings : 0 = homme, 1 = femme', () => {
    const now = new Date('2026-10-11T10:00:00Z')
    const birthdate = Date.UTC(1990, 5, 15) / 1000
    expect(withingsUserToProfile({ gender: 0, birthdate }, now)).toEqual({ sex: 'M', age: 36 })
    expect(withingsUserToProfile({ gender: 1 }, now)).toEqual({ sex: 'F', age: undefined })
    expect(withingsUserToProfile({}, now).sex).toBeUndefined()
  })

  it('relit tel quel un profil enregistré par la version corrigée', () => {
    setWithingsUserProfile({ sex: 'M', age: 40 })
    expect(getWithingsUserProfile()).toEqual({ sex: 'M', age: 40 })
    expect(getWithingsUserProfile()).toEqual({ sex: 'M', age: 40 })
  })

  it('corrige une seule fois le sexe inversé d\'un ancien profil', () => {
    localStorage.setItem('healthtrack_withings_user', JSON.stringify({ sex: 'F', age: 40 }))
    expect(getWithingsUserProfile()).toEqual({ sex: 'M', age: 40 })
    expect(getWithingsUserProfile()).toEqual({ sex: 'M', age: 40 })
    localStorage.setItem('healthtrack_withings_user', JSON.stringify({ sex: 'M' }))
    expect(getWithingsUserProfile()).toEqual({ sex: 'F' })
  })

  it('garde un ancien profil sans sexe', () => {
    localStorage.setItem('healthtrack_withings_user', JSON.stringify({ age: 33 }))
    expect(getWithingsUserProfile()).toEqual({ age: 33 })
  })
})
