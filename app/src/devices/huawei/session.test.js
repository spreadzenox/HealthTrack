import { describe, it, expect } from 'vitest'
import { createSession } from './session'
import { createReassembler, encodeFrame, encodeFrames, decodeFrame } from './protocol'

/** Fausse montre : rassemble ce que le téléphone envoie et répond via `answer(message)`. */
function fakeWatch(answer) {
  const sent = []
  const received = []
  const r = createReassembler()
  let push
  let close
  return {
    sent,
    received,
    cut: () => close(),
    transport: {
      async open(onData, onClose) {
        push = onData
        close = onClose
      },
      async send(bytes) {
        sent.push(bytes)
        for (const m of r.push(bytes)) {
          received.push(m)
          const reply = answer(m)
          if (reply) setTimeout(() => push(reply), 0)
        }
      },
      async close() {},
    },
  }
}

describe('session Huawei', () => {
  it('découpe un long message en tranches 1 / 2 / 3 que la montre rassemble', () => {
    const value = Array.from({ length: 600 }, (_, i) => i & 0xff)
    const frames = encodeFrames(1, 0x28, [{ tag: 1, value }], 244)
    expect(frames.map((f) => decodeFrame(f).slice)).toEqual([1, 2, 3])
    expect(frames.every((f) => f.length <= 244)).toBe(true)
    const r = createReassembler()
    const [m] = frames.flatMap((f) => r.push(f))
    expect(m.serviceId).toBe(1)
    expect(m.commandId).toBe(0x28)
    expect(Array.from(m.tlvs[0].value)).toEqual(value)
    expect(encodeFrames(1, 1, [{ tag: 1 }]).length).toBe(1)
  })

  it('request : envoie puis rend la réponse au même service / commande', async () => {
    const w = fakeWatch((m) => (m.commandId === 1 ? encodeFrame(1, 1, [{ tag: 1, value: [2] }]) : null))
    const frames = []
    const s = createSession(w.transport, { onFrame: (dir) => frames.push(dir) })
    await s.open()
    const res = await s.request(1, 1, [{ tag: 1 }])
    expect(Array.from(res.tlvs[0].value)).toEqual([2])
    expect(frames).toEqual(['out', 'in'])
  })

  it('délai dépassé → erreur claire ; coupure → toutes les attentes échouent', async () => {
    const w = fakeWatch(() => null)
    const s = createSession(w.transport, { timeoutMs: 30 })
    await s.open()
    await expect(s.request(1, 5)).rejects.toThrow(/Pas de réponse/)
    const p = s.request(1, 6, [], { timeout: 5000 })
    w.cut()
    await expect(p).rejects.toThrow(/coupée/)
  })

  it('chiffrement : seal à l’envoi (sauf plain), open à la réception, messages spontanés remontés', async () => {
    const cipher = {
      seal: async (sv, cmd, tlvs) => [{ tag: 0x7c, value: [1] }, { tag: 0x7e, value: tlvs.flatMap((t) => [t.tag, ...t.value]) }],
      open: async () => [{ tag: 9, value: [42] }],
    }
    const w = fakeWatch((m) => (m.commandId === 7 ? encodeFrame(1, 7, [{ tag: 0x7c, value: [1] }, { tag: 0x7e, value: [0] }]) : null))
    const spontaneous = []
    const s = createSession(w.transport, { onMessage: (m) => spontaneous.push(m) })
    await s.open()
    s.setCipher(cipher)
    expect(s.encrypted).toBe(true)
    const res = await s.request(1, 7, [{ tag: 1, value: [5] }])
    expect(w.received[0].tlvs[0].tag).toBe(0x7c)
    expect(Array.from(res.tlvs[0].value)).toEqual([42])
    await s.send(1, 8, [{ tag: 3, value: [1] }], { plain: true })
    expect(w.received[1].tlvs[0].tag).toBe(3)
  })
})
