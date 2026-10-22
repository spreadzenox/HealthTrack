/**
 * Réglages du relais, lus dans l'environnement du service Cloud Run (fixés par .github/workflows/relay-deploy.yml).
 * Valeurs par défaut prudentes : petits plafonds, modèle le moins cher d'abord, région UE.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const list = (value, fallback) => {
  const items = String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return items.length ? items : fallback
}

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** Le dépôt garde la base d'ingrédients dans l'app ; l'image Docker en embarque une copie (INGREDIENTS_PATH). */
const DEFAULT_INGREDIENTS = fileURLToPath(new URL('../../app/src/data/ingredientsNutrition.json', import.meta.url))

export function loadConfig(env = process.env) {
  return {
    port: int(env.PORT, 8080),
    project: env.VERTEX_PROJECT || 'healthtrack-824b26',
    locations: list(env.VERTEX_LOCATIONS, ['europe-west1', 'europe-west4']),
    models: list(env.VERTEX_MODELS, ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']),
    globalPerDay: int(env.GLOBAL_DAILY_CAP, 200),
    installPerDay: int(env.INSTALL_DAILY_CAP, 20),
    globalPerMinute: int(env.GLOBAL_PER_MINUTE_CAP, 10),
    ingredientsPath: env.INGREDIENTS_PATH || DEFAULT_INGREDIENTS,
    // WebView Capacitor (https://localhost sur Android) et serveur de développement Vite
    allowedOrigins: list(env.ALLOWED_ORIGINS, ['https://localhost', 'http://localhost', 'capacitor://localhost', 'http://localhost:5173']),
  }
}

/** Noms canoniques de la base d'ingrédients, dans son ordre (clés de l'objet JSON). */
export function loadIngredientNames(path) {
  const table = JSON.parse(readFileSync(path, 'utf8'))
  const names = Object.keys(table)
  if (!names.length) throw new Error(`Base d'ingrédients vide : ${path}`)
  return names
}
