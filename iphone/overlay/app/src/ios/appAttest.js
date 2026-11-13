// Version iOS (HealthTrack-iOS), étape I6 : App Attest, l'équivalent iPhone de Play Integrity, selon le contrat du
// relais spécifié par Android le 2/11 (journal/IDEES.md de HealthTrack, I208, I6-RELAIS-5) et ses routes (v712, #628,
// relay/src/attestroutes.js : enregistrement en JSON, en-tête X-AppAttest-Key du CORS). Une clé tirée dans la
// Secure Enclave (plugin Swift `AppAttest`), attestée une fois sur un défi à usage unique du relais, puis une assertion
// par requête sensible (analyse, crédits) sur « halcya-assert:<installation>:<horodatage ms>:<SHA-256 du corps> ».
// Aucune donnée de santé : la clé est tirée au hasard, le corps n'entre que par son condensat. Branché sur l'analyse
// des repas par le correctif 38 (aiRelay.js › postRelay), sur iPhone seulement. Côté relais, App Attest est en
// observation depuis Android v721 (APP_ATTEST_MODE=observe et le Team ID, 2/11) ; si l'enregistrement échoue, il est
// retenté au plus une fois par heure, sans requête de plus à chaque analyse. Le relais reconnaît l'iPhone à
// `X-Platform: ios`, qu'aiRelay.js d'Android ajoute à chaque appel depuis v722 (`platformHeaders`).

export const APP_ATTEST_KEY = 'halcya_appattest'
export const ATTEST_RETRY_MS = 60 * 60_000

export async function sha256Hex(text, subtle = globalThis.crypto?.subtle) {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function clientDataFor({ installId, timeMs, body = '' }) {
  return `halcya-assert:${installId}:${timeMs}:${await sha256Hex(body)}`
}

function readKey(storage) {
  try {
    const saved = JSON.parse(storage.getItem(APP_ATTEST_KEY) ?? 'null')
    return saved && typeof saved.keyId === 'string' ? saved : null
  } catch {
    return null
  }
}

function writeKey(storage, value) {
  try {
    if (value) storage.setItem(APP_ATTEST_KEY, JSON.stringify(value))
    else storage.removeItem(APP_ATTEST_KEY)
  } catch {
    // stockage indisponible : la clé sera redemandée
  }
}

/** Clé de cet iPhone, attestée auprès du relais ; null tant que le relais ne l'a pas enregistrée. */
async function attestedKey({ plugin, installId, relayUrl, fetchImpl, storage, now }) {
  const saved = readKey(storage)
  if (saved?.registered) return saved.keyId
  if (saved?.retryAt > now) return null
  const keyId = saved?.keyId ?? (await plugin.generateKey()).keyId
  const later = () => {
    writeKey(storage, { keyId, registered: false, retryAt: now + ATTEST_RETRY_MS })
    return null
  }
  later()
  const res = await fetchImpl(`${relayUrl}/v1/attest/challenge`, { method: 'POST', headers: { 'X-Install-Id': installId } })
  const challenge = res.ok ? (await res.json().catch(() => null))?.challenge : null
  if (typeof challenge !== 'string') return later()
  const { attestation } = await plugin.attestKey({ keyId, challenge })
  const registered = await fetchImpl(`${relayUrl}/v1/attest/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Install-Id': installId },
    body: JSON.stringify({ keyId, attestation, challenge }),
  })
  if (!registered.ok) return later()
  writeKey(storage, { keyId, registered: true })
  return keyId
}

/**
 * En-têtes App Attest d'une requête sensible ; `X-Integrity-Status: unsupported` sans Secure Enclave (simulateur),
 * rien si l'attestation n'a pas (encore) abouti : le relais classe alors la requête `attest_missing`.
 */
export async function appAttestHeaders({ plugin, installId, body = '', now = Date.now(), relayUrl, fetchImpl = globalThis.fetch, storage = globalThis.localStorage }) {
  if (!plugin) return {}
  try {
    if (!(await plugin.isSupported())?.supported) return { 'X-Integrity-Status': 'unsupported' }
    const keyId = await attestedKey({ plugin, installId, relayUrl, fetchImpl, storage, now })
    if (!keyId) return {}
    const clientData = await clientDataFor({ installId, timeMs: now, body })
    try {
      const { assertion } = await plugin.generateAssertion({ keyId, clientData })
      return { 'X-AppAttest-Key': keyId, 'X-AppAttest-Assertion': assertion, 'X-AppAttest-Time': String(now) }
    } catch (err) {
      if (err?.code === 'invalid_key') writeKey(storage, null) // clé perdue : une neuve à la requête suivante
      return {}
    }
  } catch {
    return {}
  }
}

let nativePlugin = null

/** Pour aiRelay.js (correctif 38) : en-têtes App Attest sur iPhone seulement ; ailleurs ou en cas d'erreur, rien. */
export async function iosAttestHeaders({ platform, plugin, ...rest } = {}) {
  try {
    const core = platform && plugin ? null : await import('@capacitor/core')
    if ((platform ?? core.Capacitor.getPlatform()) !== 'ios') return {}
    const native = plugin ?? (nativePlugin ??= core.registerPlugin('AppAttest'))
    return await appAttestHeaders({ plugin: native, ...rest })
  } catch {
    return {}
  }
}
