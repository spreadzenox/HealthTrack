/**
 * Vocabulaire des textes visibles (décisions produit du propriétaire du 20/10/2026, journal/PRODUIT.md) :
 * on parle de « bien-être », pas d'« humeur » ; jamais « 100 % privé » (l'analyse IA envoie des données) ;
 * jamais « diagnostiquer », « prédire une crise » ni « traiter ». Les commentaires du code ne comptent pas.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import { FORBIDDEN_WORDING, SLOP_WORDING, stripComments } from './wordingRules.js'

export { stripComments }

const ROOTS = ['src/components', 'src/pages', 'src/services', 'src/hooks', 'src/config']

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return sourceFiles(p)
    return /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : []
  })
}

const FORBIDDEN = FORBIDDEN_WORDING

function offences() {
  const found = []
  for (const root of ROOTS) {
    for (const file of sourceFiles(path.resolve(root))) {
      stripComments(fs.readFileSync(file, 'utf8')).forEach((line, i) => {
        for (const { re, why } of FORBIDDEN) {
          if (re.test(line)) found.push(`${path.relative(path.resolve(), file)}:${i + 1} (${why}) ${line.trim()}`)
        }
      })
    }
  }
  return found
}

describe('vocabulaire des textes visibles', () => {
  it('retire les commentaires mais garde le texte', () => {
    expect(stripComments("a // l'humeur\n/* humeur */ b\n'https://x'").map((l) => l.trim())).toEqual(['a', 'b', "'https://x'"])
  })

  it('aucun « humeur », « 100 % privé » ni terme médical interdit dans le code de l’app', () => {
    expect(offences()).toEqual([])
  })
})

/**
 * SLOP-1 (31/10/2026) : la règle « rien n'est un diagnostic » se dit une fois, là où elle sert, jamais en refrain.
 * Lignes jointes : une phrase JSX peut être coupée en deux.
 */
export function slopOffences(text, rules = SLOP_WORDING) {
  const flat = text.replace(/\s+/g, ' ')
  return rules.filter(({ re }) => re.test(flat)).map(({ why }) => why)
}

describe('formules « slop IA » (SLOP-1)', () => {
  it('repère le refrain, même coupé sur deux lignes', () => {
    expect(slopOffences('Plutôt calme. Une estimation,\n pas un diagnostic.')).not.toEqual([])
    expect(slopOffences('C’est une observation, jamais un diagnostic.')).not.toEqual([])
    expect(slopOffences('Une mesure de la montre, pas un diagnostic.')).not.toEqual([])
    expect(slopOffences('Profitez-en en toute sérénité.')).not.toEqual([])
    expect(slopOffences('On préfère attendre plutôt que de vous montrer de faux\n suspects.')).not.toEqual([])
    expect(slopOffences('Des liens repérés dans vos données, pas des causes.')).not.toEqual([])
    expect(slopOffences('Un module intégré — il n’est pas dans le Play Store.')).not.toEqual([])
    expect(slopOffences('✨ Remplir avec l’IA')).not.toEqual([])
    expect(slopOffences('Elle complète le bien-être estimé, sans jamais le remplacer.')).not.toEqual([])
    expect(slopOffences('Android l’a mise en pause (mise à jour, redémarrage ou économie de batterie).')).not.toEqual([])
    expect(slopOffences('{value ?? \'—\'} bpm')).toEqual([])
    expect(slopOffences('Une corrélation ne prouve pas une cause.')).toEqual([])
    expect(slopOffences('Le résultat est une estimation. Il ne remplace pas l’avis d’un médecin.')).toEqual([])
  })

  it('aucun refrain ni mot creux dans le code de l’app', () => {
    const found = []
    for (const root of ROOTS) {
      for (const file of sourceFiles(path.resolve(root))) {
        const why = slopOffences(stripComments(fs.readFileSync(file, 'utf8')).join('\n'))
        if (why.length) found.push(`${path.relative(path.resolve(), file)} (${why.join(' ; ')})`)
      }
    }
    expect(found).toEqual([])
  })

  // SLOP-1e (01/11/2026) : les notes de « Nouveautés », anciennes comprises, sont lues dans l'app
  it('aucune formule bannie dans les notes de Nouveautés', () => {
    const dir = path.resolve('src/data/changelog')
    const found = []
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      const note = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
      for (const text of [note.title, ...(note.items || [])]) {
        const why = slopOffences(String(text))
        if (why.length) found.push(`${name} : « ${text} » (${why.join(' ; ')})`)
      }
    }
    expect(found).toEqual([])
  })
})

/**
 * SLOP-1c (01/11/2026) : notifications et textes natifs Android (canaux, boutons, messages). Les chaînes Java
 * coupées par « " + " » sont recollées avant d'appliquer les mêmes règles que pour l'app.
 */
export function javaText(code) {
  return stripComments(code).join('\n').replace(/"\s*\+\s*"/g, '')
}

function javaFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return /^(build|test|androidTest)$/.test(d.name) ? [] : javaFiles(p)
    return /\.(java|kt)$/.test(d.name) ? [p] : []
  })
}

describe('notifications et textes natifs Android (SLOP-1c)', () => {
  it('recolle une phrase coupée par une concaténation Java', () => {
    expect(javaText('.bigText("Android a mis la lecture en"\n + " pause (mise à jour, redémarrage ou économie de batterie).")'))
      .toContain('en pause (mise à jour')
    expect(slopOffences(javaText('.setContentText("Une estimation, " + "pas un diagnostic.")'))).not.toEqual([])
  })

  it('aucune formule bannie ni terme interdit dans le code natif', () => {
    const found = []
    for (const file of javaFiles(path.resolve('android/app/src'))) {
      const text = javaText(fs.readFileSync(file, 'utf8'))
      const why = [...slopOffences(text), ...slopOffences(text, FORBIDDEN_WORDING)]
      if (why.length) found.push(`${path.relative(path.resolve(), file)} (${why.join(' ; ')})`)
    }
    expect(found).toEqual([])
  })
})

/**
 * VC-1 : en JSX, un retour à la ligne entre deux morceaux de texte disparaît. « mesures,⏎{APP_NAME} » s'affiche
 * « mesures,Halcya ». Un nom en début (ou fin) de ligne doit donc suivre (ou précéder) une balise, ou `{' '}`.
 */
export function gluedNames(lines) {
  const found = []
  lines.forEach((line, i) => {
    const t = line.trim()
    const prev = (lines[i - 1] || '').trim()
    const next = (lines[i + 1] || '').trim()
    if (t.startsWith('{APP_NAME}') && prev && !/[>}]$/.test(prev)) found.push(i + 1)
    if (t.endsWith('{APP_NAME}') && t !== '{APP_NAME}' && next && !/^[<{]/.test(next)) found.push(i + 1)
  })
  return found
}

describe('nom de l’app dans les textes JSX (VC-1)', () => {
  it('repère un nom collé au mot de la ligne précédente', () => {
    expect(gluedNames(['  après 3 semaines,', '  {APP_NAME} compare'])).toEqual([2])
    expect(gluedNames(['  <p>', '  {APP_NAME} lit'])).toEqual([])
    expect(gluedNames(["  : {APP_NAME}{' '}", '  vous aide'])).toEqual([])
    expect(gluedNames(['  : {APP_NAME}', '  vous aide'])).toEqual([1])
  })

  it('aucun « Halcyavous » ni « mesures,Halcya » dans les composants et les pages', () => {
    const found = []
    for (const root of ['src/components', 'src/pages']) {
      for (const file of sourceFiles(path.resolve(root)).filter((f) => f.endsWith('.jsx'))) {
        const lines = stripComments(fs.readFileSync(file, 'utf8'))
        for (const n of gluedNames(lines)) found.push(`${path.relative(path.resolve(), file)}:${n}`)
      }
    }
    expect(found).toEqual([])
  })
})

/**
 * VC-15 : apostrophe typographique (’) partout dans les textes visibles, comme dans le reste de l’app. On lit les
 * textes JSX et les chaînes avec une espace (phrases) ; au-delà de 300 caractères, ce sont des consignes envoyées
 * au modèle d’IA, jamais affichées.
 */
const STRAIGHT_APOSTROPHE = /[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/

export function straightApostrophes(code) {
  const found = []
  const visit = (n) => {
    if (!n || typeof n.type !== 'string') return
    const text = n.type === 'JSXText' || n.type === 'StringLiteral' ? n.value
      : n.type === 'TemplateElement' ? n.value.cooked || '' : null
    if (text != null && STRAIGHT_APOSTROPHE.test(text) && text.length <= 300 && (n.type === 'JSXText' || /\s/.test(text))) {
      found.push(n.loc.start.line)
    }
    for (const k in n) {
      if (k === 'loc' || k.endsWith('Comments')) continue
      const c = n[k]
      if (Array.isArray(c)) c.forEach(visit)
      else if (c && typeof c.type === 'string') visit(c)
    }
  }
  visit(parse(code, { sourceType: 'module', plugins: ['jsx'] }).program)
  return found
}

describe('apostrophes des textes visibles (VC-15)', () => {
  it('repère une apostrophe droite dans un texte JSX ou une phrase, pas dans le code', () => {
    expect(straightApostrophes("const a = <p>Pour l'instant</p>")).toEqual([1])
    expect(straightApostrophes('const m = "Rien n\'a pu être importé."')).toEqual([1])
    expect(straightApostrophes("const a = <p>Pour l’instant</p>\nconst k = \"d'x\"\n// l'app")).toEqual([])
  })

  it('aucune apostrophe droite dans les textes de l’app', () => {
    const found = []
    for (const root of ROOTS) {
      for (const file of sourceFiles(path.resolve(root))) {
        for (const n of straightApostrophes(fs.readFileSync(file, 'utf8'))) found.push(`${path.relative(path.resolve(), file)}:${n}`)
      }
    }
    expect(found).toEqual([])
  })
})

/**
 * VC-15 : pas d’émojis dans les textes visibles (identité visuelle : icônes trait, voir components/LineIcon).
 * Les symboles typographiques (✓ ✕ ⚠ → ·) restent permis ; les panneaux de débogage (mode développeur) aussi.
 */
const EMOJI = /\p{Emoji_Presentation}|️/u
const DEBUG_ONLY = ['src/components/DebugPanel.jsx']

describe('émojis des textes visibles (VC-15)', () => {
  it('distingue un émoji d’un symbole typographique', () => {
    expect(EMOJI.test('📷 Photo')).toBe(true)
    expect(EMOJI.test('⚠️ Attention')).toBe(true)
    expect(EMOJI.test('✓ Enregistré · ⚠ peu fiable ✕')).toBe(false)
  })

  it('aucun émoji dans les pages et les composants', () => {
    const found = []
    for (const root of ['src/components', 'src/pages']) {
      for (const file of sourceFiles(path.resolve(root))) {
        const rel = path.relative(path.resolve(), file)
        if (DEBUG_ONLY.includes(rel)) continue
        stripComments(fs.readFileSync(file, 'utf8')).forEach((line, i) => {
          if (EMOJI.test(line)) found.push(`${rel}:${i + 1} ${line.trim()}`)
        })
      }
    }
    expect(found).toEqual([])
  })
})

/** VC-20 : l’émoji d’une étiquette d’habitude reste dans les données (behaviorTags.js) mais n’est jamais affiché. */
describe('émojis des étiquettes d’habitudes (VC-20)', () => {
  it('aucune page ni aucun composant n’affiche `.emoji`', () => {
    const found = []
    for (const root of ['src/components', 'src/pages']) {
      for (const file of sourceFiles(path.resolve(root))) {
        const rel = path.relative(path.resolve(), file)
        if (DEBUG_ONLY.includes(rel)) continue
        stripComments(fs.readFileSync(file, 'utf8')).forEach((line, i) => {
          if (/\.emoji\b/.test(line)) found.push(`${rel}:${i + 1} ${line.trim()}`)
        })
      }
    }
    expect(found).toEqual([])
  })
})
