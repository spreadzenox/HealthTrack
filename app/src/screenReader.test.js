import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

// A11Y-3 (04/11) : TalkBack n'annonce comme actionnable qu'un élément qui a un rôle interactif. Un onClick posé sur
// un <div> ou un <span> sans rôle se lit comme du texte : la personne ne sait pas qu'elle peut le toucher. Le contrôle
// « CLIQUABLE MUET » de `npm run visual` couvre les pages rendues ; ce test couvre tout le code, y compris les écrans
// que le banc ne visite pas.
const SRC = join(process.cwd(), 'src/')
const jsxFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return jsxFiles(path)
    return name.endsWith('.jsx') && !name.includes('.test.') ? [path] : []
  })

const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'label', 'summary', 'form', 'details', 'dialog'])

/** Balises HTML (minuscule) qui reçoivent onClick / onKeyDown sans rôle explicite. */
function muteClickables(source) {
  const out = []
  for (const m of source.matchAll(/<([a-z][a-z0-9]*)\b((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)>/gs)) {
    const [, tag, attrs] = m
    if (INTERACTIVE.has(tag) || !/\bon(Click|KeyDown)=/.test(attrs)) continue
    if (/\brole=/.test(attrs)) continue
    out.push(`<${tag}> ligne ${source.slice(0, m.index).split('\n').length}`)
  }
  return out
}

/** Balises <img> sans attribut alt (alt="" pour une image décorative). */
function imagesWithoutAlt(source) {
  return [...source.matchAll(/<img\b((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})*?)\/?>/gs)]
    .filter(([, attrs]) => !/\balt=/.test(attrs))
    .map((m) => `<img> ligne ${source.slice(0, m.index).split('\n').length}`)
}

describe('lecteur d’écran (A11Y-3)', () => {
  it('le détecteur repère un onClick sur un div sans rôle, pas sur un bouton ni un div avec rôle', () => {
    const sample = [
      '<div className="card" onClick={() => setOpen((v) => !v)}>',
      '<button type="button" onClick={go}>OK</button>',
      '<li role="option" tabIndex={0} onClick={pick} onKeyDown={key}>',
      '<span onKeyDown={(e) => { if (e.key === "Enter") go() }}>',
    ].join('\n')
    expect(muteClickables(sample)).toEqual(['<div> ligne 1', '<span> ligne 4'])
    expect(imagesWithoutAlt('<img src={a} />\n<img alt="" src={b} />')).toEqual(['<img> ligne 1'])
  })

  it('aucun élément non interactif ne reçoit onClick sans rôle', () => {
    const offenders = jsxFiles(SRC).flatMap((f) =>
      muteClickables(readFileSync(f, 'utf8')).map((d) => `${f.slice(SRC.length)} ${d}`))
    expect(offenders).toEqual([])
  })

  it('chaque <img> a un attribut alt', () => {
    const offenders = jsxFiles(SRC).flatMap((f) =>
      imagesWithoutAlt(readFileSync(f, 'utf8')).map((d) => `${f.slice(SRC.length)} ${d}`))
    expect(offenders).toEqual([])
  })

  it('les bascules partagées annoncent leur état (aria-expanded)', () => {
    for (const f of ['components/DetailsToggle.jsx', 'components/EntryActionsToggle.jsx']) {
      expect(readFileSync(join(SRC, f), 'utf8')).toMatch(/aria-expanded=\{/)
    }
  })
})
