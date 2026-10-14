/**
 * Session avec une montre Huawei : au-dessus d'un transport (RFCOMM ou BLE, voir transports.js),
 * envoie des messages (service, commande, TLV) découpés en tranches si besoin, rassemble les
 * réponses et les rend à qui les attend. Une fois authentifié, un `cipher` chiffre / déchiffre les
 * TLV (étiquettes 0x7C, 0x7D, 0x7E, journal/protocoles/huawei.md §3).
 */
import { createReassembler, encodeFrames, toHex, tryDecodeTlvs } from './protocol'

const TAG_ENCRYPTED = 0x7c

/**
 * @param transport { open(onData, onClose), subscribe?(onData), send(bytes), close() }
 * @param opts.onFrame(dir, bytes) : journal des trames (diagnostic) ; opts.onMessage(m) : messages
 *   non sollicités (la montre en envoie spontanément).
 */
export function createSession(transport, { timeoutMs = 8000, onFrame = () => {}, onMessage = () => {}, maxFrameSize = 244 } = {}) {
  const reassembler = createReassembler()
  const waiters = []
  const listeners = []
  let cipher = null
  let closed = false
  let pending = Promise.resolve()
  const early = []

  const fail = (err) => {
    for (const w of waiters.splice(0)) {
      clearTimeout(w.timer)
      w.reject(err)
    }
  }

  const deliver = async (m) => {
    let message = m
    const enc = m.tlvs.find((t) => t.tag === TAG_ENCRYPTED)
    if (enc && enc.value[0] === 1) {
      // chiffré avant que la clé de session soit posée (la montre parle juste après l'authentification) :
      // gardé et relu dès setCipher, au lieu d'être perdu
      if (!cipher) return void early.push(m)
      try {
        const raw = cipher.openBytes ? await cipher.openBytes(m.serviceId, m.commandId, m.tlvs) : null
        message = raw ? { ...m, raw, tlvs: tryDecodeTlvs(raw) } : { ...m, tlvs: await cipher.open(m.serviceId, m.commandId, m.tlvs) }
      } catch (e) {
        return onMessage({ ...m, error: e?.message || String(e) })
      }
    }
    const i = waiters.findIndex((w) => w.serviceId === message.serviceId && w.commandId === message.commandId)
    if (i < 0) {
      const l = listeners.find((x) => x.serviceId === message.serviceId && x.commandId === message.commandId)
      return l ? l.handler(message) : onMessage(message)
    }
    const [w] = waiters.splice(i, 1)
    clearTimeout(w.timer)
    w.resolve(message)
  }

  const onData = (bytes) => {
    onFrame('in', bytes)
    let messages = []
    try {
      messages = reassembler.push(bytes)
    } catch (e) {
      onMessage({ error: `trame illisible : ${e?.message || e}`, hex: toHex(bytes) })
    }
    // les messages sont traités dans l'ordre d'arrivée, même si le déchiffrement est asynchrone
    for (const m of messages) pending = pending.then(() => deliver(m))
  }

  return {
    get encrypted() {
      return Boolean(cipher)
    },
    setCipher(c) {
      cipher = c
      for (const m of early.splice(0)) pending = pending.then(() => deliver(m))
    },
    setMaxFrameSize(n) {
      if (Number.isInteger(n) && n > 16) maxFrameSize = n
    },
    async open() {
      await transport.open(onData, () => {
        closed = true
        fail(new Error('Connexion coupée par la montre'))
      })
      await transport.subscribe?.(onData)
    },
    /** Envoie sans attendre de réponse. `plain` : jamais chiffré (étapes d'authentification). */
    async send(serviceId, commandId, tlvs = [], { plain = false } = {}) {
      if (closed) throw new Error('Connexion fermée')
      const body = cipher && !plain ? await cipher.seal(serviceId, commandId, tlvs) : tlvs
      for (const frame of encodeFrames(serviceId, commandId, body, maxFrameSize)) {
        onFrame('out', frame)
        await transport.send(frame)
      }
    },
    /** Envoie puis attend la réponse au même service / à la même commande. */
    async request(serviceId, commandId, tlvs = [], { plain = false, timeout = timeoutMs } = {}) {
      const answer = new Promise((resolve, reject) => {
        const w = { serviceId, commandId, resolve, reject }
        w.timer = setTimeout(() => {
          const i = waiters.indexOf(w)
          if (i >= 0) waiters.splice(i, 1)
          reject(new Error(`Pas de réponse de la montre (${serviceId}/${commandId}) en ${Math.round(timeout / 1000)} s`))
        }, timeout)
        waiters.push(w)
      })
      try {
        await this.send(serviceId, commandId, tlvs, { plain })
      } catch (e) {
        fail(e)
      }
      return answer
    },
    /** Reçoit les messages poussés par la montre pour ce service / cette commande (blocs de fichier). */
    listen(serviceId, commandId, handler) {
      const l = { serviceId, commandId, handler }
      listeners.push(l)
      return () => {
        const i = listeners.indexOf(l)
        if (i >= 0) listeners.splice(i, 1)
      }
    },
    async close() {
      closed = true
      fail(new Error('Session fermée'))
      await transport.close?.()
    },
  }
}
