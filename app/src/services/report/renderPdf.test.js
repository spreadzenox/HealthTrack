// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { buildReport } from './buildReport'
import { FODMAP_ABBR, frDate, renderReportPdf } from './renderPdf'
import { simulateRealistic } from '../gutWindows.sim'

const font = (name) => Uint8Array.from(readFileSync(new URL(`../../assets/fonts/report/${name}`, import.meta.url)))
const fonts = {
  regular: font('figtree-400.ttf'),
  bold: font('figtree-700.ttf'),
  heavy: font('figtree-800.ttf'),
  mono: font('ibm-plex-mono-400.ttf'),
}

const at = (d, h = 12) => new Date(2026, 9, 26 + d, h, 0)
const NOW = at(0, 22)
const gut = (d, level) => ({ type: 'gut', source: 'app_gut', at: at(d, 21).toISOString(), payload: { level, scope: 'day' } })
const meal = (d, ingredient, quantity_g = 40) => ({ type: 'food', source: 'app_food', at: at(d, 12).toISOString(), payload: { items: [{ ingredient, quantity_g }] } })

async function render(report) {
  const texts = []
  const bytes = await renderReportPdf(report, { fonts, onText: (t, page) => texts.push({ t, page }) })
  const doc = await PDFDocument.load(bytes)
  const all = texts.map((x) => x.t).join('\n')
  return { bytes, doc, texts, all, onPage: (n) => texts.filter((x) => x.page === n).map((x) => x.t).join('\n') }
}

describe('renderReportPdf', () => {
  it('journal vide : deux pages lisibles, des états vides explicites, aucun zéro trompeur', async () => {
    const { doc, all, onPage } = await render(buildReport([], { now: NOW }))
    expect(doc.getPageCount()).toBe(2)
    expect(doc.getTitle()).toBe('Rapport pour mon médecin — Halcya')
    expect(onPage(1)).toMatch(/En bref/)
    expect(onPage(2)).toMatch(/Détail/)
    expect(all).toMatch(/Aucune note du ventre sur la période\./)
    expect(all).toMatch(/Aucun test de réintroduction fait\./)
    expect(all).toMatch(/Aucune nuit mesurée sur la période\./)
    expect(all.replace(/\n/g, ' ')).toMatch(/Journal tenu par la personne elle-même/)
    // « Quand consulter » (POL-PLAY-60) : la même phrase fixe que la carte ventre, toujours là, jamais calculée.
    expect(all.replace(/\n/g, ' ')).toMatch(/Sang dans les selles.*votre médecin\./)
    expect(all).not.toMatch(/HealthTrack/)
    expect(all).not.toMatch(/Forme des selles/)
    // Pas de tableau de semaines à zéro ni de « 0 comparaisons faites » (POL-PLAY-44).
    expect(all).not.toMatch(/Semaine par semaine/)
    expect(all).not.toMatch(/comparaisons faites/)
  })

  it('peu de jours notés : « pas encore assez », semaines sans note en tirets (POL-PLAY-44)', async () => {
    const entries = [gut(0, 'pain'), gut(-1, 'calm'), gut(-2, 'discomfort')]
    const { onPage, texts } = await render(buildReport(entries, { now: NOW }))
    const p1 = onPage(1)
    expect(p1).toMatch(/Pas encore assez de notes du ventre \(3\/\d+ jours\)/)
    expect(p1).not.toMatch(/Aucun lien n’a passé/)
    expect(p1).not.toMatch(/comparaisons faites/)
    // La première semaine (sans note) : « 0 » jours notés, puis des tirets, jamais « 0 calme ».
    const i = texts.findIndex((x) => x.t === 'Douleur')
    expect(texts.slice(i + 2, i + 6).map((x) => x.t)).toEqual(['0', '–', '–', '–'])
  })

  it('FODMAP par sous-groupe : abréviation dans le calendrier, ligne du tableau, repère présenté comme une hypothèse', async () => {
    const entries = [meal(0, 'Oignon jaune, cru'), meal(-1, 'Oignon jaune, cru'), gut(0, 'pain'), gut(-1, 'calm'), gut(-2, 'discomfort')]
    const { onPage } = await render(buildReport(entries, { now: NOW }))
    const p2 = onPage(2)
    expect(p2.split('\n').filter((t) => t === FODMAP_ABBR.fructans)).toHaveLength(2)
    expect(p2).toMatch(/FODMAP par sous-groupe/)
    expect(p2).toMatch(/^Fructanes$/m)
    expect(p2).toMatch(/hypothèse de départ/)
    expect(p2).toMatch(/Ciqual \(Anses, CC BY 4\.0\)/)
    expect(p2).toMatch(/pas une analyse/)
    expect(onPage(1)).toMatch(/Douleur 1 j \(33 %\)/)
  })

  it('pistes, réintroduction et 12 semaines de journal réaliste : toujours deux pages, moins de 300 Ko', async () => {
    let report = null
    for (let seed = 1; seed <= 8 && !report; seed++) {
      const entries = simulateRealistic({ seed: seed * 31, days: 90, timedNotes: false, dayNotes: true, dayEffect: { food: 'oignon', day: 0, odds: 8 } })
      const last = new Date(Math.max(...entries.map((e) => Date.parse(e.at))))
      // Forme des selles (I176) notée un jour sur deux : la section tient sans faire déborder la page 2.
      const stools = Array.from({ length: 45 }, (_, i) => ({ type: 'stool', source: 'app_stool', at: new Date(last.getTime() - i * 2 * 86_400_000).toISOString(), payload: { form: ['hard', 'normal', 'loose'][i % 3] } }))
      const r = buildReport([...entries, ...stools], { now: last, weeks: 12, appVersion: 'v305' })
      if (r.links.items.length) report = r
    }
    expect(report).not.toBeNull()
    const { bytes, doc, all, onPage } = await render(report)
    expect(doc.getPageCount()).toBe(2)
    expect(bytes.length).toBeLessThan(300_000)
    expect(onPage(1)).toMatch(/à confirmer/)
    expect(onPage(1)).toMatch(/comparaisons faites/)
    expect(all).toMatch(/Halcya v305/)
    expect(onPage(2)).toMatch(/Forme des selles/)
    expect(onPage(2)).toMatch(/42 notes sur 42 jours : dures \(Bristol 1–2\) 14 · normales \(3–5\) 14 · liquides \(6–7\) 14\./)
    expect(all).not.toMatch(/HealthTrack|diagnostiqu|traitement|prédi/i)
  })

  it('le bien-être estimé n’apparaît que s’il est dans le modèle', async () => {
    const { all } = await render(buildReport([], { now: NOW }))
    expect(all).not.toMatch(/Bien-être estimé/)
    const { all: withWb } = await render({ ...buildReport([], { now: NOW }), wellbeing: { days: 5, mean: 3.4, scale: 5, note: 'Estimé à partir de l’expression du visage.' } })
    expect(withWb).toMatch(/Bien-être estimé/)
    expect(withWb).toMatch(/3,4 \/ 5 en moyenne sur 5 jours/)
  })

  it('dates en français', () => {
    expect(frDate('2026-10-27')).toBe('27 oct. 2026')
    expect(frDate('2026-02-01', false)).toBe('1 févr.')
  })
})
