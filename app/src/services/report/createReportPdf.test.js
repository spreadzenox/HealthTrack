// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { bytesToBase64, createReportPdf, saveAndShareReport } from './createReportPdf'
import { renderReportPdf } from './renderPdf'

vi.mock('../../storage/localHealthStorage', () => ({ listEntriesForAnalysis: vi.fn(async () => []) }))

const files = vi.hoisted(() => ({ written: [], shared: [], shareFails: false }))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS' },
  Filesystem: {
    writeFile: vi.fn(async (o) => {
      files.written.push(o)
      return { uri: `file:///storage/emulated/0/Documents/${o.path}` }
    }),
  },
}))
vi.mock('@capacitor/share', () => ({
  Share: {
    share: vi.fn(async (o) => {
      if (files.shareFails) throw new Error('Share canceled')
      files.shared.push(o)
    }),
  },
}))

const font = (name) => Uint8Array.from(readFileSync(new URL(`../../assets/fonts/report/${name}`, import.meta.url)))
const fonts = { regular: font('figtree-400.ttf'), bold: font('figtree-700.ttf'), heavy: font('figtree-800.ttf'), mono: font('ibm-plex-mono-400.ttf') }
const NOW = new Date(2026, 9, 27, 9)
const gut = (d, level) => ({ type: 'gut', source: 'app_gut', at: new Date(2026, 9, 27 - d, 21).toISOString(), payload: { level, scope: 'day' } })
const face = (d) => ({ type: 'face_burst', source: 'face', at: new Date(2026, 9, 27 - d, 9).toISOString(), payload: { valence: 0.2, arousal: 0.1, n: 5 } })

describe('createReportPdf', () => {
  it('du journal au PDF : période et bien-être transmis, nom de fichier daté', async () => {
    const entries = [gut(1, 'calm'), gut(2, 'pain'), face(1)]
    const render = vi.fn(async () => new Uint8Array([37, 80, 68, 70]))
    const out = await createReportPdf({ weeks: 12, includeWellbeing: false, now: NOW, read: async () => entries, render })
    expect(out.fileName).toBe('Halcya-rapport-2026-10-27.pdf')
    expect(out.report.period.weeks).toBe(12)
    expect(out.report.wellbeing ?? null).toBeNull()
    expect(render).toHaveBeenCalledWith(out.report)
  })

  it('vrai rendu : un PDF de 2 pages lisible, même sur un journal vide', async () => {
    const render = (report) => renderReportPdf(report, { fonts })
    const { bytes } = await createReportPdf({ now: NOW, read: async () => [], render })
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2)
  })
})

describe('bytesToBase64', () => {
  it('identique à Buffer, y compris au-delà d’une tranche de 32 Ko', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => (i * 7) % 256)
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'))
  })
})

describe('saveAndShareReport (Android)', () => {
  const pdf = { bytes: new Uint8Array([1, 2, 3]), fileName: 'Halcya-rapport-2026-10-27.pdf' }

  it('range le fichier dans Documents puis ouvre le partage avec ce fichier', async () => {
    files.written.length = 0
    files.shared.length = 0
    files.shareFails = false
    const r = await saveAndShareReport(pdf, { native: async () => true })
    expect(r).toEqual({ saved: 'documents', shared: true })
    expect(files.written[0]).toMatchObject({ path: pdf.fileName, directory: 'DOCUMENTS', data: 'AQID' })
    expect(files.shared[0].files).toEqual([`file:///storage/emulated/0/Documents/${pdf.fileName}`])
  })

  it('partage annulé : le fichier reste dans Documents, pas d’erreur', async () => {
    files.shareFails = true
    const r = await saveAndShareReport(pdf, { native: async () => true })
    expect(r).toEqual({ saved: 'documents', shared: false })
  })
})
