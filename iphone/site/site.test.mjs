// Tests de iphone/scripts/site.mjs (node --test) : les pages de l'iPhone sont construites sous /iphone/ du site de ce dépôt
// (FUSION-4), avec des liens relatifs qui restent dans /iphone/, et le workflow « Site — GitHub Pages » les publie.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = join(dirname(fileURLToPath(import.meta.url)), '../scripts')
const repo = join(here, '../..')

function build() {
  const out = join(mkdtempSync(join(tmpdir(), 'halcya-site-iphone-')), 'iphone')
  execFileSync(process.execPath, [join(here, 'site.mjs'), out], { stdio: 'pipe' })
  return out
}

test('site : les quatre pages, sans autre plateforme mobile nommée', () => {
  const out = build()
  for (const page of ['index.html', 'confidentialite/index.html', 'conditions/index.html', 'assistance/index.html']) {
    assert.ok(existsSync(join(out, page)), page)
    const html = readFileSync(join(out, page), 'utf8')
    assert.doesNotMatch(html, /Android|Google Play|Health Connect/, page)
    assert.doesNotMatch(html, /<!--/, page)
  }
})

test('site : liens relatifs, qui restent sous /iphone/ une fois publiés', () => {
  const out = build()
  const at = (p) => readFileSync(join(out, p), 'utf8')
  assert.match(at('index.html'), /href="confidentialite\/"/)
  assert.match(at('assistance/index.html'), /href="\.\.\/confidentialite\/"/)
  assert.match(at('conditions/index.html'), /href="\.\.\/confidentialite\/"/)
  for (const p of ['index.html', 'assistance/index.html', 'conditions/index.html', 'confidentialite/index.html']) {
    assert.doesNotMatch(at(p), /href="\/(?!\/)/, `${p} : lien absolu vers la racine du site`)
  }
})

test('pages.yml publie le site de l’iPhone sous /iphone/ et se relance quand ses sources changent', () => {
  const wf = readFileSync(join(repo, '.github/workflows/pages.yml'), 'utf8')
  assert.match(wf, /node iphone\/scripts\/site\.mjs _site\/iphone/)
  for (const src of ['app/public/confidentialite-iphone.html', 'app/public/conditions-iphone.html',
    'iphone/site/**', 'iphone/scripts/site.mjs']) {
    assert.ok(wf.includes(`"${src}"`), `déclencheur ${src}`)
  }
})
