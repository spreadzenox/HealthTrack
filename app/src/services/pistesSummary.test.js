import { describe, it, expect, beforeEach } from 'vitest'
import { PISTES_SUMMARY_KEY, pisteTouchingToday, readPistesSummary, rememberPistesSummary, summarizePistes } from './pistesSummary'
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
    expect(s).toEqual({ gut: ['Oignon → digestion'], levers: ['Marcher davantage'], leverVars: [null] })
  })

  it('préfère le titre « facteur → effet » à l’action impérative (POL-PLAY-32)', () => {
    const s = summarizePistes(analysis({ levers: [{ action: 'Dormir un peu plus longtemps', title: 'Nuits plus longues → meilleur bien-être' }] }))
    expect(s.levers).toEqual(['Nuits plus longues → meilleur bien-être'])
  })

  it('laisse de côté les pistes masquées dans Analyses (I86)', () => {
    const levers = [{ variable: 'steps', action: 'Marcher davantage' }, { variable: 'sleep', action: 'Dormir plus' }]
    expect(summarizePistes(analysis({ levers }), ['steps']).levers).toEqual(['Dormir plus'])
    localStorage.setItem('healthtrack_hidden_links', JSON.stringify(['sleep']))
    expect(summarizePistes(analysis({ levers })).levers).toEqual(['Marcher davantage'])
  })

  it('pas assez de jours et aucune piste du ventre : rien à résumer (la carte garde son compte à rebours)', () => {
    expect(summarizePistes(analysis({ status: 'not_enough_data' }))).toBeNull()
    expect(summarizePistes(analysis({ status: 'not_enough_data', gut: ['Ail'] }))).toEqual({ gut: ['Ail → digestion'], levers: [], leverVars: [] })
    expect(summarizePistes(null)).toBeNull()
  })

  it('mémorise et relit le résumé, l’efface quand il n’y a plus rien', () => {
    rememberPistesSummary(analysis({ levers: [{ action: 'Dormir plus' }] }), new Date('2026-10-28T10:00:00Z'))
    expect(readPistesSummary()).toEqual({ gut: [], levers: ['Dormir plus'], leverVars: [null], at: '2026-10-28T10:00:00.000Z' })
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

describe('summarizePistes — pistes digestives masquées (I86)', () => {
  it('ne cite plus une piste repas → digestion masquée', () => {
    const s = summarizePistes(analysis({ gut: ['Oignon', 'Ail'] }), ['gut:oignon'])
    expect(s.gut).toEqual(['Ail → digestion'])
  })
})

describe('pisteTouchingToday (TESTEUR-1d-3)', () => {
  const sleepLever = { variable: 'sleepMinutes', title: 'Nuits plus longues → meilleur bien-être' }
  const stepsLever = { variable: 'steps', title: 'Plus de pas → meilleur bien-être' }
  const proteinLever = { variable: 'protein_g', title: 'Plus de protéines → meilleur bien-être' }
  const item = (key, text) => ({ key, text, direction: 'down', score: 2 })

  it('garde la variable de chaque piste, alignée sur son titre', () => {
    const s = summarizePistes(analysis({ levers: [proteinLever, { variable: 'x' }, sleepLever] }))
    expect(s.levers).toEqual([proteinLever.title, sleepLever.title])
    expect(s.leverVars).toEqual(['protein_g', 'sleepMinutes'])
  })

  it('choisit la piste la plus solide qui touche une mesure du jour', () => {
    const s = summarizePistes(analysis({ levers: [proteinLever, stepsLever, sleepLever] }))
    const found = pisteTouchingToday(s, [item('sleep', 'Nuit plus courte'), item('steps', 'Plus de pas')])
    expect(found).toEqual({ title: stepsLever.title, today: 'plus de pas' })
  })

  it('le temps d’écran du jour touche la piste « temps d’écran »', () => {
    const s = summarizePistes(analysis({ levers: [{ variable: 'screen_minutes', title: 'Moins de temps d’écran → meilleur bien-être' }] }))
    expect(pisteTouchingToday(s, [item('screen', 'Plus de temps d’écran')]).today).toBe('plus de temps d’écran')
  })

  it('rien quand aucune piste ne touche le jour, sans écart, ou avec un ancien résumé sans variables', () => {
    const s = summarizePistes(analysis({ levers: [proteinLever] }))
    expect(pisteTouchingToday(s, [item('sleep', 'Nuit plus courte')])).toBeNull()
    expect(pisteTouchingToday(summarizePistes(analysis({ levers: [sleepLever] })), [])).toBeNull()
    expect(pisteTouchingToday({ gut: [], levers: [sleepLever.title] }, [item('sleep', 'Nuit plus courte')])).toBeNull()
    expect(pisteTouchingToday(null, [item('sleep', 'Nuit plus courte')])).toBeNull()
  })

  it('les mesures du corps (VFC, FC au repos) ne sont jamais des pistes à tester', () => {
    const s = summarizePistes(analysis({ levers: [sleepLever] }))
    expect(pisteTouchingToday(s, [item('hrv', 'VFC de la nuit plus basse'), item('restingHr', 'Cœur au repos plus rapide')])).toBeNull()
  })
})
