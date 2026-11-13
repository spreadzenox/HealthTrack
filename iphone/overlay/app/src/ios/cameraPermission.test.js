import { describe, it, expect, vi } from 'vitest'
import { requestCamera } from './cameraPermission'

// Version iOS (HealthTrack-iOS) : l'accès à l'appareil photo seul (FaceSense.requestCamera), sans lecture du visage
describe('requestCamera', () => {
  it('« granted » quand l’iPhone l’accorde, « denied » sinon', async () => {
    expect(await requestCamera({ requestCamera: vi.fn(async () => ({ granted: true })) })).toBe('granted')
    expect(await requestCamera({ requestCamera: vi.fn(async () => ({ granted: false })) })).toBe('denied')
  })

  it('sans module natif, ou sans la méthode (ancienne build) : « denied », sans erreur', async () => {
    expect(await requestCamera(null)).toBe('denied')
    expect(await requestCamera({ start: vi.fn() })).toBe('denied')
  })
})
