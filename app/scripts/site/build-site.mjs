/**
 * Site public de Halcya publié par GitHub Pages (.github/workflows/pages.yml) :
 *   /                    courte présentation + lien vers la politique
 *   /confidentialite/    politique de confidentialité (adresse à donner à la Play Console)
 *   /privacypolicy.html  même page (copie de l'asset embarqué dans l'app)
 * Source unique de la politique : app/public/privacypolicy.html (aussi embarquée dans l'APK pour Health Connect).
 *
 * Usage : node scripts/site/build-site.mjs [dossier de sortie, défaut ../_site]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(here, '../..')

export const PRIVACY_PATH = 'confidentialite/'

export function landingHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Halcya — ventre et bien-être</title>
  <style>
    body { font-family: Figtree, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 680px;
           margin: 0 auto; padding: 32px 20px; color: #10231D; background: #FFFFFF; line-height: 1.6; }
    h1 { font-weight: 800; margin-bottom: 4px; }
    a { color: #0B7A5E; }
    .muted { color: #4A5E57; }
  </style>
</head>
<body>
  <h1>Halcya</h1>
  <p class="muted">Ventre et bien-être</p>
  <p>Comprenez ce qui va avec vos bons et mauvais jours : repas, sommeil, montres et bien-être, analysés sur votre
  téléphone. Local par défaut, l'IA seulement si vous le voulez. Une aide pour repérer des tendances, pas un
  diagnostic.</p>
  <p><a href="${PRIVACY_PATH}">Politique de confidentialité</a></p>
</body>
</html>
`
}

export function buildSite(outDir) {
  const policy = readFileSync(join(appDir, 'public/privacypolicy.html'), 'utf8')
  mkdirSync(join(outDir, PRIVACY_PATH), { recursive: true })
  writeFileSync(join(outDir, PRIVACY_PATH, 'index.html'), policy)
  writeFileSync(join(outDir, 'privacypolicy.html'), policy)
  writeFileSync(join(outDir, 'index.html'), landingHtml())
  writeFileSync(join(outDir, '.nojekyll'), '')
  return ['index.html', `${PRIVACY_PATH}index.html`, 'privacypolicy.html']
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = resolve(process.argv[2] ?? join(appDir, '..', '_site'))
  const files = buildSite(out)
  console.log(`Site écrit dans ${out} : ${files.join(', ')}`)
}
