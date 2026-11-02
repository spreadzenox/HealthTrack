import { describe, it, expect } from 'vitest'
import { faceModelTag } from './modelName'
import { describeFaceMood, faceMoodEstimate } from './faceMood'
import { modelLabel } from '../today'

const PLAY = { aiModelName: false }
const SIDELOAD = { aiModelName: true }

/** POL-PLAY-100 : aucun nom de modèle visible dans la variante play (décision du 31/10), visage compris. */
describe('nom technique des modèles du visage', () => {
  it('« (HSEmotion) » en sideload, rien en play', () => {
    expect(faceModelTag(SIDELOAD)).toBe(' (HSEmotion)')
    expect(faceModelTag(PLAY)).toBe('')
  })

  it('libellé du modèle de la carte Bien-être', () => {
    expect(modelLabel('va', SIDELOAD)).toBe('deux modèles valence / éveil (HSEmotion)')
    expect(modelLabel('va', PLAY)).toBe('deux modèles valence / éveil')
    expect(modelLabel('personal', PLAY)).toBe('calibré sur vos notes')
    expect(modelLabel('autre', PLAY)).toBe('autre')
  })

  it('explications de l’estimation (carte Lecture du visage)', () => {
    const burst = (h, values) => ({ type: 'face_burst', source: 'face_sense', at: new Date(2026, 9, 19, h).toISOString(),
      payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values } })
    const duo = { valence: 0.3, arousal: 0.1, affectGap: 0.05, affectModels: 2 }
    const est = faceMoodEstimate([burst(8, duo), burst(12, duo)], { now: new Date(2026, 9, 19, 22) })
    expect(est.model).toBe('va')
    const all = (f) => (describeFaceMood(est, { features: f }) || []).join(' ')
    expect(all(PLAY)).not.toMatch(/HSEmotion/)
    expect(all(SIDELOAD)).toMatch(/HSEmotion/)
  })
})
