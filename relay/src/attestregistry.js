/**
 * Registre des clés App Attest (I6-RELAIS-5c) : la clé publique attestée une fois par l'iPhone, et le dernier compteur
 * vu, pour vérifier chaque assertion et refuser les rejeux.
 *
 * Firestore, collection `appattest`, un document par keyId (hexadécimal) : `{ install, publicKey, counter, environment,
 * category, createdAt, expireAt }`. `install` est une empreinte de l'identifiant d'installation (jamais l'identifiant),
 * la clé publique a été tirée au hasard par l'iPhone : aucune donnée personnelle. `expireAt` est repoussé à 13 mois à
 * chaque écriture, comme pour les crédits ; l'effacement demande la même politique TTL que P33, sur `appattest`.
 *
 * Un cache mémoire est devant (une lecture par clé et par instance). Le compteur y avance avant l'écriture dans
 * Firestore, pour qu'un rejeu simultané sur la même instance soit refusé. Si Firestore ne répond pas en lecture, l'erreur
 * remonte telle quelle (la garde de 5d la traitera comme « unavailable ») ; si l'écriture échoue, le compteur reste
 * avancé en mémoire et `persisted` vaut false.
 */
import { createHash } from 'node:crypto'
import { AppAttestError } from './appattest.js'
import { expiryOf } from './credits.js'

/** Empreinte de l'installation propre à ce registre (une autre que celle des crédits). */
export const attestInstallKey = (installId) => createHash('sha256').update(`appattest:${installId}`).digest('hex')

const hex = (keyId) => (Buffer.isBuffer(keyId) ? keyId : Buffer.from(String(keyId ?? ''), 'base64')).toString('hex')

/** Registre en mémoire (tests, et repli quand Firestore n'est pas configuré). */
export function memoryAttestStore() {
  const docs = new Map()
  return {
    docs,
    async get(id) {
      return docs.has(id) ? { ...docs.get(id) } : null
    },
    async set(id, doc) {
      docs.set(id, { ...doc })
    },
  }
}

/**
 * @param {{ verifyAttestation: Function, verifyAssertion: Function, store?: object, now?: () => number, maxCache?: number }} opts
 *   verifyAttestation / verifyAssertion : fonctions de `appattest.js` (créées avec le Team ID).
 */
export function createAttestRegistry({ verifyAttestation, verifyAssertion, store = memoryAttestStore(), now = Date.now, maxCache = 5000 }) {
  const cache = new Map()
  const remember = (id, doc) => {
    cache.delete(id)
    cache.set(id, doc)
    if (cache.size > maxCache) cache.delete(cache.keys().next().value)
  }
  const load = async (id) => {
    if (cache.has(id)) return cache.get(id)
    const doc = await store.get(id)
    // Une requête simultanée a pu remplir le cache (et avancer le compteur) pendant la lecture : elle prime.
    if (cache.has(id)) return cache.get(id)
    if (doc) remember(id, doc)
    return doc
  }
  const persist = async (id, doc) => {
    try {
      await store.set(id, { ...doc, expireAt: expiryOf(now()) })
      return true
    } catch {
      return false
    }
  }

  return {
    /**
     * Première fois : vérifie l'attestation et lie la clé à l'installation. Une clé déjà liée à une autre installation
     * est refusée (`key_reused`) ; la même installation qui renvoie la même clé garde son compteur.
     * @returns {Promise<{ keyId: string, environment: string, category: number|null, persisted: boolean, already: boolean }>}
     */
    async register({ installId, keyId, attestation, challenge }) {
      const att = verifyAttestation({ keyId, attestation, challenge })
      const id = att.keyId.toString('hex')
      const install = attestInstallKey(installId)
      const existing = await load(id)
      if (existing && existing.install !== install) throw new AppAttestError('key_reused', 'Clé déjà liée à une autre installation.')
      if (existing) return { keyId: id, environment: existing.environment, category: existing.category, persisted: true, already: true }
      const doc = {
        install,
        publicKey: att.publicKey.toString('base64'),
        counter: 0,
        environment: att.environment,
        category: att.category,
        createdAt: new Date(now()).toISOString(),
      }
      remember(id, doc)
      return { keyId: id, environment: doc.environment, category: doc.category, persisted: await persist(id, doc), already: false }
    },

    /**
     * À chaque requête protégée : vérifie l'assertion avec la clé gardée et avance le compteur.
     * @returns {Promise<{ keyId: string, counter: number, environment: string, persisted: boolean }>}
     */
    async check({ installId, keyId, assertion, time, body }) {
      const id = hex(keyId)
      if (id.length !== 64) throw new AppAttestError('key_id', 'keyId invalide.')
      await load(id)
      const doc = cache.get(id)
      if (!doc) throw new AppAttestError('unknown_key', 'Clé inconnue : attestation à refaire.')
      if (doc.install !== attestInstallKey(installId)) throw new AppAttestError('key_reused', 'Clé d\'une autre installation.')
      const { counter } = verifyAssertion({ assertion, installId, time, body, publicKey: doc.publicKey, lastCounter: doc.counter })
      const next = { ...doc, counter }
      remember(id, next)
      return { keyId: id, counter, environment: doc.environment, persisted: await persist(id, next) }
    },
  }
}

const FIRESTORE = 'https://firestore.googleapis.com/v1'

/** Registre durable dans Firestore (même base et même jeton que les crédits ; DATASTORE_SCOPE). */
export function createFirestoreAttestStore({ project, getToken, fetchImpl = fetch, collection = 'appattest' }) {
  const url = (id) => `${FIRESTORE}/projects/${project}/databases/(default)/documents/${collection}/${id}`
  const headers = async () => ({ Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' })
  return {
    async get(id) {
      const res = await fetchImpl(url(id), { headers: await headers() })
      if (res.status === 404) return null
      if (!res.ok) throw Object.assign(new Error(`Firestore : lecture refusée (${res.status})`), { status: res.status })
      const f = (await res.json())?.fields ?? {}
      return {
        install: f.install?.stringValue ?? '',
        publicKey: f.publicKey?.stringValue ?? '',
        counter: Number(f.counter?.integerValue ?? 0),
        environment: f.environment?.stringValue ?? '',
        category: f.category?.integerValue !== undefined ? Number(f.category.integerValue) : null,
        createdAt: f.createdAt?.timestampValue ?? null,
      }
    },
    async set(id, { install, publicKey, counter, environment, category, createdAt, expireAt }) {
      const fields = {
        install: { stringValue: install },
        publicKey: { stringValue: publicKey },
        counter: { integerValue: String(counter) },
        environment: { stringValue: environment },
        category: category === null || category === undefined ? { nullValue: null } : { integerValue: String(category) },
        ...(createdAt ? { createdAt: { timestampValue: createdAt } } : {}),
        ...(expireAt ? { expireAt: { timestampValue: expireAt } } : {}),
      }
      const res = await fetchImpl(url(id), { method: 'PATCH', headers: await headers(), body: JSON.stringify({ fields }) })
      if (!res.ok) throw Object.assign(new Error(`Firestore : écriture refusée (${res.status})`), { status: res.status })
    },
  }
}
