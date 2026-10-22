/**
 * Fiche du Store Google Play (jalon 10, journal/PRODUIT.md) : textes et images en français envoyés par l'API
 * Android Publisher v3, dans un « edit » comme l'envoi des AAB (publish.mjs).
 *
 * Source unique dans le dépôt : app/store/listing/<langue>/ (title.txt, short-description.txt,
 * full-description.txt, feature-graphic.png, phone-screenshots/*.png) + app/store/play-icon-512.png.
 * Les images ne sont réenvoyées que si leurs empreintes SHA-256 diffèrent de celles déjà sur Play.
 * Ne touche ni aux pistes ni aux versions : la mise en production reste le geste du propriétaire.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { API, UPLOAD_API, PlayApiError } from './publish.mjs'

/** Limites de Play (caractères) et des images. */
export const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000, screenshotsMin: 2, screenshotsMax: 8 }
export const IMAGE_TYPES = ['icon', 'featureGraphic', 'phoneScreenshots']

const text = (file) => readFileSync(file, 'utf8').trim()

/** Lit la fiche d'une langue dans `storeDir` (app/store). */
export function readListing(storeDir, language = 'fr-FR') {
  const dir = resolve(storeDir, 'listing', language)
  const shots = resolve(dir, 'phone-screenshots')
  return {
    language,
    title: text(resolve(dir, 'title.txt')),
    shortDescription: text(resolve(dir, 'short-description.txt')),
    fullDescription: text(resolve(dir, 'full-description.txt')),
    images: {
      icon: [resolve(storeDir, 'play-icon-512.png')],
      featureGraphic: [resolve(dir, 'feature-graphic.png')],
      phoneScreenshots: existsSync(shots)
        ? readdirSync(shots)
            .filter((f) => f.endsWith('.png'))
            .sort()
            .map((f) => resolve(shots, f))
        : [],
    },
  }
}

/** Dimensions d'un PNG (en-tête IHDR), ou null si ce n'est pas un PNG. */
export function pngSize(bytes) {
  const sig = [0x89, 0x50, 0x4e, 0x47]
  if (bytes.length < 24 || sig.some((b, i) => bytes[i] !== b)) return null
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: dv.getUint32(16), height: dv.getUint32(20) }
}

/** Erreurs bloquantes de la fiche (limites de Play), en français. `read` lit un fichier image (octets). */
export function validateListing(listing, read = (p) => readFileSync(p)) {
  const errors = []
  for (const key of ['title', 'shortDescription', 'fullDescription']) {
    const n = [...(listing[key] ?? '')].length
    if (!n) errors.push(`${key} est vide`)
    else if (n > LIMITS[key]) errors.push(`${key} : ${n} caractères (maximum ${LIMITS[key]})`)
  }
  const check = (path, ok, what) => {
    const size = pngSize(read(path))
    if (!size) errors.push(`${path} n'est pas un PNG`)
    else if (!ok(size)) errors.push(`${path} : ${size.width}×${size.height}, attendu ${what}`)
  }
  const { icon, featureGraphic, phoneScreenshots } = listing.images
  icon.forEach((p) => check(p, (s) => s.width === 512 && s.height === 512, '512×512'))
  featureGraphic.forEach((p) => check(p, (s) => s.width === 1024 && s.height === 500, '1024×500'))
  const n = phoneScreenshots.length
  if (n < LIMITS.screenshotsMin || n > LIMITS.screenshotsMax) errors.push(`${n} captures de téléphone (entre ${LIMITS.screenshotsMin} et ${LIMITS.screenshotsMax})`)
  phoneScreenshots.forEach((p) =>
    check(
      p,
      (s) => Math.min(s.width, s.height) >= 320 && Math.max(s.width, s.height) <= 3840 && Math.max(s.width, s.height) <= 2 * Math.min(s.width, s.height),
      'côtés de 320 à 3840 px, le plus long au plus 2 fois le plus court',
    ),
  )
  return errors
}

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

async function call(fetchImpl, step, url, { method = 'GET', token, body, contentType = 'application/json' } = {}) {
  const res = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': contentType } : {}) },
    body: body === undefined ? undefined : contentType === 'application/json' ? JSON.stringify(body) : body,
  })
  const raw = await res.text()
  let json = null
  try {
    json = raw ? JSON.parse(raw) : null
  } catch {
    json = null
  }
  if (!res.ok) throw new PlayApiError(step, res.status, json?.error?.message ?? raw.slice(0, 300))
  return json
}

/**
 * Envoie la fiche `listing` (textes + `images` : { type: [octets…] }) et, si donné, le site web.
 * Renvoie { language, defaultLanguage, images: { type: 'inchangées' | nombre envoyé }, website, notSentForReview }.
 * Le site web est facultatif : un refus de Play (coordonnées incomplètes) est rapporté sans faire échouer la fiche.
 */
export async function publishListing({ packageName, listing, images, website, token, fetchImpl = fetch, log = () => {} }) {
  const base = `${API}/${packageName}/edits`
  const edit = await call(fetchImpl, 'Ouverture de l’edit', base, { method: 'POST', token, body: {} })
  const editUrl = `${base}/${edit.id}`
  const uploadUrl = `${UPLOAD_API}/${packageName}/edits/${edit.id}`
  const lang = listing.language
  try {
    const details = (await call(fetchImpl, 'Lecture des coordonnées', `${editUrl}/details`, { token })) ?? {}
    log(`Edit ${edit.id} ouvert, langue par défaut de la fiche : ${details.defaultLanguage ?? '?'}`)

    await call(fetchImpl, `Textes de la fiche (${lang})`, `${editUrl}/listings/${lang}`, {
      method: 'PUT',
      token,
      body: { language: lang, title: listing.title, shortDescription: listing.shortDescription, fullDescription: listing.fullDescription },
    })

    const sent = {}
    for (const type of IMAGE_TYPES) {
      const local = images[type] ?? []
      const remote = (await call(fetchImpl, `Images ${type}`, `${editUrl}/listings/${lang}/${type}`, { token }))?.images ?? []
      if (remote.map((i) => i.sha256).join() === local.map(sha256).join()) {
        sent[type] = 'inchangées'
        continue
      }
      if (remote.length) await call(fetchImpl, `Suppression ${type}`, `${editUrl}/listings/${lang}/${type}`, { method: 'DELETE', token })
      for (const bytes of local) {
        await call(fetchImpl, `Envoi ${type}`, `${uploadUrl}/listings/${lang}/${type}?uploadType=media`, { method: 'POST', token, body: bytes, contentType: 'image/png' })
      }
      sent[type] = local.length
      log(`${type} : ${local.length} image(s) envoyée(s)`)
    }

    let site = 'non demandé'
    if (website && details.contactWebsite === website) site = 'inchangé'
    else if (website) {
      try {
        await call(fetchImpl, 'Site web', `${editUrl}/details`, { method: 'PATCH', token, body: { ...details, contactWebsite: website } })
        site = 'mis à jour'
      } catch (err) {
        if (!(err instanceof PlayApiError) || err.status === 401 || err.status === 403) throw err
        site = `refusé par Play : ${err.apiMessage}`
      }
    }

    let notSentForReview = false
    try {
      await call(fetchImpl, 'Validation de l’edit', `${editUrl}:commit`, { method: 'POST', token })
    } catch (err) {
      if (!(err instanceof PlayApiError && /changesNotSentForReview/.test(err.apiMessage))) throw err
      notSentForReview = true
      await call(fetchImpl, 'Validation de l’edit (sans examen)', `${editUrl}:commit?changesNotSentForReview=true`, { method: 'POST', token })
    }
    return { language: lang, defaultLanguage: details.defaultLanguage ?? null, images: sent, website: site, notSentForReview }
  } catch (err) {
    await call(fetchImpl, 'Abandon de l’edit', editUrl, { method: 'DELETE', token }).catch(() => {})
    throw err
  }
}
