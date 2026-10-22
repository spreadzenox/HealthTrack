/**
 * Formulaire « Sécurité des données » de Google Play (jalon 10, journal/PRODUIT.md P16) : remplit le modèle CSV
 * exporté de la Play Console (app/store/data-safety/template.csv) avec les réponses justifiées
 * (app/store/data-safety/answers.mjs), vérifie la cohérence comme le ferait la Play Console, puis l'envoie par
 * l'API Android Publisher v3 (applications.dataSafety, hors edit). Ne touche ni aux pistes ni aux versions.
 */
import { API, PlayApiError } from './publish.mjs'

/** Lit un CSV (guillemets doubles, virgules et sauts de ligne dans les champs). */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const quote = (f) => (/[",\n\r]/.test(f) ? `"${f.replaceAll('"', '""')}"` : f)
export const toCsv = (rows) => `${rows.map((r) => r.map(quote).join(',')).join('\n')}\n`

const formatValue = (v) => (typeof v === 'boolean' ? String(v) : String(v ?? ''))
const isTrue = (v) => /^true$/i.test(v)

/**
 * Remplit le modèle avec les réponses. Renvoie { rows, errors } ; une réponse qui ne correspond à aucune ligne
 * du modèle (question renommée par Google) est une erreur.
 */
export function fillTemplate(templateText, answers) {
  const [header, ...body] = parseCsv(templateText)
  const errors = []
  const rows = body.map((r) => [r[0], r[1], '', r[3], r[4]])
  const index = new Map(rows.map((r, i) => [`${r[0]}|${r[1]}`, i]))
  for (const a of answers) {
    const i = index.get(`${a.question}|${a.response ?? ''}`)
    if (i === undefined) errors.push(`Réponse inconnue du modèle : ${a.question}${a.response ? ` / ${a.response}` : ''}`)
    else rows[i][2] = formatValue(a.value)
  }
  return { rows: [header, ...rows], errors }
}

/** Vérifie les règles du formulaire sur les lignes remplies (en-tête compris). Renvoie des erreurs en français. */
export function validateDataSafety([, ...rows]) {
  const errors = []
  const value = (q, r = '') => rows.find((x) => x[0] === q && x[1] === r)?.[2] ?? ''
  const chosen = (q) => rows.filter((x) => x[0] === q && isTrue(x[2])).map((x) => x[1])

  for (const r of rows) if (r[3] === 'REQUIRED' && !r[2]) errors.push(`Question obligatoire sans réponse : ${r[0]}`)
  for (const q of new Set(rows.filter((r) => r[3] === 'SINGLE_CHOICE').map((r) => r[0]))) {
    if (chosen(q).length > 1) errors.push(`Choix unique avec plusieurs réponses : ${q}`)
  }

  const collects = isTrue(value('PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA'))
  const types = rows.filter((r) => r[0].startsWith('PSL_DATA_TYPES_') && isTrue(r[2])).map((r) => r[1])
  if (collects && !types.length) errors.push('Collecte déclarée sans aucun type de données')
  if (!collects && types.length) errors.push('Types de données cochés alors que la collecte est déclarée absente')
  if (collects) {
    if (!value('PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT')) errors.push('Chiffrement en transit sans réponse')
    if (chosen('PSL_SUPPORT_DATA_DELETION_BY_USER').length !== 1) errors.push('Demande de suppression des données : une réponse attendue')
  }
  if (!chosen('PSL_SUPPORTED_ACCOUNT_CREATION_METHODS').length) errors.push('Création de compte : au moins une réponse attendue')

  const usage = (type, q) => `PSL_DATA_USAGE_RESPONSES:${type}:${q}`
  for (const type of types) {
    const how = chosen(usage(type, 'PSL_DATA_USAGE_COLLECTION_AND_SHARING'))
    if (!how.length) errors.push(`${type} : collectée, partagée ou les deux ?`)
    if (chosen(usage(type, 'DATA_USAGE_USER_CONTROL')).length !== 1) errors.push(`${type} : obligatoire ou facultative ?`)
    if (how.includes('PSL_DATA_USAGE_ONLY_COLLECTED')) {
      if (!chosen(usage(type, 'DATA_USAGE_COLLECTION_PURPOSE')).length) errors.push(`${type} : raison de la collecte manquante`)
      if (!value(usage(type, 'PSL_DATA_USAGE_EPHEMERAL'))) errors.push(`${type} : traitement éphémère sans réponse`)
    }
    if (how.includes('PSL_DATA_USAGE_ONLY_SHARED') && !chosen(usage(type, 'DATA_USAGE_SHARING_PURPOSE')).length) {
      errors.push(`${type} : raison du partage manquante`)
    }
  }
  for (const r of rows) {
    const m = /^PSL_DATA_USAGE_RESPONSES:([A-Z_]+):/.exec(r[0])
    if (m && r[2] && !types.includes(m[1])) errors.push(`Réponse d’usage pour un type non déclaré : ${m[1]}`)
  }
  return errors
}

/** Types de données déclarés (Response ID des lignes PSL_DATA_TYPES_* cochées). */
export const declaredTypes = ([, ...rows]) => rows.filter((r) => r[0].startsWith('PSL_DATA_TYPES_') && isTrue(r[2])).map((r) => r[1])

/** Envoie le CSV complet à Google Play (remplace la déclaration en cours). */
export async function publishDataSafety({ packageName, csv, token, fetchImpl = fetch }) {
  const res = await fetchImpl(`${API}/${packageName}/dataSafety`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ safetyLabels: csv }),
  })
  const raw = await res.text()
  if (!res.ok) {
    let message = raw.slice(0, 300)
    try {
      message = JSON.parse(raw)?.error?.message ?? message
    } catch {
      // réponse non JSON : on garde le texte brut
    }
    throw new PlayApiError('Sécurité des données', res.status, message)
  }
}
