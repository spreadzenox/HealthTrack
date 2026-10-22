/**
 * Appel de Gemini sur Vertex AI, dans l'UE, avec l'identité du service Cloud Run (relay-runtime) : jeton OAuth lu sur
 * le serveur de métadonnées, aucune clé API.
 *
 * Modèles et régions essayés dans l'ordre (le moins cher adapté d'abord) ; on passe au suivant seulement si le
 * modèle est introuvable ou indisponible dans la région, et l'on retient ensuite le couple qui a marché.
 */
const METADATA_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token'

export const endpointUrl = ({ project, location, model }) =>
  `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`

/** Jeton d'accès du compte de service, mis en cache jusqu'à une minute avant son expiration. */
export function metadataTokenProvider({ fetchImpl = fetch, now = Date.now } = {}) {
  let cached = null
  return async () => {
    if (cached && now() < cached.expiresAt) return cached.token
    const res = await fetchImpl(METADATA_TOKEN_URL, { headers: { 'Metadata-Flavor': 'Google' } })
    if (!res.ok) throw new Error(`Jeton du compte de service indisponible (${res.status})`)
    const { access_token: token, expires_in: expiresIn } = await res.json()
    cached = { token, expiresAt: now() + Math.max(0, (Number(expiresIn) || 0) - 60) * 1000 }
    return token
  }
}

/** Texte de la réponse : parties texte concaténées, sans les « pensées » des modèles récents. */
export function extractResponseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts
    .filter((p) => typeof p?.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
}

/** Décode le JSON de la réponse (tolère un bloc ```json … ```). */
export function parseModelJson(text) {
  let jsonStr = String(text ?? '').trim()
  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) jsonStr = codeBlock[1].trim()
  return JSON.parse(jsonStr)
}

export class VertexError extends Error {
  /** `billed` : un modèle a répondu, l'appel a donc coûté (il reste décompté du quota). */
  constructor(message, status, billed = false) {
    super(message)
    this.status = status
    this.billed = billed
  }
}

async function readError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.error?.message || text
  } catch {
    return text
  }
}

/**
 * @param {{ project: string, locations: string[], models: string[], getToken: () => Promise<string>, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createVertexClient({ project, locations, models, getToken, fetchImpl = fetch, timeoutMs = 45_000 }) {
  const candidates = models.flatMap((model) => locations.map((location) => ({ model, location })))
  let preferred = 0

  async function post(candidate, body) {
    const token = await getToken()
    return fetchImpl(endpointUrl({ project, ...candidate }), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  }

  return {
    /**
     * Génère une réponse JSON décodée.
     * @returns {Promise<{ parsed: object, model: string, location: string }>}
     */
    async generateJson({ systemInstruction, parts, schema }) {
      const order = [...candidates.slice(preferred), ...candidates.slice(0, preferred)]
      let lastError = null
      for (const candidate of order) {
        let withSchema = Boolean(schema)
        const build = () => ({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            ...(withSchema ? { responseSchema: schema } : {}),
          },
        })
        let res = await post(candidate, build())
        if (res.status === 400 && withSchema) {
          const message = await readError(res)
          // Modèle qui refuse le schéma de réponse : même requête sans schéma
          if (!/schema/i.test(message)) throw new VertexError(message, 400)
          withSchema = false
          res = await post(candidate, build())
        }
        if (res.ok) {
          preferred = candidates.indexOf(candidate)
          const data = await res.json()
          const text = extractResponseText(data)
          if (!text) throw new VertexError('Réponse du modèle vide.', 502, true)
          try {
            return { parsed: parseModelJson(text), model: candidate.model, location: candidate.location }
          } catch {
            throw new VertexError('Réponse du modèle illisible (JSON attendu).', 502, true)
          }
        }
        const message = await readError(res)
        // Modèle absent de cette région ou pas ouvert au projet : on essaie le suivant
        if (res.status === 404 || res.status === 403) {
          lastError = new VertexError(`${candidate.model}@${candidate.location} : ${message}`, res.status)
          continue
        }
        throw new VertexError(message, res.status)
      }
      throw lastError ?? new VertexError('Aucun modèle configuré.', 500)
    },
  }
}
