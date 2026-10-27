import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { extractKeys } from './extract.js'
import { CONVERTED_FILES } from './converted.js'
import en from './en.json'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('extraction des phrases', () => {
  it('trouve t(), t.plural() et signale les appels non vérifiables', () => {
    const code = [
      "const a = t('Plutôt une bonne journée')",
      'const b = t(`{n} jours notés`, { n })',
      "const c = t.plural(n, { one: '{n} repas noté', other: '{n} repas notés' })",
      'const d = t(phrase)',
      'const e = <p>{t("Dans le JSX")}</p>',
      "const f = format('pas t')",
    ].join('\n')
    expect(extractKeys(code)).toEqual({
      keys: ['Plutôt une bonne journée', '{n} jours notés', '{n} repas noté', '{n} repas notés', 'Dans le JSX'],
      dynamic: [4],
    })
  })
})

describe('catalogue anglais', () => {
  const used = new Set()
  const problems = []
  for (const rel of CONVERTED_FILES) {
    const { keys, dynamic } = extractKeys(readFileSync(join(SRC, rel), 'utf8'))
    keys.forEach((k) => used.add(k))
    dynamic.forEach((line) => problems.push(`${rel}:${line} : t() avec une phrase non littérale`))
  }

  it('chaque phrase des fichiers convertis est écrite en toutes lettres et traduite', () => {
    for (const k of used) if (!en[k]) problems.push(`sans traduction : « ${k} »`)
    expect(problems).toEqual([])
  })

  it('aucune phrase orpheline ni traduction vide, mêmes {variables} des deux côtés', () => {
    const bad = []
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
    for (const [fr, text] of Object.entries(en)) {
      if (!used.has(fr)) bad.push(`orpheline : « ${fr} »`)
      if (typeof text !== 'string' || !text.trim()) bad.push(`vide : « ${fr} »`)
      else if (vars(fr) !== vars(text)) bad.push(`variables différentes : « ${fr} »`)
    }
    expect(bad).toEqual([])
  })
})
