/** Démarrage du relais sur Cloud Run (port fourni par la plateforme). */
import { createServer } from 'node:http'
import { loadConfig, loadIngredientNames } from './config.js'
import { createQuota } from './quota.js'
import { DATASTORE_SCOPE, createCredits, createFirestoreStore } from './credits.js'
import { createHandler, hashInstallId } from './server.js'
import { ANDROIDPUBLISHER_SCOPE, createBillingRoutes, createPlayClient, createPushVerifier } from './billing.js'
import { PLAYINTEGRITY_SCOPE, createIntegrityClient, createIntegrityGuard } from './integrity.js'
import { createVertexClient, metadataTokenProvider } from './vertex.js'

const config = loadConfig()
const ingredientNames = loadIngredientNames(config.ingredientsPath)

// Une ligne JSON par événement : Cloud Logging la lit comme un journal structuré
const log = (entry) => console.log(JSON.stringify({ severity: entry.event === 'error' ? 'ERROR' : 'INFO', ...entry }))

const handler = createHandler({
  quota: createQuota(config),
  vertex: createVertexClient({ ...config, getToken: metadataTokenProvider() }),
  ingredientNames,
  credits: createCredits({
    welcome: config.creditsWelcome,
    freeMonthly: config.creditsMonthly,
    premiumDaily: config.premiumDaily,
    store: config.creditsStore === 'firestore'
      ? createFirestoreStore({ project: config.project, getToken: metadataTokenProvider({ scopes: [DATASTORE_SCOPE] }) })
      : null,
  }),
  billing: createBillingRoutes({
    play: createPlayClient({ packageName: config.packageName, getToken: metadataTokenProvider({ scopes: [ANDROIDPUBLISHER_SCOPE] }) }),
    packageName: config.packageName,
    launchPremium: config.launchPremium,
    verifyPush: createPushVerifier({ audience: `${config.publicUrl}/pubsub/rtdn`, serviceAccount: config.rtdnServiceAccount }),
    log,
  }),
  integrity: createIntegrityGuard({
    client: createIntegrityClient({ packageName: config.packageName, getToken: metadataTokenProvider({ scopes: [PLAYINTEGRITY_SCOPE] }) }),
    packageName: config.packageName,
    mode: config.integrityMode,
    hash: hashInstallId,
    log,
  }),
  billingQuota: createQuota({ installPerDay: config.verifyPerDay, globalPerDay: config.verifyGlobalPerDay, globalPerMinute: config.verifyPerMinute }),
  allowedOrigins: config.allowedOrigins,
  log,
})

createServer((req, res) => {
  handler(req, res).catch((err) => {
    log({ event: 'error', message: String(err?.message ?? err).slice(0, 300) })
    if (!res.headersSent) res.writeHead(500)
    res.end()
  })
}).listen(config.port, () => {
  log({ event: 'start', port: config.port, models: config.models, locations: config.locations, ingredients: ingredientNames.length, launchPremium: config.launchPremium, integrity: config.integrityMode, creditsStore: config.creditsStore })
})
