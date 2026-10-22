/**
 * Retire d'un JPEG les segments APP1–APP15 (EXIF / GPS, XMP, ICC…) et les commentaires, au cas où l'app ne
 * l'aurait pas déjà fait (elle ré-encode la photo avant l'envoi). Garde APP0 (JFIF) et tout le reste.
 * Renvoie null si ce n'est pas un JPEG lisible : le relais refuse alors l'image.
 * @param {Uint8Array} bytes
 * @returns {Buffer|null}
 */
export function stripJpegMetadata(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const out = [bytes.subarray(0, 2)]
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff || i + 3 >= bytes.length) return null
    const marker = bytes[i + 1]
    // Octet de remplissage 0xFF entre deux segments : on l'ignore
    if (marker === 0xff) {
      i += 1
      continue
    }
    if (marker === 0xda) {
      // Début des données d'image : tout le reste est conservé tel quel
      out.push(bytes.subarray(i))
      return Buffer.concat(out)
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    const end = i + 2 + len
    if (len < 2 || end > bytes.length) return null
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe
    if (!isMetadata) out.push(bytes.subarray(i, end))
    i = end
  }
  // Pas de données d'image : ce n'est pas une photo exploitable
  return null
}
