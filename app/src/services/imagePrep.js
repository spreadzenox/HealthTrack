/**
 * Prépare une photo avant l'envoi à Gemini : on n'envoie que le strict nécessaire.
 * - ré-encodage via canvas → plus aucune métadonnée (GPS, date, modèle d'appareil…) ;
 * - plus grand côté limité à MAX_IMAGE_SIDE px (suffisant pour reconnaître un plat, envoi plus léger).
 * Si le canvas n'est pas disponible, repli : on retire les segments de métadonnées du JPEG.
 */
export const MAX_IMAGE_SIDE = 1280
const JPEG_QUALITY = 0.85

export function computeTargetSize(width, height, maxSide = MAX_IMAGE_SIDE) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Retire d'un JPEG les segments APP1–APP15 (EXIF/GPS, XMP, ICC…) et les commentaires.
 * Garde APP0 (JFIF) et tout le reste. Renvoie null si ce n'est pas un JPEG lisible.
 * @param {Uint8Array} bytes
 * @returns {Uint8Array|null}
 */
export function stripJpegMetadata(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const out = [bytes.subarray(0, 2)]
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff || i + 3 >= bytes.length) return null
    const marker = bytes[i + 1]
    if (marker === 0xda) {
      // Début des données d'image : tout le reste est conservé tel quel
      out.push(bytes.subarray(i))
      break
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    const end = i + 2 + len
    if (len < 2 || end > bytes.length) return null
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe
    if (!isMetadata) out.push(bytes.subarray(i, end))
    i = end
  }
  const total = out.reduce((n, part) => n + part.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const part of out) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function reencodeWithCanvas(file) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const size = computeTargetSize(bitmap.width, bitmap.height)
    if (!size) return null
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, size.width, size.height)
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    if (!dataUrl.startsWith('data:image/jpeg')) return null
    return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
  } finally {
    bitmap.close?.()
  }
}

/**
 * @param {File|Blob} file
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export async function prepareImageForGemini(file) {
  try {
    const reencoded = await reencodeWithCanvas(file)
    if (reencoded) return reencoded
  } catch {
    // format non décodable par le navigateur : repli ci-dessous
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const stripped = stripJpegMetadata(bytes)
  if (stripped) return { base64: bytesToBase64(stripped), mimeType: 'image/jpeg' }
  // Impossible de garantir l'absence de métadonnées : on préfère ne rien envoyer
  throw new Error("Format d'image non pris en charge. Reprenez la photo ou choisissez une image JPEG.")
}
