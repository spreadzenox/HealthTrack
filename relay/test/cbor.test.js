import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeCbor, decodeCborPrefix, CborError } from '../src/cbor.js'
import { encodeCbor } from './helpers/cborEncode.js'

const hex = (s) => Buffer.from(s.replace(/\s/g, ''), 'hex')

test('vecteurs de la RFC 8949 (annexe A) : entiers, octets, textes, tableaux, tables, simples', () => {
  assert.equal(decodeCbor(hex('00')), 0)
  assert.equal(decodeCbor(hex('17')), 23)
  assert.equal(decodeCbor(hex('1818')), 24)
  assert.equal(decodeCbor(hex('1903e8')), 1000)
  assert.equal(decodeCbor(hex('1a000f4240')), 1000000)
  assert.equal(decodeCbor(hex('1b000000e8d4a51000')), 1000000000000)
  assert.equal(decodeCbor(hex('20')), -1)
  assert.equal(decodeCbor(hex('3863')), -100)
  assert.equal(decodeCbor(hex('3903e7')), -1000)
  assert.deepEqual(decodeCbor(hex('4401020304')), Buffer.from([1, 2, 3, 4]))
  assert.equal(decodeCbor(hex('6449455446')), 'IETF')
  assert.equal(decodeCbor(hex('62c3bc')), 'ü')
  assert.deepEqual(decodeCbor(hex('8301820203820405')), [1, [2, 3], [4, 5]])
  assert.deepEqual(decodeCbor(hex('a201020304')), new Map([[1, 2], [3, 4]]))
  assert.deepEqual(decodeCbor(hex('a26161016162820203')), new Map([['a', 1], ['b', [2, 3]]]))
  assert.equal(decodeCbor(hex('f4')), false)
  assert.equal(decodeCbor(hex('f5')), true)
  assert.equal(decodeCbor(hex('f6')), null)
})

test('aller-retour sur un objet en forme d’attestation App Attest', () => {
  const obj = new Map([
    ['fmt', 'apple-appattest'],
    ['attStmt', new Map([['x5c', [Buffer.alloc(600, 1), Buffer.alloc(500, 2)]], ['receipt', Buffer.alloc(3000, 3)]])],
    ['authData', Buffer.alloc(164, 4)],
  ])
  assert.deepEqual(decodeCbor(encodeCbor(obj)), obj)
})

test('decodeCborPrefix rend la fin de la valeur et laisse la suite', () => {
  const bytes = Buffer.concat([Buffer.from([9, 9]), encodeCbor(new Map([[1, 2]])), Buffer.from([0xaa])])
  const { value, end } = decodeCborPrefix(bytes, 2)
  assert.deepEqual(value, new Map([[1, 2]]))
  assert.equal(end, bytes.length - 1)
})

const rejects = (bytes, reason, limits) =>
  assert.throws(() => decodeCbor(bytes, limits), (e) => e instanceof CborError && e.reason === reason)

test('refuse ce que le relais n’a pas à lire', () => {
  rejects(hex('5f42010243030405ff'), 'longueur indéfinie')
  rejects(hex('9fff'), 'longueur indéfinie')
  rejects(hex('c11a514b67b0'), 'étiquette non prise en charge')
  rejects(hex('f93c00'), 'valeur simple ou flottant non pris en charge')
  rejects(hex('fb3ff199999999999a'), 'valeur simple ou flottant non pris en charge')
  rejects(hex('1c'), 'argument réservé')
  rejects(hex('1bffffffffffffffff'), 'entier trop grand')
  rejects(hex('62c328'), 'texte UTF-8 invalide')
  rejects(hex('a2010201 03'), 'clé en double')
  rejects(hex('a1 80 01'), 'clé de table inattendue')
})

test('refuse les données tronquées ou suivies d’octets en trop', () => {
  rejects(hex(''), 'tronqué')
  rejects(hex('19 03'), 'tronqué')
  rejects(hex('44 0102'), 'tronqué')
  rejects(hex('83 0102'), 'tronqué')
  rejects(hex('00 00'), 'octets en trop')
  assert.throws(() => decodeCbor('a1'), CborError)
})

test('bornes : profondeur, nombre d’éléments, taille', () => {
  rejects(Buffer.alloc(40, 0x81), 'imbrication trop profonde')
  rejects(encodeCbor(Array.from({ length: 20 }, () => 0)), 'trop d’éléments', { maxItems: 10 })
  // Un tableau qui annonce 4 milliards d'éléments est refusé avant toute allocation
  rejects(hex('9a ffffffff'), 'trop d’éléments')
  rejects(Buffer.alloc(70 * 1024), 'trop long')
})
