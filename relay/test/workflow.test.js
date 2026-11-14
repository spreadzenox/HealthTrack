import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config.js'

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

test('workflow relais : GOLD_INSTALLS ne liste que l’installation confirmée par le propriétaire (P37, GOLD-a3-2)', () => {
  const vars = Object.fromEntries(envVars().map((item) => item.split(/=(.*)/s).slice(0, 2)))
  // Empreinte de 12 caractères (hashInstallId), rien de personnel ; une de plus donnerait Gold à un testeur
  assert.deepEqual(loadConfig({ GOLD_INSTALLS: vars.GOLD_INSTALLS }).goldInstalls, ['5e4a69f72ffb'])
})

test('workflow relais : bilan des analyses IA (GOLD-a2) qui sépare la CI et lit les secours Gold', () => {
  const step = workflow.slice(workflow.indexOf('Analyses IA des 7 derniers jours'))
  assert.ok(step.length > 40, 'étape GOLD-a2 absente')
  assert.match(step, /continue-on-error: true/)
  assert.match(step, /jsonPayload\.event=\\"analyze\\"/)
  assert.match(step, /jsonPayload\.event=\\"gold_fallback\\"/)
  assert.match(step, /jsonPayload\.ci == true/)
})

test('workflow relais : relevé des testeurs actifs (P44-2), robots, CI et iPhone écartés', () => {
  const at = (day) => `2026-11-${day}T10:00:00Z`
  const analyze = (install, day, more = {}) => ({ timestamp: at(day), jsonPayload: { event: 'analyze', kind: 'photo', install, ...more } })
  const integrity = (install, more = {}) => ({ timestamp: at('09'), jsonPayload: { event: 'integrity', status: 'passed', install, ...more } })
  const dir = mkdtempSync(join(tmpdir(), 'p44-'))
  writeFileSync(join(dir, 'a.json'), JSON.stringify([
    analyze('aaaaaaaaaaaa', '09'), analyze('aaaaaaaaaaaa', '12', { kind: 'text' }),
    analyze('bbbbbbbbbbbb', '10'), // jamais de jeton accepté
    analyze('cccccccccccc', '10'), // robot Google
    analyze('dddddddddddd', '10'), // iPhone
    analyze('eeeeeeeeeeee', '10', { ci: true }),
    analyze('ffffffffffff', '10', { kind: 'stool' }), // pas un repas
    analyze('111111111111', '10', { unreadable: true }),
  ]))
  writeFileSync(join(dir, 'i.json'), JSON.stringify([
    integrity('aaaaaaaaaaaa'), integrity('bbbbbbbbbbbb', { status: 'missing' }),
    integrity('cccccccccccc', { testlab: true }), integrity('dddddddddddd', { status: 'not_android', platform: 'ios' }),
    integrity('ffffffffffff'), { timestamp: at('09'), jsonPayload: { event: 'integrity', status: 'unavailable' } },
  ]))
  const out = execFileSync('jq', ['-r', '--slurpfile', 'integrity', join(dir, 'i.json'), '-f', new URL('../p44-active.jq', import.meta.url).pathname, join(dir, 'a.json')], { encoding: 'utf8' })
  assert.equal(out, [
    'Testeurs actifs (P44) : 1 installation(s) à inscrire, 1 sans jeton accepté, 2 écartée(s) (CI, robots, réseau de test, iPhone)',
    'À inscrire dans offered.installs : ["aaaaaaaaaaaa"]',
    '- aaaaaaaaaaaa : 2 repas, 2026-11-09 → 2026-11-12',
    '- bbbbbbbbbbbb : 1 repas, 2026-11-10 → 2026-11-10 (sans jeton accepté)',
    '',
  ].join('\n'))
  // L'étape lit la période du test, pas les 7 derniers jours, et ne bloque jamais le déploiement
  const step = workflow.slice(workflow.indexOf('Testeurs actifs (P44-2'))
  assert.match(step, /continue-on-error: true/)
  assert.match(step, /timestamp>=\\"2026-11-08T00:00:00Z\\" AND timestamp<\\"2026-12-02T23:00:00Z\\"/)
  assert.match(step, /p44-active\.jq/)
})
