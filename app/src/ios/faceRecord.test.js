import { describe, it, expect } from 'vitest'
import { parseFaceBurst, moodFaceBursts } from '../services/faceBursts'

// Version iOS (HealthTrack-iOS) : le JSON d'une rafale écrit par ios/HalcyaFace (FaceRecord.swift, I7) doit être lu par
// l'import d'Android sans rien y changer. Textes identiques à ceux que vérifient les tests Swift (FaceRecordTests).
describe('rafale du visage écrite sur iPhone, lue par l’import d’Android', () => {
  it('rafale valide (indices, mobilité, lumière, à 4 décimales) : entrée face_burst comptée pour l’humeur', () => {
    const json = '{"v":1,"at":1760000000000,"trigger":"app_open","frames":3,"valid":2,"values":{"smile":0.1235,'
      + '"duchenne":0.0000,"browDown":0.0812,"browInnerUp":0.0400,"mouthFrown":0.0031,"eyeOpen":0.8100,"jawOpen":0.0100,'
      + '"asymmetry":0.0200,"yaw":-4.5000,"mobility":0.0000,"light":0.4230},"rejected":{"too_dark":1},'
      + '"ms":{"camera":812,"inference":95}}'
    const entry = parseFaceBurst(json)
    expect(entry).toMatchObject({ type: 'face_burst', source: 'face_sense', at: '2025-10-09T08:53:20.000Z' })
    expect(entry.payload).toMatchObject({ v: 1, trigger: 'app_open', frames: 3, valid: 2, rejected: { too_dark: 1 } })
    expect(entry.payload.values).toMatchObject({ smile: 0.1235, yaw: -4.5, mobility: 0, light: 0.423 })
    expect(entry.payload.values.valence).toBeUndefined() // éteinte sur iPhone (licence des poids, DEMANDES.md)
    expect(moodFaceBursts([entry])).toHaveLength(1)
  })

  it('rafale sans visage : rejets gardés seuls', () => {
    const json = '{"v":1,"at":5,"trigger":"manual","frames":3,"valid":0,"rejected":{"no_face":1,"too_dark":2},"ms":{"camera":0,"inference":0}}'
    const entry = parseFaceBurst(json)
    expect(entry.payload).toMatchObject({ valid: 0, rejected: { no_face: 1, too_dark: 2 } })
    expect(entry.payload.values).toBeUndefined()
  })
})
