#!/usr/bin/env node
// Abonnements App Store (I6) créés par l'API App Store Connect : autorisation permanente du propriétaire (« mettre à
// jour les produits d'abonnement par l'API »), une fois le contrat « Paid Applications » actif (A4, 1/11). Un groupe
// « Halcya », Gold au niveau 1 et Silver au niveau 2 (store/app-store/abonnements.md), en France seulement et en
// euros, comme les produits d'Android sur Google Play (app/scripts/play/subscriptions.mjs : région FR).
//
// Règle aussi l'adresse des notifications serveur de l'App Store (V2) sur celle du relais d'Android (I6-RELAIS-3).
// Idempotent, comme le script d'Android : on lit d'abord et on ne crée que ce qui manque. Un prix, un niveau ou un
// essai déjà en place n'est jamais modifié ici (un changement touche les abonnés : décision du propriétaire) ; un
// écart est seulement signalé. Rien n'est soumis à l'examen d'Apple (geste du propriétaire, avec une version de
// l'app). Lancé par .github/workflows/store-subscriptions.yml avec la clé de l'environnement `appstore`, jamais
// affichée. `--dry-run` : montre ce qui serait créé, sans réseau ni clé. `--capture-examen <fichier.png>` : envoie
// aussi cette capture de l'écran d'achat comme capture pour l'examen d'Apple de chaque abonnement (à la place de la
// précédente) ; sans elle, Apple les dit « métadonnées manquantes » et ils ne peuvent pas être soumis.
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { jwt, md5, slices } from './store-push.mjs'

const API = 'https://api.appstoreconnect.apple.com'
const BUNDLE_ID = 'fr.jpesquet.sante'
export const LOCALE = 'fr-FR'
/** Territoire de référence (prix décidés en euros, relevé détaillé). */
export const TERRITORY = 'FRA'
/**
 * Pays de vente, comme Google Play (décision P32 du propriétaire, 2/11 : France, Belgique, Suisse, Luxembourg, Canada ;
 * jamais les États-Unis ; Royaume-Uni et reste de l'UE avec l'anglais). Pas dans les territoires qu'Apple ajoutera.
 */
export const TERRITORIES = ['FRA', 'BEL', 'LUX', 'CHE', 'CAN']
export const CURRENCY = { FRA: '€', BEL: '€', LUX: '€', CHE: 'CHF', CAN: '$CA' }
/** Prix d'un abonnement dans chaque pays : zone euro au prix français ; Suisse et Canada comme Google Play (P32). */
const localPrices = (eur, chf, cad) => ({ FRA: eur, BEL: eur, LUX: eur, CHE: chf, CAN: cad })
export const GROUP = { referenceName: 'Halcya', name: 'Halcya' }
/**
 * Notifications serveur de l'App Store (version 2) : le relais d'Android les reçoit depuis la v691 (I6-RELAIS-3,
 * `relay/README.md` de HealthTrack) ; même adresse en production et en sandbox (TestFlight). Réglée sur l'app si elle
 * est vide ; une autre adresse déjà en place n'est jamais remplacée ici (écart signalé).
 */
export const NOTIFICATIONS = {
  url: 'https://halcya-relay-81378799481.europe-west1.run.app/appstore/notifications',
  version: 'V2',
}
/** Limites d'App Store Connect pour la fiche d'un abonnement (caractères). */
export const LIMITS = { name: 30, description: 45, referenceName: 64 }

/**
 * Les abonnements, dans l'ordre de création. Identifiants immuables chez Apple : ceux du plugin `AppStoreBilling`
 * (BillingRule.swift) et de la demande au relais (DEMANDES.md). Prix TTC en France, décidés par le propriétaire
 * (Silver, 20/10) et par la proposition P35 d'Android appliquée le 1/11 (Gold mensuel, sans essai).
 * `halcya_gold_annuel` (79,99 €) n'est créé que si l'annuel Gold est décidé.
 */
export const SUBSCRIPTIONS = [
  {
    productId: 'halcya_gold_mensuel', referenceName: 'Halcya Gold mensuel', groupLevel: 1, period: 'ONE_MONTH',
    price: '9.99', prices: localPrices('9.99', '9.90', '12.99'), name: 'Halcya Gold', description: 'IA : 20 par jour, quantités mieux estimées', trial: null,
  },
  {
    productId: 'halcya_premium_annuel', referenceName: 'Halcya Premium annuel', groupLevel: 2, period: 'ONE_YEAR',
    price: '29.99', prices: localPrices('29.99', '29.00', '39.99'), name: 'Halcya Silver annuel', description: 'Analyse IA des repas, 10 par jour',
    trial: { offerMode: 'FREE_TRIAL', duration: 'TWO_WEEKS', numberOfPeriods: 1 },
  },
  {
    productId: 'halcya_premium_mensuel', referenceName: 'Halcya Premium mensuel', groupLevel: 2, period: 'ONE_MONTH',
    price: '4.99', prices: localPrices('4.99', '4.90', '6.99'), name: 'Halcya Silver', description: 'Analyse IA des repas, 10 par jour', trial: null,
  },
]

const rel = (type, id) => ({ data: { type, id } })

/** Corps des requêtes de création (fonctions pures, testées). */
export const bodies = {
  group: (appId) => ({ data: { type: 'subscriptionGroups', attributes: { referenceName: GROUP.referenceName }, relationships: { app: rel('apps', appId) } } }),
  groupLocalization: (groupId) => ({
    data: { type: 'subscriptionGroupLocalizations', attributes: { locale: LOCALE, name: GROUP.name }, relationships: { subscriptionGroup: rel('subscriptionGroups', groupId) } },
  }),
  subscription: (s, groupId) => ({
    data: {
      type: 'subscriptions',
      attributes: { name: s.referenceName, productId: s.productId, subscriptionPeriod: s.period, groupLevel: s.groupLevel, familySharable: false },
      relationships: { group: rel('subscriptionGroups', groupId) },
    },
  }),
  localization: (s, subscriptionId) => ({
    data: { type: 'subscriptionLocalizations', attributes: { locale: LOCALE, name: s.name, description: s.description }, relationships: { subscription: rel('subscriptions', subscriptionId) } },
  }),
  availability: (subscriptionId, territories = TERRITORIES) => ({
    data: {
      type: 'subscriptionAvailabilities',
      attributes: { availableInNewTerritories: false },
      relationships: { subscription: rel('subscriptions', subscriptionId), availableTerritories: { data: territories.map((id) => ({ type: 'territories', id })) } },
    },
  }),
  price: (subscriptionId, pricePointId, territory = TERRITORY) => ({
    data: {
      type: 'subscriptionPrices',
      attributes: { preserveCurrentPrice: false },
      relationships: { subscription: rel('subscriptions', subscriptionId), subscriptionPricePoint: rel('subscriptionPricePoints', pricePointId), territory: rel('territories', territory) },
    },
  }),
  trial: (s, subscriptionId, territory = TERRITORY) => ({
    data: {
      type: 'subscriptionIntroductoryOffers',
      attributes: { ...s.trial },
      relationships: { subscription: rel('subscriptions', subscriptionId), territory: rel('territories', territory) },
    },
  }),
}

/**
 * Réglage des notifications serveur de l'app (attributs `subscriptionStatusUrl…` d'App Store Connect) : ce qu'il faut
 * envoyer (`attributes`, vide si tout est en place) et les écarts à signaler (`drift`), pour la production et la sandbox.
 */
export function notificationsPlan(appAttributes = {}) {
  const attributes = {}
  const drift = []
  for (const [urlKey, versionKey, label] of [
    ['subscriptionStatusUrl', 'subscriptionStatusUrlVersion', 'production'],
    ['subscriptionStatusUrlForSandbox', 'subscriptionStatusUrlVersionForSandbox', 'sandbox'],
  ]) {
    const url = appAttributes?.[urlKey] || null
    if (!url) {
      attributes[urlKey] = NOTIFICATIONS.url
      attributes[versionKey] = NOTIFICATIONS.version
    } else if (url !== NOTIFICATIONS.url) {
      drift.push(`notifications serveur (${label}) : ${url} en place, adresse du relais attendue (non modifiée)`)
    } else if (appAttributes?.[versionKey] !== NOTIFICATIONS.version) {
      attributes[versionKey] = NOTIFICATIONS.version
    }
  }
  return { attributes, drift }
}

const samePrice = (a, b) => Math.round(Number(a) * 100) === Math.round(Number(b) * 100)

/** Palier de prix d'Apple dont le prix client est `price` (« 4.99 »). Erreur s'il n'y en a pas exactement un. */
export function pricePointFor(points, price, territory = TERRITORY) {
  const found = (points || []).filter((p) => samePrice(p?.attributes?.customerPrice, price))
  if (found.length !== 1) throw new Error(`palier de prix ${price} ${CURRENCY[territory] ?? ''} : ${found.length} trouvé(s) en ${territory}`)
  return found[0]
}

/** Prix clients en place (réponse de /prices avec ses paliers inclus), sans doublon. */
export function currentPrices(response) {
  const byId = new Map((response?.included || []).filter((x) => x.type === 'subscriptionPricePoints').map((x) => [x.id, x.attributes?.customerPrice]))
  const out = (response?.data || []).map((p) => byId.get(p.relationships?.subscriptionPricePoint?.data?.id)).filter((x) => x != null)
  return [...new Set(out)]
}

/** Client de l'API : erreurs lisibles (sans la clé), statut HTTP gardé, pages suivies jusqu'au bout. */
export function client(token, fetchImpl = fetch) {
  async function api(method, path, body) {
    const url = path.startsWith('https://') ? path : `${API}${path}`
    const res = await fetchImpl(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = res.status === 204 ? {} : await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = (json.errors || []).map((e) => `${e.title || ''} ${e.detail || ''}`.trim()).join(' ; ')
      const err = new Error(`${method} ${url.replace(API, '').split('?')[0]} : ${res.status} ${detail}`)
      err.status = res.status
      throw err
    }
    return json
  }
  async function all(path) {
    const out = []
    let next = path
    while (next) {
      const page = await api('GET', next)
      out.push(...(page.data || []))
      next = page.links?.next || null
    }
    return out
  }
  return { api, all }
}

/**
 * Crée ce qui manque, écrit une ligne par élément dans `log` et rend `{ drift, states }` : `drift`, les écarts
 * entre ce qui est en place et ce qui est décidé (jamais corrigés ici) ; `states`, l'état de chaque abonnement chez
 * Apple (`MISSING_METADATA` tant que la capture pour l'examen manque). `reviewScreenshot` (`{ name, bytes }`) : la
 * capture de l'écran d'achat, envoyée pour chaque abonnement à la place de la précédente.
 */
export async function ensureSubscriptions({ token, fetchImpl = fetch, log = () => {}, reviewScreenshot = null }) {
  const { api, all } = client(token, fetchImpl)
  const drift = []
  const states = {}
  const say = log

  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)
  const app = apps.data?.[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)

  const plan = notificationsPlan(app.attributes)
  drift.push(...plan.drift)
  if (Object.keys(plan.attributes).length) {
    await api('PATCH', `/v1/apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: plan.attributes } })
    say(`Notifications serveur de l'App Store (V2, production et sandbox) : adresse du relais réglée`)
  } else if (!plan.drift.length) say(`Notifications serveur de l'App Store : déjà réglées`)

  const groups = await all(`/v1/apps/${app.id}/subscriptionGroups?limit=50`)
  let group = groups.find((g) => g.attributes?.referenceName === GROUP.referenceName)
  if (group) say(`Groupe « ${GROUP.referenceName} » : déjà là`)
  else {
    group = (await api('POST', '/v1/subscriptionGroups', bodies.group(app.id))).data
    say(`Groupe « ${GROUP.referenceName} » : créé`)
  }

  const groupLocs = await all(`/v1/subscriptionGroups/${group.id}/subscriptionGroupLocalizations?limit=50`)
  if (groupLocs.some((l) => l.attributes?.locale === LOCALE)) say(`Groupe, nom affiché ${LOCALE} : déjà là`)
  else {
    await api('POST', '/v1/subscriptionGroupLocalizations', bodies.groupLocalization(group.id))
    say(`Groupe, nom affiché ${LOCALE} (« ${GROUP.name} ») : créé`)
  }

  const existing = await all(`/v1/subscriptionGroups/${group.id}/subscriptions?limit=50`)
  for (const s of SUBSCRIPTIONS) {
    const done = []
    let sub = existing.find((x) => x.attributes?.productId === s.productId)
    if (sub) {
      const a = sub.attributes || {}
      if (a.groupLevel != null && a.groupLevel !== s.groupLevel) drift.push(`${s.productId} : niveau ${a.groupLevel} en place, ${s.groupLevel} décidé`)
      if (a.subscriptionPeriod && a.subscriptionPeriod !== s.period) drift.push(`${s.productId} : durée ${a.subscriptionPeriod} en place, ${s.period} décidée`)
    } else {
      sub = (await api('POST', '/v1/subscriptions', bodies.subscription(s, group.id))).data
      done.push('créé')
    }
    const id = sub.id

    const locs = await all(`/v1/subscriptions/${id}/subscriptionLocalizations?limit=50`)
    const loc = locs.find((l) => l.attributes?.locale === LOCALE)
    if (!loc) {
      await api('POST', '/v1/subscriptionLocalizations', bodies.localization(s, id))
      done.push(`nom et description ${LOCALE} créés`)
    } else if (loc.attributes?.name !== s.name || loc.attributes?.description !== s.description) {
      await api('PATCH', `/v1/subscriptionLocalizations/${loc.id}`, {
        data: { type: 'subscriptionLocalizations', id: loc.id, attributes: { name: s.name, description: s.description } },
      })
      done.push(`nom et description ${LOCALE} mis à jour`)
    }

    let availability = null
    try {
      availability = await api('GET', `/v1/subscriptions/${id}/subscriptionAvailability?include=availableTerritories`)
    } catch (e) {
      if (e.status !== 404) throw e
    }
    const inPlace = availability?.data
      ? (availability.data.relationships?.availableTerritories?.data || availability.included || []).map((t) => t.id)
      : []
    const missingTerritories = TERRITORIES.filter((t) => !inPlace.includes(t))
    if (missingTerritories.length) {
      // Une disponibilité neuve remplace la précédente : les pays déjà ouverts sont gardés, ceux de P32 ajoutés
      const wanted = [...new Set([...inPlace, ...TERRITORIES])]
      try {
        await api('POST', '/v1/subscriptionAvailabilities', bodies.availability(id, wanted))
        done.push(`en vente en ${wanted.join(', ')}`)
      } catch (e) {
        drift.push(`${s.productId} : pays non ajoutés (${missingTerritories.join(', ')}) : ${e.message}`)
      }
    }

    for (const territory of TERRITORIES) {
      const price = s.prices?.[territory] ?? (territory === TERRITORY ? s.price : null)
      if (!price) continue
      const unit = CURRENCY[territory]
      const prices = currentPrices(await api('GET', `/v1/subscriptions/${id}/prices?filter[territory]=${territory}&include=subscriptionPricePoint&limit=50`))
      if (prices.length === 0) {
        const pointsPath = `/v1/subscriptions/${id}/pricePoints?filter[territory]=${territory}&limit=200`
        try {
          let point
          try {
            point = pricePointFor(await all(pointsPath), price, territory)
          } catch {
            // Plusieurs paliers au même prix (paiement « UPFRONT » et « MONTHLY » d'Apple) : celui du paiement d'avance
            point = pricePointFor(await all(`${pointsPath}&filter[planType]=UPFRONT`), price, territory)
          }
          await api('POST', '/v1/subscriptionPrices', bodies.price(id, point.id, territory))
          done.push(`prix ${price.replace('.', ',')} ${unit} fixé en ${territory}`)
        } catch (e) {
          drift.push(`${s.productId} : prix ${price} ${unit} non fixé en ${territory} : ${e.message}`)
        }
      } else if (!prices.some((p) => samePrice(p, price))) {
        drift.push(`${s.productId} : prix ${prices.join(' / ')} ${unit} en place en ${territory}, ${price} ${unit} décidé (non modifié)`)
      }
    }

    if (s.trial) {
      const offers = await all(`/v1/subscriptions/${id}/introductoryOffers?include=territory&limit=50`)
      const created = []
      for (const territory of TERRITORIES) {
        const here = offers.filter((o) => (o.relationships?.territory?.data?.id ?? TERRITORY) === territory)
        if (here.length === 0) {
          try {
            await api('POST', '/v1/subscriptionIntroductoryOffers', bodies.trial(s, id, territory))
            created.push(territory)
          } catch (e) {
            drift.push(`${s.productId} : essai non créé en ${territory} : ${e.message}`)
          }
        } else if (!here.some((o) => o.attributes?.offerMode === s.trial.offerMode && o.attributes?.duration === s.trial.duration)) {
          drift.push(`${s.productId} : offre de lancement en place en ${territory} différente de l'essai de 2 semaines (non modifiée)`)
        }
      }
      if (created.length) done.push(`essai gratuit de 2 semaines créé en ${created.join(', ')}`)
    }

    if (reviewScreenshot) {
      await uploadReviewScreenshot({ api, fetchImpl }, id, reviewScreenshot)
      done.push(`capture pour l'examen envoyée (${reviewScreenshot.name})`)
    }

    const fresh = await api('GET', `/v1/subscriptions/${id}`)
    states[s.productId] = fresh.data?.attributes?.state ?? '?'
    say(`${s.productId} : ${done.length ? done.join(', ') : 'déjà en place'} ; état chez Apple : ${states[s.productId]}`)
  }
  return { drift, states }
}

/**
 * Capture pour l'examen d'un abonnement (l'écran d'achat de l'app), à la place de la précédente : réservation chez
 * Apple, envoi des morceaux demandés, puis empreinte MD5 pour qu'Apple la vérifie.
 */
export async function uploadReviewScreenshot({ api, fetchImpl = fetch }, subscriptionId, { name, bytes }) {
  let old = null
  try {
    old = (await api('GET', `/v1/subscriptions/${subscriptionId}/appStoreReviewScreenshot`)).data
  } catch (e) {
    if (e.status !== 404) throw e
  }
  if (old?.id) await api('DELETE', `/v1/subscriptionAppStoreReviewScreenshots/${old.id}`)
  const created = (await api('POST', '/v1/subscriptionAppStoreReviewScreenshots', {
    data: {
      type: 'subscriptionAppStoreReviewScreenshots',
      attributes: { fileName: name, fileSize: bytes.length },
      relationships: { subscription: rel('subscriptions', subscriptionId) },
    },
  })).data
  for (const part of slices(bytes, created?.attributes?.uploadOperations)) {
    const res = await fetchImpl(part.url, { method: part.method, headers: part.headers, body: part.body })
    if (!res.ok) throw new Error(`envoi de ${name} : ${res.status}`)
  }
  await api('PATCH', `/v1/subscriptionAppStoreReviewScreenshots/${created.id}`, {
    data: { type: 'subscriptionAppStoreReviewScreenshots', id: created.id, attributes: { uploaded: true, sourceFileChecksum: md5(bytes) } },
  })
  return created.id
}

/** Capture PNG lue sur le disque, ou erreur claire (fichier absent, pas un PNG). */
export function readReviewScreenshot(path) {
  const bytes = readFileSync(path)
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${path} n'est pas un PNG`)
  return { name: basename(path), bytes }
}

/** Pays de l'app, résumés par rapport à ceux de P32 : nombre, États-Unis ou non, pays de P32 manquants. */
export function appTerritories(ids) {
  const missing = TERRITORIES.filter((t) => !ids.includes(t))
  const extra = ids.filter((t) => !TERRITORIES.includes(t))
  const head = `app disponible dans ${ids.length} pays${ids.includes('USA') ? ', États-Unis compris' : ''}`
  return [head, missing.length ? `manquent ${missing.join(', ')}` : 'les 5 de P32', extra.length ? `${extra.length} hors P32` : null].filter(Boolean).join(', ')
}

/** Une lecture du relevé qui ne doit pas l'interrompre : son résultat, ou « illisible (statut) ». */
async function readable(read, show, absent = null) {
  try {
    return show(await read())
  } catch (e) {
    if (e.status === 404 && absent) return absent
    return `illisible (${e.status ?? e.message})`
  }
}

/**
 * Relevé sans écriture, quand Apple dit un abonnement « métadonnées manquantes » : état de chaque pièce qu'App Store
 * Connect exige avant une soumission (nom et description, capture pour l'examen, prix, territoires, nom du groupe).
 * Rend une ligne par abonnement.
 */
export async function diagnose({ token, fetchImpl = fetch }) {
  const { api, all } = client(token, fetchImpl)
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data?.[0]
  const group = (await all(`/v1/apps/${app.id}/subscriptionGroups?limit=50`)).find((g) => g.attributes?.referenceName === GROUP.referenceName)
  // Pays où l'app elle-même est disponible (réglage du propriétaire, « Prix et disponibilité ») : sans eux, un
  // abonnement en vente ailleurs ne sert à rien, et l'inverse laisse l'écran d'achat vide
  const where = await readable(async () => {
    const av = (await api('GET', `/v1/apps/${app.id}/appAvailabilityV2`)).data
    return all(`/v2/appAvailabilities/${av.id}/territoryAvailabilities?include=territory&limit=200`)
  }, (list) => appTerritories(list.filter((x) => x.attributes?.available).map((x) => x.relationships?.territory?.data?.id).filter(Boolean)),
  'disponibilité de l\'app non réglée (« Prix et disponibilité » vide)')
  const price = await readable(
    () => api('GET', `/v1/apps/${app.id}/appPriceSchedule?include=baseTerritory,manualPrices`),
    (r) => `prix de l'app réglé (territoire de base ${r.data?.relationships?.baseTerritory?.data?.id ?? '?'})`,
    'prix de l\'app non réglé',
  )
  const lines = [`app : langue principale ${app.attributes?.primaryLocale ?? '?'} ; ${where} ; ${price}`]
  if (!group) return [...lines, 'aucun groupe « Halcya »']
  const groupLocs = await all(`/v1/subscriptionGroups/${group.id}/subscriptionGroupLocalizations?limit=50`)
  lines.push(`groupe : ${groupLocs.map((l) => `${l.attributes?.locale} « ${l.attributes?.name} » ${l.attributes?.state ?? '?'}`).join(', ') || 'aucun nom affiché'}`)
  for (const sub of await all(`/v1/subscriptionGroups/${group.id}/subscriptions?limit=50`)) {
    const id = sub.id
    const parts = [`état ${sub.attributes?.state}`]
    const locs = await all(`/v1/subscriptions/${id}/subscriptionLocalizations?limit=50`)
    parts.push(`noms ${locs.map((l) => `${l.attributes?.locale} ${l.attributes?.state ?? '?'}`).join(', ') || 'aucun'}`)
    let shot = null
    try {
      shot = (await api('GET', `/v1/subscriptions/${id}/appStoreReviewScreenshot`)).data
    } catch (e) {
      if (e.status !== 404) throw e
    }
    const delivery = shot?.attributes?.assetDeliveryState
    parts.push(`capture ${shot ? `${delivery?.state ?? '?'}${delivery?.errors?.length ? ` (${delivery.errors.map((x) => x.code || x.description).join(', ')})` : ''}` : 'absente'}`)
    const byTerritory = []
    for (const territory of TERRITORIES) {
      const prices = await api('GET', `/v1/subscriptions/${id}/prices?filter[territory]=${territory}&include=subscriptionPricePoint&limit=50`)
      byTerritory.push(`${territory} ${currentPrices(prices).join(' / ') || 'aucun'}`)
    }
    parts.push(`prix ${byTerritory.join(', ')}`)
    let availability = null
    try {
      availability = await api('GET', `/v1/subscriptions/${id}/subscriptionAvailability?include=availableTerritories`)
    } catch (e) {
      if (e.status !== 404) throw e
    }
    parts.push(`territoires ${(availability?.included || []).map((t) => t.id).join(', ') || 'aucun'}`)
    // Pièces plus récentes de l'API (4.5) : note pour l'examen, formules de paiement (MONTHLY / UPFRONT) et versions
    // de l'abonnement (« Prepare for Submission » de l'interface) ; lues sans jamais faire échouer le relevé
    const note = sub.attributes?.reviewNote
    parts.push(`note pour l'examen ${note ? `${[...note].length} car.` : 'absente'}`)
    parts.push(`formules ${await readable(() => all(`/v1/subscriptions/${id}/planAvailabilities?limit=50`), (list) => list.map((x) => x.attributes?.planType ?? '?').join(', ') || 'aucune')}`)
    parts.push(`versions ${await readable(() => all(`/v1/subscriptions/${id}/versions?limit=50`), (list) => list.map((x) => `${x.attributes?.version ?? '?'} ${x.attributes?.state ?? '?'}`).join(', ') || 'aucune')}`)
    lines.push(`${sub.attributes?.productId} : ${parts.join(' ; ')}`)
  }
  return lines
}

function dryRun(log) {
  log(`Notifications serveur de l'App Store : ${NOTIFICATIONS.url} (${NOTIFICATIONS.version}, production et sandbox)`)
  log(`Groupe « ${GROUP.referenceName} » (nom affiché ${LOCALE} : « ${GROUP.name} »), en vente en ${TERRITORIES.join(', ')} (P32)`)
  for (const s of SUBSCRIPTIONS) {
    const trial = s.trial ? `, essai ${s.trial.duration} (${s.trial.offerMode})` : ''
    const local = TERRITORIES.map((t) => `${t} ${s.prices[t]} ${CURRENCY[t]}`).join(', ')
    log(`- ${s.productId} : niveau ${s.groupLevel}, ${s.period}, ${s.price} €${trial} ; « ${s.name} » / « ${s.description} » ; ${local}`)
  }
}

async function main() {
  const log = (line) => console.log(line)
  dryRun(log)
  const at = process.argv.indexOf('--capture-examen')
  const reviewScreenshot = at > 0 ? readReviewScreenshot(process.argv[at + 1]) : null
  if (reviewScreenshot) log(`Capture pour l'examen : ${reviewScreenshot.name} (${reviewScreenshot.bytes.length} octets), pour chaque abonnement`)
  if (process.argv.includes('--dry-run')) return
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { drift, states } = await ensureSubscriptions({ token, log, reviewScreenshot })
  for (const d of drift) console.log(`::warning::${d}`)
  const missing = Object.entries(states).filter(([, st]) => st === 'MISSING_METADATA').map(([id]) => id)
  if (missing.length) {
    console.log(`Encore « métadonnées manquantes » chez Apple : ${missing.join(', ')} ; relevé, sans écriture :`)
    for (const line of await diagnose({ token })) console.log(`  ${line}`)
  }
  console.log('Rien n\'a été soumis à l\'examen d\'Apple : la première soumission des abonnements se fait avec une version de l\'app, par le propriétaire.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${e.message}`)
    process.exit(1)
  })
}
