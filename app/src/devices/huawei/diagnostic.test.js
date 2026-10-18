import { describe, it, expect, vi } from 'vitest'
import { runHuaweiDiagnostic, redactDeviceId, isHuaweiWearable, pickWatch, verdictFor } from './diagnostic'
import { encodeFrame, decodeFrame, toHex } from './protocol'

const MAC = 'AA:BB:CC:DD:E1:F2'
const HUAWEI_SERVICE = '0000fe86-0000-1000-8000-00805f9b34fb'
const DIS = '0000180a-0000-1000-8000-00805f9b34fb'
const text = (s) => new DataView(new TextEncoder().encode(s).buffer)

const linkParamsAnswer = () =>
  encodeFrame(1, 1, [
    { tag: 1, value: [2] },
    { tag: 2, value: [0x02, 0x00] },
    { tag: 3, value: [0x01, 0xf4] },
    { tag: 4, value: [0x00, 0x1e] },
    { tag: 5, value: [0x00, 0x02, ...Array(16).fill(7)] },
    { tag: 7, value: [0x01] },
  ])

/** Fausse montre GT 6 Pro : `behaviour` choisit où elle échoue. */
function fakeClient({ behaviour = 'answers', advertise = true, bonded = true } = {}) {
  let notify = null
  const written = []
  return {
    written,
    scanMs: 1,
    getBondedDevices: async () => (bonded ? [{ deviceId: MAC, name: 'HUAWEI WATCH GT 6 Pro-F2' }, { deviceId: '11:22:33:44:55:66', name: 'Voiture' }] : []),
    requestLEScan: async (_o, cb) => {
      if (advertise) cb({ device: { deviceId: MAC, name: 'HUAWEI WATCH GT 6 Pro-F2' }, rssi: -55, manufacturerData: { 0x027d: new DataView(new ArrayBuffer(1)) } })
      cb({ device: { deviceId: 'tv', name: '[TV] Salon' }, rssi: -70 })
    },
    stopLEScan: async () => {},
    connect: vi.fn(async () => {
      if (behaviour === 'connect_fail') throw new Error('Connection timeout')
    }),
    disconnect: vi.fn(async () => {}),
    getServices: async () => [
      { uuid: DIS, characteristics: [{ uuid: '00002a24-0000-1000-8000-00805f9b34fb' }] },
      ...(behaviour === 'no_fe86' ? [] : [{ uuid: HUAWEI_SERVICE, characteristics: [{ uuid: '0000fe01-0000-1000-8000-00805f9b34fb' }, { uuid: '0000fe02-0000-1000-8000-00805f9b34fb' }] }]),
    ],
    read: async (_id, _s, c) => {
      if (c.startsWith('00002a24')) return text('GT6P\0')
      if (c.startsWith('00002a26')) return text('6.0.0.12')
      throw new Error('absent')
    },
    startNotifications: async (_id, _s, _c, cb) => {
      notify = cb
    },
    stopNotifications: vi.fn(async () => {}),
    write: async (_id, _s, _c, view) => {
      written.push(toHex(new Uint8Array(view.buffer)))
      if (behaviour === 'answers') {
        const frame = linkParamsAnswer()
        // réponse en deux notifications, comme une vraie montre au-delà de la taille d'un paquet BLE
        setTimeout(() => notify(new DataView(frame.slice(0, 10).buffer)), 5)
        setTimeout(() => notify(new DataView(frame.slice(10).buffer)), 10)
      }
    },
  }
}

const run = (client, extra = {}) =>
  runHuaweiDiagnostic({ client, detectApps: async () => [{ id: 'huawei_health', name: 'Huawei Health', package: 'com.huawei.health' }, { id: 'garmin', name: 'Garmin Connect' }], responseMs: 200, ...extra })

describe('diagnostic montre Huawei', () => {
  it('déroule toutes les étapes quand la montre répond, sans fuite d’adresse MAC', async () => {
    const client = fakeClient()
    const updates = []
    const report = await run(client, { onUpdate: (r) => updates.push(r) })
    expect(report.steps.map((s) => [s.id, s.status])).toEqual([
      ['bluetooth', 'ok'],
      ['apps', 'warn'],
      ['find', 'ok'],
      ['connect', 'ok'],
      ['services', 'ok'],
      ['subscribe', 'ok'],
      ['link', 'ok'],
    ])
    expect(report.apps.installed.map((a) => a.id)).toEqual(['huawei_health'])
    expect(report.watch).toMatchObject({ name: 'HUAWEI WATCH GT 6 Pro-F2', bonded: true, advertising: true, id: '…:E1:F2' })
    expect(report.watch.deviceInfo).toEqual({ modèle: 'GT6P', micrologiciel: '6.0.0.12' })
    expect(report.watch.linkParams).toMatchObject({ protocolVersion: 2, authVersion: 2, maxFrameSize: 512, authMode: 'hichain', otherTags: [] })
    expect(decodeFrame(Uint8Array.from(client.written[0].split(' ').map((b) => parseInt(b, 16)))).body[0]).toBe(1)
    expect(report.watch.frames.filter((f) => f.dir === 'in')).toHaveLength(2)
    expect(report.verdict.code).toBe('link_ok')
    expect(JSON.stringify(report)).not.toContain('AA:BB')
    expect(client.disconnect).toHaveBeenCalled()
    expect(updates.length).toBeGreaterThan(5)
  })

  it('montre muette → « no_answer », conseil sans jamais proposer de dissocier dans Huawei Santé', async () => {
    const report = await run(fakeClient({ behaviour: 'silent' }))
    expect(report.steps.find((s) => s.id === 'link').status).toBe('fail')
    expect(report.verdict.code).toBe('no_answer')
    const advice = report.verdict.advice.join(' ')
    expect(advice).toMatch(/Huawei Health/)
    expect(advice).toMatch(/Ne dissociez pas/)
  })

  it('connexion refusée → « connect_failed », étapes suivantes sautées', async () => {
    const report = await run(fakeClient({ behaviour: 'connect_fail' }))
    expect(report.verdict.code).toBe('connect_failed')
    expect(report.steps.find((s) => s.id === 'services').status).toBe('skip')
  })

  it('pas de service FE86 → « no_huawei_service »', async () => {
    const report = await run(fakeClient({ behaviour: 'no_fe86' }))
    expect(report.verdict.code).toBe('no_huawei_service')
    expect(report.watch.services.map((s) => s.uuid)).toEqual([DIS])
  })

  it('aucune montre → « not_found » ; une montre seulement appairée est tout de même essayée', async () => {
    expect((await run(fakeClient({ advertise: false, bonded: false }))).verdict.code).toBe('not_found')
    const report = await run(fakeClient({ advertise: false, bonded: true }))
    expect(report.steps.find((s) => s.id === 'find').detail).toMatch(/ne s’annonce pas/)
    expect(report.verdict.code).toBe('link_ok')
  })

  it('Bluetooth indisponible → « no_bluetooth »', async () => {
    const report = await run(fakeClient(), { ready: async () => { throw new Error('Bluetooth désactivé') } })
    expect(report.verdict.code).toBe('no_bluetooth')
  })
})

/** Faux plugin natif BtClassic (RFCOMM) : GT 6 Pro appairée, répond ou refuse. */
function fakeClassic({ behaviour = 'answers', bonded = true } = {}) {
  const listeners = {}
  const plugin = {
    connected: null,
    listBonded: async () => ({ devices: bonded ? [{ deviceId: MAC, name: 'HUAWEI WATCH GT 6 Pro-F2', type: 3, uuids: ['82FF3820-8411-400C-B85A-55BDB32CF060'] }] : [] }),
    addListener: async (event, cb) => {
      listeners[event] = cb
      return { remove: async () => delete listeners[event] }
    },
    connect: vi.fn(async (o) => {
      if (behaviour === 'refused') throw new Error('read failed, socket might closed')
      plugin.connected = o
    }),
    write: vi.fn(async ({ value }) => {
      if (behaviour !== 'answers') return
      expect(value).toMatch(/^5a000b00010101/)
      const hexFrame = toHex(linkParamsAnswer()).replace(/ /g, '')
      setTimeout(() => listeners.data?.({ value: hexFrame.slice(0, 20) }), 5)
      setTimeout(() => listeners.data?.({ value: hexFrame.slice(20) }), 10)
    }),
    disconnect: vi.fn(async () => {}),
  }
  return plugin
}

describe('diagnostic — Bluetooth classique (GT 3 → GT 7)', () => {
  it('passe par RFCOMM avec le service Huawei quand la montre est appairée', async () => {
    const classic = fakeClassic()
    const ble = fakeClient({ behaviour: 'no_fe86' })
    const report = await run(ble, { classic })
    expect(classic.connected).toMatchObject({ deviceId: MAC, uuid: '82ff3820-8411-400c-b85a-55bdb32cf060' })
    expect(report.watch.transport).toBe('classic')
    expect(report.verdict.code).toBe('link_ok')
    expect(report.steps.find((s) => s.id === 'services').detail).toBe('service Huawei présent')
    expect(ble.connect).not.toHaveBeenCalled()
    expect(classic.disconnect).toHaveBeenCalled()
    expect(report.watch.frames.filter((f) => f.via === 'classic' && f.dir === 'in')).toHaveLength(2)
  })

  it('service Huawei absent de la liste SDP en cache mais canal ouvert : pas d’avertissement (capture du 18/10, 15:03)', async () => {
    const classic = fakeClassic()
    const listBonded = classic.listBonded
    classic.listBonded = async () => {
      const r = await listBonded()
      r.devices[0].uuids = ['0000110a-0000-1000-8000-00805f9b34fb', '0000111f-0000-1000-8000-00805f9b34fb']
      return r
    }
    const report = await run(fakeClient({ behaviour: 'no_fe86' }), { classic })
    const step = report.steps.find((s) => s.id === 'services')
    expect(step.status).toBe('ok')
    expect(step.detail).toMatch(/joint en direct/)
    expect(report.verdict.code).toBe('link_ok')
  })

  it('RFCOMM refusé → essai en BLE, et le verdict dit pourquoi le classique a échoué', async () => {
    const report = await run(fakeClient({ behaviour: 'no_fe86' }), { classic: fakeClassic({ behaviour: 'refused' }) })
    expect(report.watch.attempts.map((a) => a.transport)).toEqual(['classic', 'ble'])
    expect(report.verdict.code).toBe('no_huawei_service')
    expect(report.verdict.advice[0]).toMatch(/Bluetooth classique .* refusé : read failed, socket might closed\./)
  })

  it('montre non appairée à Android → le dit, puis tente le BLE', async () => {
    const report = await run(fakeClient(), { classic: fakeClassic({ bonded: false }) })
    expect(report.watch.attempts[0].steps[0]).toMatch(/non appairée/)
    expect(report.verdict.code).toBe('link_ok')
    expect(report.watch.transport).toBe('ble')
  })
})

describe('diagnostic — utilitaires', () => {
  it('masque l’adresse MAC', () => {
    expect(redactDeviceId('aa:bb:cc:dd:ee:ff')).toBe('…:EE:FF')
    expect(redactDeviceId('fake-watch')).toBe('…atch')
  })

  it('reconnaît une montre Huawei par son nom, son service FE86 ou son fabricant + nom', () => {
    const fp = (o) => ({ name: '', services: [], companyIds: [], serviceData: [], ...o })
    expect(isHuaweiWearable(fp({ name: 'HUAWEI WATCH GT 6 Pro-123' }))).toBe(true)
    expect(isHuaweiWearable(fp({ services: ['fe86'] }))).toBe(true)
    expect(isHuaweiWearable(fp({ name: 'GT6 Pro', companyIds: [0x027d] }))).toBe(false)
    expect(isHuaweiWearable(fp({ name: 'Band 9', companyIds: [0x027d] }))).toBe(true)
    expect(isHuaweiWearable(fp({ name: 'HUAWEI P30', companyIds: [0x027d] }))).toBe(false)
  })

  it('préfère la montre qui s’annonce, puis la plus proche', () => {
    expect(pickWatch([{ deviceId: 'a', advertising: false, rssi: -40 }, { deviceId: 'b', advertising: true, rssi: -80 }]).deviceId).toBe('b')
    expect(pickWatch([])).toBeNull()
  })

  it('erreur renvoyée par la montre → « refused »', () => {
    const v = verdictFor({ steps: [], watch: { linkParams: { result: 100009, otherTags: [] } } })
    expect(v.code).toBe('refused')
  })
})

describe('diagnostic montre Huawei — jamais bloqué (régression du 18/10/2026)', () => {
  const never = () => new Promise(() => {})
  const fast = { ready: 30, apps: 30, bonded: 30, scan: 30, listBonded: 30, open: 30, services: 30, read: 30, subscribe: 30, send: 30, close: 30 }

  it('détection des apps qui ne répond jamais : étape sautée, le test va jusqu’au verdict', async () => {
    const report = await run(fakeClient(), { detectApps: never, timeouts: fast })
    expect(report.steps.find((s) => s.id === 'apps')).toMatchObject({ status: 'skip', detail: 'apps du téléphone : délai dépassé (1 s)' })
    expect(report.steps.find((s) => s.id === 'link').status).toBe('ok')
    expect(report.verdict.code).toBe('link_ok')
  })

  it('appareils appairés et recherche qui ne répondent jamais : la recherche continue avec ce qui est vu', async () => {
    const client = { ...fakeClient(), getBondedDevices: never, stopLEScan: never }
    const report = await run(client, { timeouts: fast })
    expect(report.steps.find((s) => s.id === 'find').status).toBe('ok')
    expect(report.finishedAt).toBeTruthy()
  })

  it('Bluetooth qui ne répond jamais : échec clair au lieu d’un blocage', async () => {
    const report = await run(fakeClient(), { ready: never, timeouts: fast })
    expect(report.steps[0]).toMatchObject({ status: 'fail', detail: 'Bluetooth : délai dépassé (1 s)' })
    expect(report.verdict.code).toBe('timeout')
    expect(report.verdict.title).toBe('Le test a calé à l’étape « Bluetooth du téléphone »')
  })

  it('connexion classique qui ne s’ouvre jamais : délai, puis essai en BLE', async () => {
    const classic = {
      listBonded: async () => ({ devices: [{ deviceId: MAC, name: 'HUAWEI WATCH GT 6 Pro-F2', uuids: [] }] }),
      connect: never,
      disconnect: vi.fn(async () => {}),
      addListener: async () => ({ remove: async () => {} }),
      write: async () => {},
    }
    const report = await run(fakeClient(), { classic, timeouts: fast })
    expect(report.watch.attempts[0].steps[0]).toMatch(/^connect:fail \(Bluetooth classique : connexion : délai dépassé/)
    expect(report.verdict.code).toBe('link_ok')
  })

  it('abonnement qui ne répond jamais : étape en échec et verdict « a calé »', async () => {
    const client = { ...fakeClient(), startNotifications: never }
    const report = await run(client, { timeouts: fast })
    expect(report.steps.find((s) => s.id === 'subscribe')).toMatchObject({ status: 'fail' })
    expect(report.verdict.code).toBe('timeout')
  })

  it('montre tenue par la relecture en arrière-plan (verrou natif) : « occupée », pas « autre app »', async () => {
    const classic = {
      listBonded: async () => ({ devices: [{ deviceId: MAC, name: 'HUAWEI WATCH GT 6 Pro-F2', uuids: [] }] }),
      connect: async () => {
        throw Object.assign(new Error('Montre occupée : relecture en arrière-plan en cours'), { code: 'busy' })
      },
      addListener: async () => ({ remove: async () => {} }),
    }
    const client = fakeClient()
    const report = await run(client, { classic })
    expect(report.verdict.code).toBe('busy')
    expect(client.connect).not.toHaveBeenCalled()
    expect(JSON.stringify(report.verdict)).not.toMatch(/Huawei Health/)
  })

  it('montre déjà synchronisée par HealthTrack : un refus de connexion n’accuse pas une autre app', () => {
    const report = {
      context: { connectedAt: new Date(Date.now() - 10 * 60_000).toISOString() },
      apps: { installed: [{ id: 'huawei_health', name: 'Huawei Health' }] },
      steps: [
        { id: 'bluetooth', status: 'ok' },
        { id: 'apps', status: 'warn' },
        { id: 'find', status: 'ok' },
        { id: 'connect', status: 'fail', detail: 'Connexion RFCOMM impossible' },
      ],
    }
    const v = verdictFor(report)
    expect(v.code).toBe('in_use')
    expect(v.advice[0]).toMatch(/HealthTrack synchronise pourtant bien la montre \(dernière synchro réussie il y a moins d’une heure\)/)
  })
})
