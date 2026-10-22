/** Démarrage du relais sur Cloud Run (port fourni par la plateforme). */
import { createServer } from 'node:http'
import { loadConfig, loadIngredientNames } from './config.js'
import { createQuota } from './quota.js'
import { createHandler } from './server.js'
import { createVertexClient, metadataTokenProvider } from './vertex.js'

const config = loadConfig()
const ingredientNames = loadIngredientNames(config.ingredientsPath)

// Une ligne JSON par événement : Cloud Logging la lit comme un journal structuré
const log = (entry) => console.log(JSON.stringify({ severity: entry.event === 'error' ? 'ERROR' : 'INFO', ...entry }))

const handler = createHandler({
  quota: createQuota(config),
  vertex: createVertexClient({ ...config, getToken: metadataTokenProvider() }),
  ingredientNames,
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
  log({ event: 'start', port: config.port, models: config.models, locations: config.locations, ingredients: ingredientNames.length })
})
