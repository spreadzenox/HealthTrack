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

/** Période de lancement (P23) : relay/src/launch-period.json, embarqué dans l'image ; LAUNCH_PREMIUM_* l'emportent. */
const DEFAULT_LAUNCH_PERIOD = fileURLToPath(new URL('./launch-period.json', import.meta.url))

const num = (value, fallback) => {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function readLaunchPeriod(path = DEFAULT_LAUNCH_PERIOD) {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    return { from: String(raw.from ?? ''), until: String(raw.until ?? ''), off: raw.off === true }
  } catch {
    return { from: '', until: '', off: false }
  }
}

function launchFrom(env) {
  const file = readLaunchPeriod(env.LAUNCH_PERIOD_PATH || DEFAULT_LAUNCH_PERIOD)
  return {
    from: env.LAUNCH_PREMIUM_FROM ?? file.from,
    until: env.LAUNCH_PREMIUM_UNTIL ?? file.until,
    off: env.LAUNCH_PREMIUM_OFF !== undefined ? env.LAUNCH_PREMIUM_OFF === '1' : file.off,
  }
}

export function loadConfig(env = process.env) {
  return {
    port: int(env.PORT, 8080),
    project: env.VERTEX_PROJECT || 'healthtrack-824b26',
    locations: list(env.VERTEX_LOCATIONS, ['eu', 'europe-west1']),
    models: list(env.VERTEX_MODELS, ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']),
    // Flash-Lite : 30 s au plus, pour que Gold (25 s) puis son secours tiennent dans les 60 s de Cloud Run
    timeoutMs: int(env.VERTEX_TIMEOUT_MS, 30_000),
    // Gold (31/10) : dernier Flash de la zone eu, réflexion MEDIUM, ~25 s avant de passer à Flash-Lite
    goldModels: list(env.GOLD_MODELS, ['gemini-3.8-flash']),
    goldLocations: list(env.GOLD_LOCATIONS, ['eu']),
    goldThinkingLevel: env.GOLD_THINKING_LEVEL || 'MEDIUM',
    goldTimeoutMs: int(env.GOLD_TIMEOUT_MS, 25_000),
    goldDailyCap: int(env.GOLD_DAILY_CAP, 40),
    // Empreintes (12 caractères, comme dans les journaux) des installations qui gardent Gold après la période de lancement
    goldInstalls: list(env.GOLD_INSTALLS, []),
    // Coût Vertex du mois (src/costs.js) : Gold coupé au-delà de 15 €, toutes les analyses au-delà de 19 €
    goldMonthlyEur: num(env.GOLD_MONTHLY_EUR, 15),
    stopMonthlyEur: num(env.STOP_MONTHLY_EUR, 19),
    modelPrices: env.MODEL_PRICES || '',
    globalPerDay: int(env.GLOBAL_DAILY_CAP, 150),
    installPerDay: int(env.INSTALL_DAILY_CAP, 20),
    globalPerMinute: int(env.GLOBAL_PER_MINUTE_CAP, 10),
    // Crédits d'analyse IA (jalon 6c-3b) : offerts une fois, par mois (gratuit), par jour (premium)
    creditsWelcome: int(env.CREDITS_WELCOME, 10),
    creditsMonthly: int(env.CREDITS_MONTHLY, 15),
    premiumDaily: int(env.PREMIUM_DAILY_CAP, 10),
    // Gold (31/10) : 20 analyses par jour et par abonné (Silver : 10)
    goldDaily: int(env.GOLD_PREMIUM_DAILY_CAP, 20),
    // Registre durable des crédits (P24) : firestore | memory (tests, développement)
    creditsStore: env.CREDITS_STORE || 'firestore',
    // Abonnements Google Play (jalon 6b)
    packageName: env.PLAY_PACKAGE || 'fr.jpesquet.sante',
    publicUrl: env.PUBLIC_URL || 'https://halcya-relay-81378799481.europe-west1.run.app',
    rtdnServiceAccount: env.RTDN_SERVICE_ACCOUNT || 'relay-runtime@healthtrack-824b26.iam.gserviceaccount.com',
    // Banc Silver / Gold (GOLD-b5) : seul ce compte (la CI, jeton OIDC) peut choisir le niveau d'une analyse
    benchServiceAccount: env.BENCH_SERVICE_ACCOUNT || 'gh-deployer@healthtrack-824b26.iam.gserviceaccount.com',
    // « Période de lancement » (P23) : toute installation play est premium de `from` à `until` ; vide = aucune
    launchPremium: launchFrom(env),
    // Play Integrity (jalon 6b-2) : off | observe (vérifie et journalise) | enforce (bloque l'analyse sans verdict)
    integrityMode: env.INTEGRITY_MODE || 'observe',
    verifyPerDay: int(env.VERIFY_DAILY_CAP, 50),
    verifyGlobalPerDay: int(env.VERIFY_GLOBAL_DAILY_CAP, 5000),
    verifyPerMinute: int(env.VERIFY_PER_MINUTE_CAP, 60),
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
