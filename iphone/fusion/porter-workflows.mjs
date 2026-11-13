#!/usr/bin/env node
// Porte les workflows du dépôt HealthTrack-iOS vers le dépôt unique : mêmes étapes, lancées depuis iphone/.
// Lancé par iphone/fusion/importer.sh à chaque import (le dépôt iOS change ses workflows jusqu'à la bascule) :
//   node porter-workflows.mjs <dossier .github/workflows du dépôt iOS> <dossier .github/workflows de ce dépôt> <sha>
//
// Ce qui change, et rien d'autre :
//   - nom du fichier : préfixe « ios- » (ios-build.yml garde le sien) ;
//   - filtres par chemins : tout est sous iphone/ ; la build du simulateur ne part que pour iphone/** (une PR
//     purement Android ne lance aucun runner macOS) ;
//   - dossier de travail : iphone/ pour toutes les étapes ; chemins des actions (cache, artefacts, checkouts) préfixés ;
//   - checkout avec l'historique des commits (numéros de version) sans les contenus (filter: blob:none) ;
//   - jobs de l'environnement « appstore » : derrière la garde iphone/fusion/garde.sh (main + interrupteur).
// pages.yml n'est pas porté : ce dépôt a déjà son site (voir ios-site.yml, écrit à la main, qui ne publie rien).
// Une forme inattendue dans un workflow source arrête le portage : mieux vaut une erreur qu'un workflow à moitié porté.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'iphone'
const SKIP = new Set(['pages.yml'])
export const targetName = (name) => (name.startsWith('ios-') ? name : `ios-${name}`)

const renameWorkflowPath = (p) => p.replace(/^\.github\/workflows\/(?!ios-)/, '.github/workflows/ios-')

function portPaths(key, list, target) {
  if (key === 'paths') return list.map((p) => (p.startsWith('.github/') ? renameWorkflowPath(p) : `${DIR}/${p}`))
  // paths-ignore du dépôt iOS (« tout sauf ») → dans le dépôt unique : iphone/** sauf ces chemins
  const ignored = list.filter((p) => !p.startsWith('.github/')).map((p) => `!${DIR}/${p}`)
  return [`${DIR}/**`, `.github/workflows/${target}`, ...ignored, `!${DIR}/fusion/**`]
}

const GUARD_JOB = `  # Garde de la bascule : ce workflow publie chez Apple. Il ne démarre que sur main, et seulement quand
  # iphone/fusion/bascule.json l'autorise (voir iphone/fusion/BASCULE.md). Sinon le job suivant est sauté.
  garde:
    name: Publication iOS activée ?
    runs-on: ubuntu-latest
    timeout-minutes: 2
    outputs:
      publication: \${{ steps.garde.outputs.publication }}
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: ${DIR}/fusion
      - id: garde
        run: fusion/garde.sh
`

export function port(source, name, sha) {
  const target = targetName(name)
  const fail = (why) => {
    throw new Error(`${name} : ${why} (adapter iphone/fusion/porter-workflows.mjs)`)
  }
  if (/^defaults:/m.test(source)) fail('bloc « defaults » inattendu')
  const lines = source.replace(/\n$/, '').split('\n')
  const out = [
    `# GÉNÉRÉ par iphone/fusion/porter-workflows.mjs depuis spreadzenox/HealthTrack-iOS@${sha.slice(0, 7)} (.github/workflows/${name}).`,
    '# Jusqu’à la bascule, ne pas modifier ce fichier : il est réécrit à chaque import (iphone/fusion/importer.sh).',
  ]
  let guarded = false
  let jobsSeen = false
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    const paths = line.match(/^(\s+)(paths|paths-ignore): (\[.*\])\s*$/)
    if (paths) {
      out.push(`${paths[1]}paths: ${JSON.stringify(portPaths(paths[2], JSON.parse(paths[3]), target)).replaceAll('","', '", "')}`)
      continue
    }
    if (/^\s+paths(-ignore)?:/.test(line)) fail('filtre de chemins sur plusieurs lignes')

    if (line === 'jobs:') {
      jobsSeen = true
      out.push('defaults:', '  run:', `    working-directory: ${DIR}`, '', line)
      if (source.includes('environment: appstore')) {
        out.push(GUARD_JOB.replace(/\n$/, ''))
        guarded = true
      }
      continue
    }

    // Job de l'environnement appstore : derrière la garde (remplace « if: github.ref == 'refs/heads/main' »)
    if (/^ {4}if: github\.ref == 'refs\/heads\/main'\s*$/.test(line)) continue
    if (/^ {4}if:/.test(line) && jobUsesAppstore(lines, i)) fail('condition de job inattendue devant l’environnement appstore')
    if (/^ {4}runs-on:/.test(line) && jobUsesAppstore(lines, i)) {
      out.push('    needs: garde', "    if: needs.garde.outputs.publication == 'oui'")
    }

    // Checkout du dépôt (pas ceux d'une autre branche, qui ont un nom et un « ref ») : historique sans contenus
    const checkout = line.match(/^(\s+)- uses: actions\/checkout@v4\s*$/)
    if (checkout) {
      const pad = checkout[1]
      if (/^\s+with:\s*$/.test(lines[i + 1] ?? '')) {
        // Seule forme connue : « with: » puis « fetch-depth: 0 », rien d'autre
        if (!/^\s+fetch-depth: 0\b/.test(lines[i + 2] ?? '') || new RegExp(`^${pad}    \\S`).test(lines[i + 3] ?? '')) fail('options de checkout inattendues')
        i += 2
      }
      out.push(
        line,
        `${pad}  with:`,
        `${pad}    fetch-depth: 0 # numéros de version = nombres de commits ; code suivi lu à son commit (scripts/upstream.sh)`,
        `${pad}    filter: blob:none`,
      )
      continue
    }

    line = line
      .replace(/^(\s+working-directory: )(?!iphone)/, `$1${DIR}/`)
      .replace(/^(\s+path: )(captures-\S+)\s*$/, `$1${DIR}/$2`)
      .replace(/^(\s+)captures\/\s*$/, `$1${DIR}/captures/`)
      .replaceAll("hashFiles('", `hashFiles('${DIR}/`)
      .replaceAll('$GITHUB_WORKSPACE/captures', `$GITHUB_WORKSPACE/${DIR}/captures`)
    out.push(line)
  }
  if (!jobsSeen) fail('ligne « jobs: » introuvable')
  const text = out.join('\n') + '\n'
  if (source.includes('secrets.ASC_') && !guarded) fail('secrets App Store Connect hors de l’environnement appstore')
  if (guarded) {
    const jobs = text.split(/\n(?= {2}[\w-]+:\n)/).filter((b) => b.includes('environment: appstore'))
    for (const job of jobs) if (!job.includes('needs: garde')) fail('job appstore sans garde')
  }
  return { target, text }
}

/** La ligne i appartient-elle à l'en-tête d'un job (avant « steps: ») qui déclare l'environnement appstore ? */
function jobUsesAppstore(lines, i) {
  let start = i
  while (start > 0 && !/^ {2}[\w-]+:\s*$/.test(lines[start])) start--
  for (let j = start + 1; j < lines.length && !/^ {2}[\w-]+:\s*$/.test(lines[j]); j++) {
    if (/^ {4}steps:/.test(lines[j])) break
    if (/^ {4}environment: appstore\s*$/.test(lines[j])) return true
  }
  return false
}

if (import.meta.filename === process.argv[1]) {
  const [from, to, sha = 'inconnu'] = process.argv.slice(2)
  if (!from || !to) {
    console.error('usage : porter-workflows.mjs <workflows iOS> <workflows de ce dépôt> <sha>')
    process.exit(2)
  }
  for (const name of readdirSync(from).filter((f) => f.endsWith('.yml')).sort()) {
    if (SKIP.has(name)) continue
    const { target, text } = port(readFileSync(join(from, name), 'utf8'), name, sha)
    writeFileSync(join(to, target), text)
    console.log(`  ${name} → .github/workflows/${target}`)
  }
}
