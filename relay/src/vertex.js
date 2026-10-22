/**
 * Appel de Gemini sur Vertex AI, dans l'UE, avec l'identité du service Cloud Run (relay-runtime) : jeton OAuth lu sur
 * le serveur de métadonnées, aucune clé API.
 *
 * Modèles et régions essayés dans l'ordre (le moins cher adapté d'abord) ; on passe au suivant seulement si le
 * modèle est introuvable, indisponible dans la région, refuse la requête ou répond sans JSON exploitable (sauf
 * plafond 429), et l'on retient ensuite le couple qui a marché.
 */
const METADATA_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token'

// Multi-régions (« eu ») : hôte dédié ; c'est le seul accès UE aux Flash-Lite 3.x (absents d'europe-west1/4)
const host = (location) =>
  /^(eu|us)$/.test(location) ? `aiplatform.${location}.rep.googleapis.com` : `${location}-aiplatform.googleapis.com`

export const endpointUrl = ({ project, location, model }) =>
  `https://${host(location)}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`

/** Jeton d'accès du compte de service, mis en cache jusqu'à une minute avant son expiration. */
export function metadataTokenProvider({ scopes = [], fetchImpl = fetch, now = Date.now } = {}) {
  let cached = null
  // Portée par défaut (cloud-platform) pour Vertex AI ; l'API Android Publisher demande la sienne
  const url = scopes.length ? `${METADATA_TOKEN_URL}?scopes=${scopes.map(encodeURIComponent).join(',')}` : METADATA_TOKEN_URL
  return async () => {
    if (cached && now() < cached.expiresAt) return cached.token
    const res = await fetchImpl(url, { headers: { 'Metadata-Flavor': 'Google' } })
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
      let billed = false
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
          if (/schema/i.test(message)) {
            withSchema = false
            res = await post(candidate, build())
          } else {
            lastError = new VertexError(`${candidate.model}@${candidate.location} : ${message}`, 400)
            continue
          }
        }
        if (res.ok) {
          const data = await res.json()
          const text = extractResponseText(data)
          let parsed
          try {
            parsed = text ? parseModelJson(text) : undefined
          } catch {
            parsed = undefined
          }
          if (parsed === undefined) {
            // Le modèle a répondu (appel facturé) mais sans JSON exploitable : on essaie le suivant
            const why = text ? 'Réponse du modèle illisible (JSON attendu).' : 'Réponse du modèle vide.'
            lastError = new VertexError(`${candidate.model}@${candidate.location} : ${why}`, 502, true)
            billed = true
            continue
          }
          preferred = candidates.indexOf(candidate)
          return { parsed, model: candidate.model, location: candidate.location }
        }
        const message = await readError(res)
        // Plafond atteint chez Google : inutile d'insister sur d'autres modèles
        if (res.status === 429) throw new VertexError(message, 429, billed)
        // Modèle absent de cette région, pas ouvert au projet, requête qu'il refuse ou panne : on essaie le suivant
        lastError = new VertexError(`${candidate.model}@${candidate.location} : ${message}`, res.status, billed)
      }
      if (lastError) lastError.billed = billed
      throw lastError ?? new VertexError('Aucun modèle configuré.', 500)
    },
  }
}
