import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripJpegMetadata } from '../src/jpeg.js'

const segment = (marker, payload) => Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload])
const SOI = Buffer.from([0xff, 0xd8])
const SOS = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9])

test('retire EXIF (APP1), ICC (APP2) et commentaires, garde JFIF et les données', () => {
  const jfif = segment(0xe0, [0x4a, 0x46, 0x49, 0x46, 0])
  const exif = segment(0xe1, [...Buffer.from('Exif GPS 48.85N')])
  const icc = segment(0xe2, [1, 2, 3])
  const comment = segment(0xfe, [...Buffer.from('iPhone')])
  const dqt = segment(0xdb, [0, 1, 2])
  const input = Buffer.concat([SOI, jfif, exif, icc, comment, dqt, SOS])
  const out = stripJpegMetadata(input)
  assert.deepEqual(out, Buffer.concat([SOI, jfif, dqt, SOS]))
  assert.equal(out.includes(Buffer.from('GPS')), false)
})

test('ignore les octets de remplissage 0xFF entre segments', () => {
  const input = Buffer.concat([SOI, Buffer.from([0xff]), segment(0xe1, [9, 9]), SOS])
  assert.deepEqual(stripJpegMetadata(input), Buffer.concat([SOI, SOS]))
})

test('refuse ce qui n’est pas un JPEG complet', () => {
  assert.equal(stripJpegMetadata(Buffer.from('GIF89a…')), null)
  assert.equal(stripJpegMetadata(Buffer.concat([SOI, segment(0xe0, [1])])), null) // pas de données d'image
  assert.equal(stripJpegMetadata(Buffer.concat([SOI, Buffer.from([0xff, 0xe1, 0x40, 0x00, 1])])), null) // longueur fausse
  assert.equal(stripJpegMetadata(null), null)
})
