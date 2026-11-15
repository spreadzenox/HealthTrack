import { describe, it, expect, beforeEach } from 'vitest'
import { getHabits, setHabits, sanitizeHabits, HABITS_KEY } from './habits'
import { DELETED_KEYS } from '../services/deleteAllData'

describe('réglage des habitudes suivies', () => {
  beforeEach(() => localStorage.clear())

  it('ne suit aucune habitude par défaut', () => {
    expect(getHabits()).toEqual([])
  })

  it('garde les habitudes proposées dans leur ordre, et une seule habitude libre', () => {
    setHabits([{ id: 'custom:marche', label: 'Marche' }, { id: 'reading' }, { id: 'meditation' }, { id: 'custom:piano', label: 'Piano' }])
    expect(getHabits()).toEqual([
      { id: 'meditation', label: 'Méditation' },
      { id: 'reading', label: 'Lecture' },
      { id: 'custom:marche', label: 'Marche' },
    ])
  })

  it('écarte ce qui est illisible (fichier de sauvegarde abîmé)', () => {
    expect(sanitizeHabits('x')).toEqual([])
    expect(sanitizeHabits([null, 3, { id: 'inconnue' }, { id: 'custom:x', label: '' }, { id: 'reading', label: 'Autre' }]))
      .toEqual([{ id: 'reading', label: 'Lecture' }])
  })

  it('part avec « Supprimer toutes mes données »', () => {
    expect(DELETED_KEYS).toContain(HABITS_KEY)
  })
})
