import { describe, it, expect } from 'vitest'
import { computeTargetSize, stripJpegMetadata, MAX_IMAGE_SIDE } from './imagePrep'

function seg(marker, payload) {
  const len = payload.length + 2
  return [0xff, marker, (len >> 8) & 0xff, len & 0xff, ...payload]
}

describe('computeTargetSize', () => {
  it('ne grossit jamais une petite image', () => {
    expect(computeTargetSize(800, 600)).toEqual({ width: 800, height: 600 })
  })
  it('réduit le plus grand côté à la limite en gardant les proportions', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: MAX_IMAGE_SIDE, height: Math.round(MAX_IMAGE_SIDE * 0.75) })
    expect(computeTargetSize(3000, 4000)).toEqual({ width: Math.round(MAX_IMAGE_SIDE * 0.75), height: MAX_IMAGE_SIDE })
  })
  it('tolère des dimensions invalides', () => {
    expect(computeTargetSize(0, 0)).toBeNull()
    expect(computeTargetSize(NaN, 10)).toBeNull()
  })
})

describe('stripJpegMetadata', () => {
  const exif = seg(0xe1, [0x45, 0x78, 0x69, 0x66, 0, 0, 1, 2, 3]) // APP1 « Exif » (GPS, appareil…)
  const app0 = seg(0xe0, [0x4a, 0x46, 0x49, 0x46, 0]) // JFIF
  const com = seg(0xfe, [0x68, 0x69]) // commentaire
  const dqt = seg(0xdb, [9, 9, 9])
  const sos = [0xff, 0xda, 0, 4, 7, 7]
  const scan = [1, 2, 0xff, 0x00, 3, 0xff, 0xd9]

  it('retire EXIF (APP1), autres APPn et commentaires, garde l’image', () => {
    const input = new Uint8Array([0xff, 0xd8, ...app0, ...exif, ...com, ...dqt, ...sos, ...scan])
    const out = stripJpegMetadata(input)
    expect(Array.from(out)).toEqual([0xff, 0xd8, ...app0, ...dqt, ...sos, ...scan])
  })

  it('renvoie null si ce n’est pas un JPEG', () => {
    expect(stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
  })

  it('renvoie null si le fichier est tronqué', () => {
    expect(stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00, 1]))).toBeNull()
  })
})
