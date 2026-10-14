import { describe, it, expect } from 'vitest'
import {
  agreementTlvs,
  associationState,
  dateFormatTlvs,
  extendedAccountTlvs,
  languageTlvs,
  phoneInfoReply,
  runAssociation,
  setupStatusTlvs,
  thresholdTlvs,
  timezoneTlvs,
  userInfoTlvs,
} from './association'
import { decodeTlvs, encodeFrame, toHex } from './protocol'
import { connectAndAuthenticate, createKeyStore } from './pairing'
import { createFakeWatch, TEST_SECRETS } from './testing/fakeWatch'

const ascii = (bytes) => new TextDecoder().decode(Uint8Array.from(bytes))
const plain = (tlvs) => tlvs.map((t) => ({ ...t, value: Array.from(t.value) }))

describe('fin d’association : messages (§6.12)', () => {
  it('0x1A/0x05 sans compte : un seul octet 0 ; avec compte : ASCII ; capacité 172 → étiquette 3', () => {
    expect(extendedAccountTlvs(null)).toEqual([{ tag: 1, value: [0] }])
    expect(extendedAccountTlvs('12345678901234567', { otherAccount: true })).toEqual([
      { tag: 1, value: Array.from('12345678901234567', (c) => c.charCodeAt(0)) },
      { tag: 3, value: [1] },
    ])
  })

  it('1/0x30 : trois accords acceptés, version et heure en ms (texte)', () => {
    const items = decodeTlvs(Uint8Array.from(agreementTlvs(1760427000123)[0].value))
    expect(items).toHaveLength(3)
    const fields = items.map((i) => decodeTlvs(Uint8Array.from(i.value)))
    expect(fields.map((f) => ascii(f.find((t) => t.tag === 3).value))).toEqual([
      'software_update_service_statement',
      'device_information_management',
      'user_license_agreement',
    ])
    for (const f of fields) {
      expect(Array.from(f.find((t) => t.tag === 4).value)).toEqual([1])
      expect(ascii(f.find((t) => t.tag === 5).value)).toBe('20230508-20230508-0-0')
      expect(ascii(f.find((t) => t.tag === 6).value)).toBe('1760427000123')
    }
  })

  it('1/0x3E : trame d’exemple « appareil principal » avec le nom de la montre', () => {
    const frame = encodeFrame(1, 0x3e, setupStatusTlvs('GT6'))
    expect(toHex(frame.slice(0, -2))).toBe('5a 00 0e 00 01 3e 01 01 01 02 03 47 54 36 03 01 00')
    expect(setupStatusTlvs('')[1].value.length).toBeGreaterThan(0)
  })

  it('7/0x02 : profil ; sexe inconnu omis sauf si la montre l’accepte', () => {
    expect(userInfoTlvs({ heightCm: 180, weightKg: 75, age: 35, birthYear: 1991, sex: 'M' })).toEqual([
      { tag: 1, value: [180] },
      { tag: 2, value: [75] },
      { tag: 3, value: [35] },
      { tag: 4, value: [0x07, 0xc7, 7, 1] },
      { tag: 5, value: [1] },
      { tag: 6, value: [76] },
      { tag: 7, value: [149] },
    ])
    expect(userInfoTlvs({}).map((t) => t.tag)).toEqual([1, 2, 6, 7])
    expect(userInfoTlvs({}, { unknownGender: true }).find((t) => t.tag === 5).value).toEqual([3])
  })

  it('7/0x0E : seuils, 3e valeur selon l’heure ; fuseau, langue, format', () => {
    const entries = (h) => decodeTlvs(Uint8Array.from(thresholdTlvs(h)[0].value)).map((t) => Array.from(t.value))
    expect(entries(10)).toEqual([[1, 3, 0x01, 0xf4, 2], [3, 3, 0, 100, 2], [4, 3, 0x0e, 0x10, 2]])
    expect(entries(3)[2]).toEqual([4, 3, 0x54, 0x60, 2])
    const tz = timezoneTlvs(Date.UTC(2026, 9, 14, 8), 120, 'Europe/Paris')
    expect(tz[1].value).toEqual([2, 0])
    expect(ascii(tz[2].value)).toBe('Europe/Paris')
    expect(timezoneTlvs(0, -330, 'X')[1].value).toEqual([128 + 5, 30])
    expect(ascii(languageTlvs()[0].value)).toBe('fr-FR')
    expect(plain(decodeTlvs(Uint8Array.from(dateFormatTlvs()[0].value)))).toEqual([{ tag: 2, value: [3] }, { tag: 3, value: [2] }])
  })

  it('1/0x10 : une réponse par étiquette demandée ; accusé seul → pas de réponse', () => {
    const reply = phoneInfoReply([0, 2, 4, 8, 0x0f, 0x10, 0x11, 0x15].map((tag) => ({ tag, value: [] })))
    expect(reply).toEqual([
      { tag: 2 },
      { tag: 4 },
      { tag: 8, value: [0x31, 0x34] },
      { tag: 0x10, value: [0] },
      { tag: 0x11, value: [0x5f, 0x5f, 0xa3, 0x98] },
      { tag: 0x15 },
    ])
    expect(phoneInfoReply([{ tag: 0x7f, value: [0, 1, 0x86, 0xa0] }])).toBeNull()
  })
})

/** Fausse session : rend un accusé ou se tait selon `answers`. */
function fakeSession(answers = {}) {
  const sent = []
  return {
    sent,
    async send(s, c) {
      sent.push(`${s}/${c}`)
    },
    async request(s, c) {
      sent.push(`${s}/${c}`)
      const a = answers[`${s}/${c}`]
      if (a === 'silent' || a === undefined) throw new Error(`Pas de réponse de la montre (${s}/${c}) en 1 s`)
      return { tlvs: [{ tag: 0x7f, value: a === 'refuse' ? [0, 1, 0x86, 0xa2] : [0, 1, 0x86, 0xa0] }] }
    },
  }
}

describe('fin d’association : déroulé', () => {
  it('montre muette : rien ne lève, chaque étape dit « silent », 1/0x3E part quand même', async () => {
    const session = fakeSession()
    const a = await runAssociation(session, { watchName: 'W' })
    expect(a.sentSetupStatus).toBe(true)
    expect(a.accepted).toBe(0)
    expect(a.steps.find((s) => s.id === 'agreement').status).toBe('silent')
    expect(session.sent).toContain('1/62')
  })

  it('capacités : ce que la montre refuse est sauté ; FC / SpO₂ auto seulement la 1re fois', async () => {
    const caps = {
      services: new Map([[0x1a, false]]),
      commands: new Map([['1/48', false], ['1/62', true], ['7/23', true], ['7/36', true]]),
      expand: Array(32).fill(0), // capacité 109 absente → pas de 1/0x3E
    }
    const session = fakeSession({ '7/2': 'refuse', '1/7': 'ok' })
    const a = await runAssociation(session, { caps, firstTime: false })
    expect(session.sent).not.toContain('26/5')
    expect(session.sent).not.toContain('1/48')
    expect(session.sent).not.toContain('1/62')
    expect(session.sent).not.toContain('7/23')
    expect(a.refused).toBe(1)
    expect(a.steps.find((s) => s.id === 'user_info').code).toBe(100002)
    const expand = Array(32).fill(0)
    expand[109 >> 3] = 1 << (109 & 7)
    const again = fakeSession()
    await runAssociation(again, { caps: { ...caps, expand }, firstTime: true })
    expect(again.sent).toEqual(expect.arrayContaining(['1/62', '1/61', '7/23', '7/36']))
  })

  it('état présenté : confirmé > écran d’association vu > envoyé > rien', () => {
    expect(associationState({}).code).toBe('pending')
    expect(associationState({ association: { sentSetupStatus: true } }).code).toBe('likely')
    expect(associationState({ association: { sentSetupStatus: true, userSaw: 'pairing_screen' } }).code).toBe('not_associated')
    expect(associationState({ association: { freshData: true } }).code).toBe('confirmed')
    expect(associationState({ association: { accepted: 0 } }).code).toBe('pending')
  })
})

describe('fin d’association : avec la fausse montre', () => {
  const memoryStorage = () => {
    const m = new Map()
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
  }
  const run = (watch, opts) =>
    connectAndAuthenticate({ transport: watch.transport, watchKey: 'K', watchName: 'HUAWEI WATCH GT 6 Pro-1A2', timeoutMs: 300, bindTimeoutMs: 300, ...opts })

  it('répond aux infos du téléphone, déclare l’appareil principal, garde la trace sans valeur personnelle', async () => {
    const watch = createFakeWatch({ deviceSupportType: 4, encryptMethod: 0, askPhoneInfo: [2, 4, 8, 0x11] })
    const keyStore = createKeyStore(memoryStorage())
    const report = await run(watch, { keyStore, secrets: TEST_SECRETS, accountId: null, profile: async () => ({ heightCm: 181, weightKg: 77 }) })
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'associate').status).toBe('ok')
    expect(watch.state.associated).toBe('HUAWEI WATCH GT 6 Pro-1A2')
    expect(watch.state.phoneInfo).toEqual([2, 4, 8, 0x11])
    expect(report.association).toMatchObject({ sentSetupStatus: true, refused: 0, phoneInfoRequests: { phoneInfo: 1 }, userSaw: null })
    expect(report.association.deviceStatus).toBe(1)
    expect(JSON.stringify(report.association)).not.toContain('181')
    expect(keyStore.get('K').configuredAt).toBeTruthy()
    // reconnexion : file rejouée, mais FC / SpO₂ automatiques déjà activées
    watch.seen.length = 0
    await run(watch, { keyStore })
    expect(watch.seen).toContain('1/62*')
    expect(watch.seen).not.toContain('7/23*')
  })

  it('montre qui ignore l’association : connexion réussie quand même, étape en avertissement', async () => {
    const watch = createFakeWatch({ silentAssociation: true })
    const report = await run(watch, { keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS })
    expect(report.outcome.code).toBe('connected')
    expect(report.association.accepted).toBe(0)
    expect(report.association.sentSetupStatus).toBe(true)
  })
})
