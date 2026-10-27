/**
 * Polices du rapport PDF (I175 étape 2) : convertit les WOFF de Fontsource en TTF, que `pdf-lib` + `fontkit`
 * savent découper en sous-ensemble (leur décodeur WOFF2 casse au découpage, et leur décodeur WOFF lit mal les
 * glyphes vides d'IBM Plex Mono). Une conversion WOFF 1.0 → sfnt n'est qu'une décompression zlib des tables :
 * aucun glyphe n'est modifié. Figtree et IBM Plex Mono : SIL OFL 1.1 (licences copiées à côté).
 *
 * Usage : node scripts/fonts/woff-to-ttf.mjs   (depuis app/, après npm ci)
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const OUT = new URL('../../src/assets/fonts/report/', import.meta.url).pathname
const FONTS = {
  'figtree-400.ttf': '@fontsource/figtree/files/figtree-latin-400-normal.woff',
  'figtree-700.ttf': '@fontsource/figtree/files/figtree-latin-700-normal.woff',
  'figtree-800.ttf': '@fontsource/figtree/files/figtree-latin-800-normal.woff',
  'ibm-plex-mono-400.ttf': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff',
}
const LICENSES = { 'OFL-Figtree.txt': '@fontsource/figtree/LICENSE', 'OFL-IBM-Plex-Mono.txt': '@fontsource/ibm-plex-mono/LICENSE' }

export function woffToSfnt(woff) {
  const b = Buffer.from(woff)
  if (b.readUInt32BE(0) !== 0x774f4646) throw new Error('pas un fichier WOFF 1.0')
  const flavor = b.readUInt32BE(4)
  const n = b.readUInt16BE(12)
  const tables = []
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20
    const [tag, offset, compLength, origLength, checksum] = [b.readUInt32BE(o), b.readUInt32BE(o + 4), b.readUInt32BE(o + 8), b.readUInt32BE(o + 12), b.readUInt32BE(o + 16)]
    const raw = b.subarray(offset, offset + compLength)
    const data = compLength < origLength ? inflateSync(raw) : raw
    if (data.length !== origLength) throw new Error('table de taille inattendue')
    tables.push({ tag, checksum, data })
  }
  tables.sort((a, c) => a.tag - c.tag)
  let entrySelector = 0
  while (2 ** (entrySelector + 1) <= n) entrySelector++
  const searchRange = 2 ** entrySelector * 16
  const head = Buffer.alloc(12 + n * 16)
  head.writeUInt32BE(flavor, 0)
  head.writeUInt16BE(n, 4)
  head.writeUInt16BE(searchRange, 6)
  head.writeUInt16BE(entrySelector, 8)
  head.writeUInt16BE(n * 16 - searchRange, 10)
  const parts = [head]
  let offset = head.length
  tables.forEach((t, i) => {
    const o = 12 + i * 16
    head.writeUInt32BE(t.tag, o)
    head.writeUInt32BE(t.checksum, o + 4)
    head.writeUInt32BE(offset, o + 8)
    head.writeUInt32BE(t.data.length, o + 12)
    const pad = (4 - (t.data.length % 4)) % 4
    parts.push(t.data, Buffer.alloc(pad))
    offset += t.data.length + pad
  })
  return Buffer.concat(parts)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [out, spec] of Object.entries(FONTS)) {
    const ttf = woffToSfnt(readFileSync(require.resolve(spec)))
    writeFileSync(join(OUT, out), ttf)
    console.log(out, ttf.length, 'octets')
  }
  for (const [out, spec] of Object.entries(LICENSES)) copyFileSync(join(dirname(require.resolve(`${spec.split('/LICENSE')[0]}/package.json`)), 'LICENSE'), join(OUT, out))
}
