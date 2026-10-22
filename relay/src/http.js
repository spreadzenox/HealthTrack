/** Outils HTTP communs aux routes du relais. */

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new HttpError(413, 'too_large', 'Requête trop volumineuse.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function readJson(req, limit) {
  const raw = await readBody(req, limit)
  try {
    return JSON.parse(raw.toString('utf8'))
  } catch {
    throw new HttpError(400, 'bad_json', 'JSON attendu.')
  }
}
