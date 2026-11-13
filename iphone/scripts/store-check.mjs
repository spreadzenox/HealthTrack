// Fiche App Store fr-FR (store/app-store/fr-FR) : limites d'App Store Connect et règle 2.3.10 des directives d'Apple
// (pas de nom d'une autre plateforme mobile dans la fiche). Lancé par .github/workflows/store-check.yml ; sort en
// erreur à la première règle non tenue.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(import.meta.dirname, '..', 'store', 'app-store', 'fr-FR')
const LIMITS = { 'name.txt': 30, 'subtitle.txt': 30, 'promotional-text.txt': 170, 'description.txt': 4000, 'keywords.txt': 100 }
const FORBIDDEN = [/android/i, /google/i, /\bplay\b/i, /health connect/i, /huawei/i, /galaxy/i]
// Caractères refusés par App Store Connect (« Description can't contain the following character(s): ★ », 31/10)
const REFUSED_CHARS = /[★☆]/u

const read = (name) => readFileSync(join(DIR, name), 'utf8').replace(/\n+$/, '')
const length = (text) => [...text].length
const problems = []

for (const [name, max] of Object.entries(LIMITS)) {
  const text = read(name)
  if (!text.trim()) problems.push(`${name} : vide`)
  if (length(text) > max) problems.push(`${name} : ${length(text)} caractères pour ${max} au plus`)
  for (const word of FORBIDDEN) if (word.test(text)) problems.push(`${name} : « ${text.match(word)[0]} » (directive 2.3.10)`)
  if (REFUSED_CHARS.test(text)) problems.push(`${name} : caractère « ${text.match(REFUSED_CHARS)[0]} » refusé par App Store Connect`)
}
const keywords = read('keywords.txt').split(',')
if (keywords.some((k) => k !== k.trim() || !k)) problems.push('keywords.txt : mots-clés séparés par une virgule, sans espace autour ni vide')
const shown = `${read('name.txt')} ${read('subtitle.txt')}`.toLowerCase()
for (const k of keywords) if (shown.includes(k.toLowerCase())) problems.push(`keywords.txt : « ${k} » est déjà dans le nom ou le sous-titre`)

for (const name of Object.keys(LIMITS)) console.log(`${name} : ${length(read(name))}/${LIMITS[name]}`)
if (problems.length) {
  for (const p of problems) console.log(`::error::${p}`)
  process.exit(1)
}
console.log('Fiche App Store fr-FR : limites tenues.')
