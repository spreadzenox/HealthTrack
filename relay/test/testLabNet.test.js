import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TESTLAB_RANGES, TESTLAB_RANGES_CHECKED, clientAddress, fromTestLabNetwork, ipv4ToInt, isTestLabAddress } from '../src/testLabNet.js'

test('adresses dans les blocs de Test Lab (bords compris)', () => {
  for (const ip of ['108.177.6.0', '108.177.7.255', '70.32.130.12', '34.68.194.71', '199.192.115.3', '172.217.120.191', '::ffff:108.177.6.9']) {
    assert.equal(isTestLabAddress(ip), true, ip)
  }
})

test('adresses hors des blocs', () => {
  for (const ip of ['108.177.8.0', '34.68.194.72', '199.192.115.4', '8.8.8.8', '90.12.34.56', '74.125.122.33', '216.239.44.25', '172.217.120.192']) {
    assert.equal(isTestLabAddress(ip), false, ip)
  }
})

test('IPv6, vide ou invalide : jamais le réseau de test', () => {
  for (const ip of [undefined, null, '', '2001:db8::1', '300.1.1.1', '108.177.6', 'abc', '108.177.6.1.2']) {
    assert.equal(isTestLabAddress(ip), false, String(ip))
  }
  assert.equal(ipv4ToInt('255.255.255.255'), 4294967295)
})

test('X-Forwarded-For : le dernier élément, celui que Cloud Run ajoute', () => {
  assert.equal(clientAddress('108.177.6.10'), '108.177.6.10')
  assert.equal(clientAddress('108.177.6.10, 90.12.34.56'), '90.12.34.56')
  assert.equal(clientAddress(' 90.12.34.56 ,108.177.6.10 '), '108.177.6.10')
  assert.equal(clientAddress(undefined), null)
  assert.equal(clientAddress(''), null)
  // Un client qui ajoute lui-même une adresse de Test Lab ne passe pas pour un robot
  assert.equal(fromTestLabNetwork({ headers: { 'x-forwarded-for': '108.177.6.10, 90.12.34.56' } }), false)
  assert.equal(fromTestLabNetwork({ headers: { 'x-forwarded-for': '90.12.34.56, 108.177.6.10' } }), true)
  assert.equal(fromTestLabNetwork({ headers: {} }), false)
  assert.equal(fromTestLabNetwork(undefined), false)
})

test('chaque bloc est un CIDR IPv4 valide', () => {
  for (const cidr of TESTLAB_RANGES) {
    const [base, bits] = cidr.split('/')
    assert.notEqual(ipv4ToInt(base), null, cidr)
    assert.ok(Number(bits) >= 16 && Number(bits) <= 32, cidr)
  }
})

test('relevé des blocs de moins de 13 mois (relire la page de Firebase une fois par an)', () => {
  const checked = new Date(`${TESTLAB_RANGES_CHECKED}T00:00:00Z`)
  const limit = new Date(checked)
  limit.setUTCMonth(limit.getUTCMonth() + 13)
  assert.ok(Date.now() < limit.getTime(), `Relevé du ${TESTLAB_RANGES_CHECKED} trop ancien : relire https://firebase.google.com/docs/test-lab/android/get-started et mettre à jour src/testLabNet.js`)
})
