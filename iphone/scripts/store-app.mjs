#!/usr/bin/env node
// Réglages de l'app elle-même dans App Store Connect, par l'API, **seulement sur l'accord explicite du propriétaire**
// (ce sont ses réglages : « Prix et disponibilité » et « Content Rights » de la page « Informations sur l'app »).
// Préparé le 3/11 : le relevé du workflow « Abonnements App Store » a montré « Prix et disponibilité » jamais rempli
// (`appAvailabilityV2` et `appPriceSchedule` en 404), sans doute la raison des abonnements « métadonnées manquantes ».
//
// - `--prix-et-disponibilite` : app gratuite (palier à 0 de la France, territoire de base), disponible dans les 5 pays
//   de la décision P32 du propriétaire (France, Belgique, Luxembourg, Suisse, Canada ; jamais les États-Unis), pas
//   dans les pays qu'Apple ajoutera. Ne crée que ce qui manque : une disponibilité ou un prix déjà réglés ne sont
//   jamais remplacés ici (écart signalé).
// - `--content-rights <USES_THIRD_PARTY_CONTENT|DOES_NOT_USE_THIRD_PARTY_CONTENT>` : la déclaration, faite au nom du
//   propriétaire ; jamais sans qu'il l'ait choisie.
// Sans option ou avec `--dry-run` : montre ce qui serait fait, sans réseau. Rien n'est soumis ni publié.
// Lancé par .github/workflows/store-app.yml avec la clé de l'environnement `appstore`, jamais affichée.
import { pathToFileURL } from 'node:url'
import { jwt } from './store-push.mjs'
import { client, TERRITORIES, TERRITORY } from './store-subscriptions.mjs'

const BUNDLE_ID = 'fr.jpesquet.sante'
export const CONTENT_RIGHTS = ['USES_THIRD_PARTY_CONTENT', 'DOES_NOT_USE_THIRD_PARTY_CONTENT']

const rel = (type, id) => ({ data: { type, id } })

/** Disponibilité de l'app dans `territories` seulement, pas dans les pays qu'Apple ajoutera. */
export function availabilityBody(appId, territories = TERRITORIES) {
  const local = (t) => `\${territory-${t}}`
  return {
    data: {
      type: 'appAvailabilities',
      attributes: { availableInNewTerritories: false },
      relationships: {
        app: rel('apps', appId),
        territoryAvailabilities: { data: territories.map((t) => ({ type: 'territoryAvailabilities', id: local(t) })) },
      },
    },
    included: territories.map((t) => ({
      type: 'territoryAvailabilities', id: local(t), attributes: { available: true }, relationships: { territory: rel('territories', t) },
    })),
  }
}

/** Prix de l'app : le palier `pricePointId` (gratuit) à partir d'aujourd'hui, la France comme territoire de base. */
export function priceScheduleBody(appId, pricePointId, baseTerritory = TERRITORY) {
  const local = '${price-free}'
  return {
    data: {
      type: 'appPriceSchedules',
      relationships: {
        app: rel('apps', appId),
        baseTerritory: rel('territories', baseTerritory),
        manualPrices: { data: [{ type: 'appPrices', id: local }] },
      },
    },
    included: [{ type: 'appPrices', id: local, attributes: { startDate: null }, relationships: { appPricePoint: rel('appPricePoints', pricePointId) } }],
  }
}

/** Le palier gratuit (prix client 0) parmi ceux de l'app ; erreur s'il n'y en a pas exactement un. */
export function freePricePoint(points) {
  const found = (points || []).filter((p) => Number(p?.attributes?.customerPrice) === 0)
  if (found.length !== 1) throw new Error(`palier gratuit : ${found.length} trouvé(s) en ${TERRITORY}`)
  return found[0]
}

async function exists(api, path) {
  try {
    return (await api('GET', path)).data ?? null
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

/** Applique ce que le propriétaire a demandé ; rend les lignes du compte rendu et les écarts (jamais remplacés). */
export async function applyAppSettings({ token, fetchImpl = fetch, priceAndAvailability = false, contentRights = null, log = () => {} }) {
  const { api, all } = client(token, fetchImpl)
  const drift = []
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data?.[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)

  if (priceAndAvailability) {
    if (await exists(api, `/v1/apps/${app.id}/appAvailabilityV2`)) {
      drift.push('disponibilité de l\'app déjà réglée : laissée telle quelle (à vérifier dans « Prix et disponibilité »)')
    } else {
      await api('POST', '/v2/appAvailabilities', availabilityBody(app.id))
      log(`Disponibilité de l'app : ${TERRITORIES.join(', ')}, pas dans les nouveaux pays`)
    }
    if (await exists(api, `/v1/apps/${app.id}/appPriceSchedule`)) {
      drift.push('prix de l\'app déjà réglé : laissé tel quel')
    } else {
      const point = freePricePoint(await all(`/v1/apps/${app.id}/appPricePoints?filter[territory]=${TERRITORY}&limit=200`))
      await api('POST', '/v1/appPriceSchedules', priceScheduleBody(app.id, point.id))
      log(`Prix de l'app : gratuit (territoire de base ${TERRITORY})`)
    }
  }

  if (contentRights) {
    if (!CONTENT_RIGHTS.includes(contentRights)) throw new Error(`Content Rights inconnu : ${contentRights}`)
    const current = app.attributes?.contentRightsDeclaration ?? null
    if (current === contentRights) log(`Content Rights : déjà ${contentRights}`)
    else {
      await api('PATCH', `/v1/apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: contentRights } } })
      log(`Content Rights : ${contentRights}${current ? ` (au lieu de ${current})` : ''}`)
    }
  }
  return { drift }
}

/** Options de la ligne de commande ; `--content-rights` doit nommer une des deux déclarations d'Apple. */
export function parseArgs(argv) {
  const at = argv.indexOf('--content-rights')
  const contentRights = at > 0 ? argv[at + 1] ?? '' : null
  if (contentRights !== null && !CONTENT_RIGHTS.includes(contentRights)) throw new Error(`--content-rights : ${CONTENT_RIGHTS.join(' ou ')}`)
  return { priceAndAvailability: argv.includes('--prix-et-disponibilite'), contentRights, dryRun: argv.includes('--dry-run') }
}

async function main() {
  const opts = parseArgs(process.argv)
  const plan = [
    opts.priceAndAvailability ? `prix et disponibilité : gratuite, ${TERRITORIES.join(', ')} (P32), pas dans les nouveaux pays` : null,
    opts.contentRights ? `Content Rights : ${opts.contentRights}` : null,
  ].filter(Boolean)
  console.log(plan.length ? `À faire : ${plan.join(' ; ')}` : 'Rien de demandé (options : --prix-et-disponibilite, --content-rights …)')
  if (opts.dryRun || !plan.length) return
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { drift } = await applyAppSettings({ token, ...opts, log: (l) => console.log(l) })
  for (const d of drift) console.log(`::warning::${d}`)
  console.log('Rien n\'a été soumis ni publié.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${e.message}`)
    process.exit(1)
  })
}
