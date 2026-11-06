/**
 * Réseau des appareils de test de Google (INSTALLS-21c-1, `journal/IDEES.md` I223).
 *
 * Les robots du rapport de pré-lancement de la Play Console tournent sur Firebase Test Lab, dont tout le trafic sort
 * par des blocs d'adresses publiés par Firebase. Le relais compare l'adresse de la requête à ces blocs, en mémoire,
 * pendant la requête, et n'écrit qu'un booléen `testnet` dans ses journaux : jamais l'adresse.
 *
 * Source : https://firebase.google.com/docs/test-lab/android/get-started (« IP address ranges », relevé du 06/11/2026).
 * La page est mise à jour environ une fois par an : un test échoue quand ce relevé a plus de 13 mois.
 */

export const TESTLAB_RANGES_CHECKED = '2026-11-06'

export const TESTLAB_RANGES = Object.freeze([
  // Appareils physiques et virtuels Arm
  '70.32.128.0/19', '108.177.6.0/23', '108.177.18.192/26', '108.177.29.64/27', '108.177.31.160/27',
  '199.36.156.8/29', '199.36.156.16/28', '209.85.131.0/27',
  '70.32.128.48/28', // 04-2024
  '70.32.150.192/27', '108.177.6.0/27', '108.177.24.160/27', '108.177.29.0/27', // 09-2025
  '108.177.25.128/27', '108.177.26.128/26', '108.177.29.192/26', // 05-2026
  '172.217.120.64/26', '172.217.120.128/26',
  // Appareils virtuels non Arm
  '34.68.194.64/29', '34.69.234.64/29', '34.73.34.72/29', '34.73.178.72/29', '34.74.10.72/29',
  '34.136.2.136/29', '34.136.50.136/29', '34.145.234.144/29', '35.192.160.56/29', '35.196.166.80/29',
  '35.196.169.240/29', '35.203.128.0/28', '35.234.176.160/28', '35.243.2.0/27', '35.245.243.240/29',
  '199.192.115.0/30', '199.192.115.8/30', '199.192.115.16/29',
])

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

/** Adresse IPv4 en entier non signé, ou null (IPv6, valeur invalide). Les IPv4 notées en IPv6 (::ffff:a.b.c.d) comptent. */
export function ipv4ToInt(value) {
  const text = String(value ?? '').trim().replace(/^::ffff:/i, '')
  const m = IPV4.exec(text)
  if (!m) return null
  const parts = m.slice(1).map(Number)
  if (parts.some((p) => p > 255)) return null
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

const PARSED = TESTLAB_RANGES.map((cidr) => {
  const [base, bits] = cidr.split('/')
  const size = 2 ** (32 - Number(bits))
  const start = ipv4ToInt(base)
  return { start: start - (start % size), end: start - (start % size) + size - 1 }
})

/** Vrai si l'adresse appartient à un bloc de Test Lab. IPv6 et valeurs invalides : faux. */
export function isTestLabAddress(ip) {
  const n = ipv4ToInt(ip)
  if (n === null) return false
  return PARSED.some((r) => n >= r.start && n <= r.end)
}

/**
 * Adresse du client d'après `X-Forwarded-For`. Cloud Run ajoute l'adresse qu'il voit à la fin de l'en-tête, après
 * ce que le client a pu y mettre lui-même : on prend donc le dernier élément, que le client ne peut pas choisir.
 */
export function clientAddress(forwardedFor) {
  const raw = Array.isArray(forwardedFor) ? forwardedFor.join(',') : String(forwardedFor ?? '')
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : null
}

/** Requête venue du réseau de test de Google ? Seul ce booléen sort de la fonction. */
export function fromTestLabNetwork(req) {
  return isTestLabAddress(clientAddress(req?.headers?.['x-forwarded-for']))
}
