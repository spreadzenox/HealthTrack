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
  assert.equal(vars.VERTEX_LOCATIONS, 'europe-west1,europe-west4')
  assert.equal(vars.PLAY_PACKAGE, 'fr.jpesquet.sante')
})
