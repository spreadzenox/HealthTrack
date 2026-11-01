import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Le déploiement du 22/10 (#278) a échoué : le séparateur « ^@^ » de --set-env-vars coupait l'adresse e-mail de
// relay-runtime. On relit la ligne du workflow comme gcloud (gcloud topic escaping) et on vérifie chaque variable.
const workflow = readFileSync(new URL('../../.github/workflows/relay-deploy.yml', import.meta.url), 'utf8')
const RUNTIME_SA = 'relay-runtime@healthtrack-824b26.iam.gserviceaccount.com'

function envVars() {
  const match = workflow.match(/--set-env-vars="([^"]+)"/)
  assert.ok(match, 'ligne --set-env-vars introuvable')
  let raw = match[1]
    .replaceAll('${GCP_PROJECT}', 'healthtrack-824b26')
    .replaceAll('${RELAY_URL}', 'https://halcya-relay-81378799481.europe-west1.run.app')
    .replaceAll('${RUNTIME_SA}', RUNTIME_SA)
  let sep = ','
  const custom = raw.match(/^\^(.)\^/)
  if (custom) {
    sep = custom[1]
    raw = raw.slice(3)
  }
  return raw.split(sep)
}

test('workflow relais : chaque variable de --set-env-vars est un couple CLÉ=valeur', () => {
  for (const item of envVars()) assert.match(item, /^[A-Z][A-Z0-9_]*=.+$/, `élément mal découpé : « ${item} »`)
})

test('workflow relais : les valeurs avec virgule ou @ restent entières', () => {
  const vars = Object.fromEntries(envVars().map((item) => item.split(/=(.*)/s).slice(0, 2)))
  assert.equal(vars.RTDN_SERVICE_ACCOUNT, RUNTIME_SA)
  assert.equal(vars.VERTEX_LOCATIONS, 'eu,europe-west1')
  assert.equal(vars.VERTEX_MODELS, 'gemini-3.5-flash-lite,gemini-3.1-flash-lite')
  assert.equal(vars.PLAY_PACKAGE, 'fr.jpesquet.sante')
})

test('workflow relais : Play Integrity déployé en mode observe (jalon 6b-2)', () => {
  const vars = Object.fromEntries(envVars().map((item) => item.split(/=(.*)/s).slice(0, 2)))
  assert.equal(vars.INTEGRITY_MODE, 'observe')
})

test('workflow relais : Gold sur le dernier Flash de la zone eu, réflexion MEDIUM, plafonds de coût (31/10)', () => {
  const vars = Object.fromEntries(envVars().map((item) => item.split(/=(.*)/s).slice(0, 2)))
  assert.equal(vars.GOLD_MODELS, 'gemini-3.8-flash')
  assert.equal(vars.GOLD_LOCATIONS, 'eu')
  assert.equal(vars.GOLD_THINKING_LEVEL, 'MEDIUM')
  assert.equal(vars.GOLD_MONTHLY_EUR, '15')
  assert.equal(vars.GLOBAL_DAILY_CAP, '150')
  // Gold puis son secours tiennent dans les 60 s de Cloud Run
  assert.ok(Number(vars.GOLD_TIMEOUT_MS) + Number(vars.VERTEX_TIMEOUT_MS) < 60_000)
  assert.match(workflow, /--timeout=60/)
})

test('workflow relais : bilan des analyses IA (GOLD-a2) qui sépare la CI et lit les secours Gold', () => {
  const step = workflow.slice(workflow.indexOf('Analyses IA des 7 derniers jours'))
  assert.ok(step.length > 40, 'étape GOLD-a2 absente')
  assert.match(step, /continue-on-error: true/)
  assert.match(step, /jsonPayload\.event=\\"analyze\\"/)
  assert.match(step, /jsonPayload\.event=\\"gold_fallback\\"/)
  assert.match(step, /jsonPayload\.ci == true/)
})
