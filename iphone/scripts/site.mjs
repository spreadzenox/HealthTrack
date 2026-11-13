#!/usr/bin/env node
// Site de l'app iPhone, publié par GitHub Pages (.github/workflows/pages.yml) : les deux adresses exigées par la
// fiche App Store (I9).
//   /confidentialite/  politique de confidentialité (source : overlay/app/public/confidentialite-iphone.html,
//                      la même que celle embarquée dans l'app, sans son lien de retour vers l'app)
//   /conditions/       conditions d'utilisation (source : overlay/app/public/conditions-iphone.html, de même)
//   /assistance/       assistance (source : site/assistance.html), aussi servie à la racine
// Usage : node scripts/site.mjs <dossier de sortie>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = process.argv[2]
if (!out) throw new Error('Usage : node scripts/site.mjs <dossier de sortie>')

const BACK = /\s*<!-- L'iPhone n'a pas de bouton retour[^>]*-->\s*<a class="back" href="\/plus">[^<]*<\/a>/
// Les commentaires HTML sont des notes de dépôt : ils ne sont pas publiés
const strip = (html) => html.replace(/[ \t]*<!--[\s\S]*?-->\n?/g, '')
// Page de l'app, sans son lien de retour vers l'app ; ses liens vers l'autre page de l'app deviennent ceux du site
const fromApp = (file) => {
  const html = readFileSync(join(root, 'overlay/app/public', file), 'utf8')
  if (!BACK.test(html)) throw new Error(`Lien de retour vers l’app introuvable dans ${file}`)
  return strip(html.replace(BACK, '')).replaceAll('href="/confidentialite-iphone.html"', 'href="../confidentialite/"')
}
const online = fromApp('confidentialite-iphone.html')
const terms = fromApp('conditions-iphone.html')
if (!terms.includes('href="../confidentialite/"')) throw new Error('Lien vers la politique de confidentialité introuvable dans conditions-iphone.html')
const support = strip(readFileSync(join(root, 'site/assistance.html'), 'utf8'))

// Directive 2.3.10 d'Apple : aucune autre plateforme mobile nommée sur les pages données à la fiche
for (const [name, html] of [['confidentialite', online], ['conditions', terms], ['assistance', support]]) {
  const hit = html.match(/Android|Google Play|Health Connect|href="\/plus"|href="\/[a-z-]+\.html"/)
  if (hit) throw new Error(`${name} : « ${hit[0]} » ne doit pas être publié`)
}

const atRoot = support.replace('href="../confidentialite/"', 'href="confidentialite/"')
if (atRoot === support) throw new Error('Lien vers la politique de confidentialité introuvable dans assistance.html')
const pages = { 'confidentialite/index.html': online, 'conditions/index.html': terms, 'assistance/index.html': support,
  'index.html': atRoot }
for (const [path, html] of Object.entries(pages)) {
  mkdirSync(dirname(join(out, path)), { recursive: true })
  writeFileSync(join(out, path), html)
}
console.log(`Site écrit dans ${out} : ${Object.keys(pages).join(', ')}`)
