import { describe, it, expect } from 'vitest'
import { connectAndAuthenticate, createKeyStore, connectAdvice, findBondedWatch } from './pairing'
import { createFakeWatch, TEST_SECRETS } from './testing/fakeWatch'

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), dump: () => [...m.values()].join('\n') }
}

const run = (watch, opts = {}) =>
  connectAndAuthenticate({ transport: watch.transport, watchKey: 'AA:BB:CC:DD:EE:FF', watchName: 'HUAWEI WATCH GT 6 Pro-1A2', timeoutMs: 500, bindTimeoutMs: 500, ...opts })

describe('connexion authentifiée à une montre Huawei (HiChain)', () => {
  it('premier appairage : PIN → liaison → authentification → échange chiffré (GCM)', async () => {
    const watch = createFakeWatch()
    const storage = memoryStorage()
    const keyStore = createKeyStore(storage)
    const report = await run(watch, { keyStore, secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('connected')
    expect(report.firstPairing).toBe(true)
    expect(report.battery).toBe(87)
    expect(report.steps.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'skip'])
    expect(watch.seen).toEqual(['1/1', '1/22', '1/51', '1/44', '1/40', '1/40', '1/40', '1/40', '1/40', '1/40', '1/40', '1/8*'])
    const keys = keyStore.get('AA:BB:CC:DD:EE:FF')
    expect(keys.authId).toMatch(/^[0-9A-F]{32}$/)
    expect(keys.authToken).toMatch(/^[0-9a-f]{64}$/)
    // le journal ne contient ni la clé, ni l'adresse complète
    const json = JSON.stringify(report)
    expect(json).not.toContain(keys.authToken)
    expect(json).not.toContain('AA:BB:CC:DD')
    expect(report.frames.every((f) => !('hex' in f))).toBe(true)
  })

  it('connexions suivantes : authentification seule, sans PIN ni constantes', async () => {
    const watch = createFakeWatch()
    const keyStore = createKeyStore(memoryStorage())
    await run(watch, { keyStore, secrets: TEST_SECRETS })
    watch.seen.length = 0
    const again = await run(watch, { keyStore, secrets: null })
    expect(again.outcome.code).toBe('connected')
    expect(again.firstPairing).toBe(false)
    expect(again.steps.find((s) => s.id === 'bind').status).toBe('skip')
    expect(watch.seen).not.toContain('1/44')
  })

  it('chiffrement CBC (méthode 0) et IV aléatoire du type 4', async () => {
    for (const opts of [{ encryptMethod: 0, authVersion: 3 }, { deviceSupportType: 4, encryptMethod: 1, authVersion: 1 }]) {
      const report = await run(createFakeWatch(opts), { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
      expect(report.outcome.code).toBe('connected')
    }
  })

  it('sans constantes au premier appairage → « need_secrets », rien n’est envoyé au-delà de la négociation', async () => {
    const watch = createFakeWatch()
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()) })
    expect(report.outcome.code).toBe('need_secrets')
    expect(watch.seen).not.toContain('1/44')
    expect(connectAdvice(report)[0]).toMatch(/Télécharger les paramètres/)
  })

  it('clé gardée refusée (montre réinitialisée ou liée ailleurs) → « key_rejected » ; « rebind » refait la liaison', async () => {
    const watch = createFakeWatch()
    const keyStore = createKeyStore(memoryStorage())
    await run(watch, { keyStore, secrets: TEST_SECRETS })
    watch.reset()
    const rejected = await run(watch, { keyStore, secrets: TEST_SECRETS })
    expect(rejected.outcome.code).toBe('key_rejected')
    expect(connectAdvice({ outcome: { code: 'key_rejected' } }).join(' ')).not.toMatch(/dissoci/i)
    const rebound = await run(watch, { keyStore, secrets: TEST_SECRETS, rebind: true })
    expect(rebound.outcome.code).toBe('connected')
    expect(rebound.firstPairing).toBe(true)
  })

  it('mauvaises constantes → PIN illisible → « pin_failed »', async () => {
    const wrong = { v1: '00'.repeat(16), v2: '11'.repeat(16), v3: '22'.repeat(16) }
    const report = await run(createFakeWatch(), { keyStore: createKeyStore(memoryStorage()), secrets: wrong })
    expect(report.outcome.code).toBe('pin_failed')
  })

  it('HiChain Lite / mode classique → « unsupported » ; montre muette → échec avec délai', async () => {
    const lite = await run(createFakeWatch({ negotiation: [{ tag: 2, value: [1] }] }), { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(lite.outcome.code).toBe('unsupported')
    const legacy = await run(createFakeWatch({ deviceSupportType: 0 }), { keyStore: createKeyStore(memoryStorage()) })
    expect(legacy.outcome.code).toBe('unsupported')
    const mute = await run(createFakeWatch({ silentOn: 0x33 }), { keyStore: createKeyStore(memoryStorage()), timeoutMs: 50 })
    expect(mute.outcome.code).toBe('failed')
    expect(mute.steps.find((s) => s.id === 'negotiate').detail).toMatch(/Pas de réponse/)
  })

  it('GT 6 Pro (journal 13/10 17:03) : JSON 0x28 suivi d’un NUL sur tout le parcours → appairage complet (§6.9)', async () => {
    const watch = createFakeWatch({ deviceSupportType: 4, encryptMethod: 1, authVersion: 1, trailingNul: 1 })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'bind').status).toBe('ok')
    // toutes les réponses 0x28 (liaison + authentification) sont lues, l'octet de fin est compté dans le journal
    expect(report.hichain.map((h) => h.class)).not.toContain('json_unparsable')
    expect(report.hichain[0]).toMatchObject({ operation: 'bind', class: 'json_ok', message: '0x8001', trailingBytes: 1 })
    expect(report.tokenCheck).toBeNull()
  })

  it('jeton calculé par la montre avec une autre clé de base du PIN → variante retenue, nommée dans le journal (§6.10)', async () => {
    const watch = createFakeWatch({ trailingNul: 1, pin: Uint8Array.of(0xab, 0xcd, 0xef, 0x12), pinBaseVariant: 'sha256-hex-minuscule' })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('connected')
    expect(report.log.map((l) => l.msg).join('\n')).toMatch(/variante « sha256-hex-minuscule »/)
  })

  it('jeton dans un autre ordre → échec « failed » (pas « PIN refusé ») qui nomme la combinaison, sans valeur', async () => {
    const watch = createFakeWatch({ tokenOrder: 'identifiants-inversés' })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('failed')
    expect(report.steps.find((s) => s.id === 'bind').detail).toMatch(/variante « sha256-hex-majuscule \+ identifiants-inversés »/)
    expect(report.tokenCheck).toMatchObject({ matched: 'sha256-hex-majuscule + identifiants-inversés', sizes: { idSelf: 32, randPeer: 16, seed: 32 } })
    expect(JSON.stringify(report.tokenCheck)).not.toMatch(/[0-9a-f]{32}/i)
  })

  it('réponse 0x28 illisible (cas GT 6 Pro) : le journal nomme l’étape, la classe et la structure, sans secret', async () => {
    const watch = createFakeWatch({ deviceSupportType: 4, encryptMethod: 1, authVersion: 1, garbleHichain: { size: 835 } })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('failed')
    const bind = report.steps.find((s) => s.id === 'bind')
    expect(bind.status).toBe('fail')
    expect(bind.detail).toMatch(/illisible.*835 octets/)
    // l'analyse structurée est dans le journal exporté, pour le run suivant
    expect(report.hichain).toHaveLength(1)
    expect(report.hichain[0]).toMatchObject({ operation: 'bind', class: 'json_unparsable', jsonLength: 835 })
    expect(report.hichain[0].head).toMatch(/^ff ff/)
  })

  it('réponse « New Auth Protocol » (HiChain 3) : le journal nomme et dimensionne les champs SPEKE, sans valeur', async () => {
    const watch = createFakeWatch({ deviceSupportType: 4, encryptMethod: 1, authVersion: 1, newAuthHichain: true })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('failed')
    // L'écran nomme les champs ET leur taille en octets (epk 32, salt 16, challenge 16) : de quoi
    // décoder la réponse d'un seul journal (§6.8).
    expect(report.steps.find((s) => s.id === 'bind').detail).toMatch(/champs repérés : challenge \(16 o\), epk \(32 o\), salt \(16 o\)/)
    const emb = report.hichain[0].structure.embeddedJson
    expect(emb.payloadKeys).toEqual(['challenge', 'epk', 'salt'])
    expect(emb.payloadFields).toEqual([
      { key: 'challenge', bytes: 16 },
      { key: 'epk', bytes: 32 },
      { key: 'salt', bytes: 16 },
    ])
    expect(emb.message).toBe('0x8001')
    // L'analyse ne porte que des noms et des tailles de champs, jamais leurs valeurs.
    expect(Object.keys(emb).sort()).toEqual(['fields', 'keys', 'message', 'offset', 'payloadFields', 'payloadKeys'])
    const json = JSON.stringify(report.hichain[0])
    for (const field of emb.payloadFields) expect(field).not.toHaveProperty('value')
    // Aucune valeur hexadécimale de 32/64 caractères (challenge/salt/epk) ne fuit dans le journal.
    expect(json).not.toMatch(/[0-9a-f]{32}/i)
  })

  it('montre appairée à Android retrouvée par son nom', async () => {
    const classic = { listBonded: async () => ({ devices: [{ name: 'Galaxy Buds', deviceId: '1' }, { name: 'HUAWEI WATCH GT 6 Pro-1A2', deviceId: '2' }] }) }
    expect((await findBondedWatch(classic)).deviceId).toBe('2')
  })
})
