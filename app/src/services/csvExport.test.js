import { describe, it, expect } from 'vitest'
import { entriesToCsv, csvFileName, csvContents } from './csvExport'

// Les heures sont lues dans le fuseau du téléphone : on construit les dates en heure locale.
const local = (y, mo, d, h, mi) => new Date(y, mo - 1, d, h, mi).toISOString()
const lines = (csv) => csv.replace(/^\uFEFF/, '').trim().split('\r\n')

describe('entriesToCsv (EXPORT-CSV)', () => {
  it('commence par un BOM UTF-8 et une ligne d’en-tête séparée par des points-virgules', () => {
    const csv = entriesToCsv([])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(lines(csv)[0]).toBe('Date;Heure;Quoi;Type;Source;Aliments')
  })

  it('une ligne par saisie, dans l’ordre chronologique, avec la date et l’heure locales', () => {
    const csv = entriesToCsv([
      { type: 'gut', source: 'app_gut', at: local(2026, 11, 21, 19, 5), payload: { level: 'calme' } },
      { type: 'wellbeing', source: 'app', at: local(2026, 11, 20, 8, 30), payload: { score: 4 } },
    ])
    const rows = lines(csv)
    expect(rows[0]).toBe('Date;Heure;Quoi;Type;Source;Aliments;level;score')
    expect(rows[1]).toBe('2026-11-20;08:30;Bien-être;wellbeing;app;;;4')
    expect(rows[2]).toBe('2026-11-21;19:05;Digestion;gut;app_gut;;calme;')
    expect(rows).toHaveLength(3)
  })

  it('écrit les aliments d’un repas en clair, sans colonne par aliment', () => {
    const csv = entriesToCsv([{
      type: 'food', source: 'app_food', at: local(2026, 11, 21, 20, 15),
      payload: { items: [{ ingredient: 'Riz blanc cuit', quantity: '180 g', quantity_g: 180 }, { ingredient: 'Oignon, cru', quantity_g: 80 }], provider: 'gemini' },
    }])
    const [head, row] = lines(csv)
    expect(head).toBe('Date;Heure;Quoi;Type;Source;Aliments;provider')
    expect(row).toBe('2026-11-21;20:15;Repas;food;app_food;Riz blanc cuit (180 g) + Oignon, cru (80 g);gemini')
  })

  it('aplatit les objets imbriqués, virgule décimale, oui/non pour les booléens', () => {
    const csv = entriesToCsv([{
      type: 'stool', source: 'app_stool', at: local(2026, 11, 21, 8, 40),
      payload: { bristol: 4, estimated: true, estimate: { bristol: 3.5 }, tags: ['urgence', 'mucus'] },
    }])
    const [head, row] = lines(csv)
    expect(head).toBe('Date;Heure;Quoi;Type;Source;Aliments;bristol;estimate.bristol;estimated;tags')
    expect(row).toBe('2026-11-21;08:40;Selles;stool;app_stool;;4;3,5;oui;urgence, mucus')
  })

  it('échappe guillemets, points-virgules et retours à la ligne, et neutralise les formules', () => {
    const csv = entriesToCsv([{
      type: 'note', source: 'app', at: local(2026, 11, 21, 12, 0),
      payload: { text: 'Dit "ouf" ; puis\nrien', other: '=SOMME(A1)' },
    }])
    const body = csv.replace(/^\uFEFF/, '')
    expect(body).toContain('"Dit ""ouf"" ; puis\nrien"')
    expect(body).toContain("'=SOMME(A1)")
  })

  it('laisse de côté le fuseau noté par l’app, les entrées sans date et les longues chaînes (images)', () => {
    const csv = entriesToCsv([
      { type: 'context', source: 'app', at: local(2026, 11, 21, 0, 0), payload: { tz: 'Europe/Paris' } },
      { type: 'gut', source: 'app_gut', at: 'pas une date', payload: { level: 'calme' } },
      { type: 'food', source: 'app_food', at: local(2026, 11, 21, 13, 0), payload: { photo: 'x'.repeat(5000), note: 'midi' } },
    ])
    const rows = lines(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toBe('Date;Heure;Quoi;Type;Source;Aliments;note')
    expect(rows[1]).toBe('2026-11-21;13:00;Repas;food;app_food;;midi')
  })

  it('garde le type technique comme libellé quand il n’a pas de nom français', () => {
    const [, row] = lines(entriesToCsv([{ type: 'blood_glucose', source: 'health_connect', at: local(2026, 11, 21, 7, 0), payload: { mmol: 5.2 } }]))
    expect(row).toBe('2026-11-21;07:00;blood_glucose;blood_glucose;health_connect;;5,2')
  })
})

describe('csvFileName', () => {
  it('« halcya-donnees-AAAA-MM-JJ.csv »', () => {
    expect(csvFileName(new Date(2026, 10, 22, 10, 0))).toBe('halcya-donnees-2026-11-22.csv')
  })
})

describe('POLISH-SIM-163 : ce que contient le CSV', () => {
  const hr = (subtype, value, day) => ({ type: 'heart_rate', source: 'health_connect', at: local(2026, 11, day, 9, 0), payload: { subtype, value } })

  it('nomme chaque mesure cardiaque au lieu de tout appeler « fréquence cardiaque »', () => {
    const rows = lines(entriesToCsv([
      hr('heartRate', 62, 20), hr('restingHeartRate', 55, 20), hr('heartRateVariability', 41, 20),
      hr('heartRateVariabilitySdnn', 48, 20), hr('oxygenSaturation', 97, 20),
    ])).slice(1).map((r) => r.split(';')[2])
    expect(rows).toEqual(['Cœur', 'Cœur au repos', 'Variabilité cardiaque', 'Variabilité cardiaque, app Santé', 'Oxygène du sang'])
  })

  it('compte les lignes, donne la période et chaque sorte de saisie, la plus fréquente d’abord', () => {
    const c = csvContents([
      hr('oxygenSaturation', 97, 21), hr('heartRate', 62, 20), hr('heartRate', 64, 22),
      { type: 'steps', source: 'health_connect', at: local(2026, 11, 19, 23, 0), payload: { count: 8000 } },
      { type: 'context', source: 'app', at: local(2026, 11, 1, 0, 0), payload: { tz: 'Europe/Paris' } },
      { type: 'gut', source: 'app_gut', at: 'pas une date', payload: {} },
    ])
    expect(c.rows).toBe(4)
    expect(c.from).toBe('2026-11-19')
    expect(c.to).toBe('2026-11-22')
    expect(c.kinds).toEqual([{ label: 'Cœur', count: 2 }, { label: 'Oxygène du sang', count: 1 }, { label: 'Pas', count: 1 }])
  })

  it('rien à exporter : zéro ligne, sans période', () => {
    expect(csvContents([])).toEqual({ rows: 0, from: null, to: null, kinds: [] })
  })
})
