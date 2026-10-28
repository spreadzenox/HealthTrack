import { describe, it, expect, beforeEach } from 'vitest'
import { PISTES_SUMMARY_KEY, readPistesSummary, rememberPistesSummary, summarizePistes } from './pistesSummary'
import { DELETED_KEYS } from './deleteAllData'

const gutLink = (label) => ({ label, factor: label.toLowerCase(), together: [] })
const analysis = ({ gut = null, levers = [], status = 'ok' } = {}) => ({
  correlations: { status, levers },
  gut: gut ? { status: 'links', links: gut.map(gutLink) } : { status: 'none', links: [] },
})

describe('pistesSummary', () => {
  beforeEach(() => localStorage.clear())

  it('garde les titres montrés par Analyses : ventre d’abord, puis pistes à tester', () => {
    const s = summarizePistes(analysis({ gut: ['Oignon'], levers: [{ action: 'Marcher davantage' }] }))
    expect(s).toEqual({ gut: ['Oignon → ventre'], levers: ['Marcher davantage'] })
  })

  it('préfère le titre « facteur → effet » à l’action impérative (POL-PLAY-32)', () => {
    const s = summarizePistes(analysis({ levers: [{ action: 'Dormir un peu plus longtemps', title: 'Nuits plus longues → meilleur bien-être' }] }))
    expect(s.levers).toEqual(['Nuits plus longues → meilleur bien-être'])
  })

  it('pas assez de jours et aucune piste du ventre : rien à résumer (la carte garde son compte à rebours)', () => {
    expect(summarizePistes(analysis({ status: 'not_enough_data' }))).toBeNull()
    expect(summarizePistes(analysis({ status: 'not_enough_data', gut: ['Ail'] }))).toEqual({ gut: ['Ail → ventre'], levers: [] })
    expect(summarizePistes(null)).toBeNull()
  })

  it('mémorise et relit le résumé, l’efface quand il n’y a plus rien', () => {
    rememberPistesSummary(analysis({ levers: [{ action: 'Dormir plus' }] }), new Date('2026-10-28T10:00:00Z'))
    expect(readPistesSummary()).toEqual({ gut: [], levers: ['Dormir plus'], at: '2026-10-28T10:00:00.000Z' })
    rememberPistesSummary(analysis({ status: 'not_enough_data' }))
    expect(readPistesSummary()).toBeNull()
  })

  it('ignore un résumé illisible', () => {
    localStorage.setItem(PISTES_SUMMARY_KEY, '{oups')
    expect(readPistesSummary()).toBeNull()
    localStorage.setItem(PISTES_SUMMARY_KEY, '{"gut":"x"}')
    expect(readPistesSummary()).toBeNull()
  })

  it('est effacé avec « Supprimer toutes mes données » (il décrit des liens de santé)', () => {
    expect(DELETED_KEYS).toContain(PISTES_SUMMARY_KEY)
  })
})
