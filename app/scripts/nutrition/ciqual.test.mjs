import { describe, it, expect } from 'vitest'
import { buildTable, decodeXml, parseRecords, parseTeneur, CIQUAL_ATTRIBUTION } from './ciqual.mjs'
import { auditTable } from './audit.mjs'

// Trames synthétiques au format XML Ciqual (valeurs inventées pour le test, pas des données Ciqual)
const CONSTS = [
  [328, 'Energie, Règlement UE N° 1169/2011 (kcal/100 g)'],
  [25000, 'Protéines, N x facteur de Jones (g/100 g)'],
  [31000, 'Glucides (g/100 g)'],
  [40000, 'Lipides (g/100 g)'],
  [32000, 'Sucres (g/100 g)'],
  [34100, 'Fibres alimentaires (g/100 g)'],
  [40302, 'AG saturés (g/100 g)'],
  [60000, 'Alcool (g/100 g)'],
  [32210, 'Fructose (g/100 g)'],
  [32250, 'Glucose (g/100 g)'],
  [32410, 'Lactose (g/100 g)'],
  [32530, 'Saccharose (g/100 g)'],
  [34000, 'Polyols totaux (g/100 g)'],
  [35100, 'Vitamine C (mg/100 g)'],
  [52100, 'Vitamine D (µg/100 g)'],
  [56700, 'Vitamine B12 (µg/100 g)'],
  [56600, 'Vitamine B9 ou Folates totaux (µg/100 g)'],
  [53100, 'Vitamine E (mg/100 g)'],
  [10200, 'Calcium (mg/100 g)'],
  [10260, 'Fer (mg/100 g)'],
  [10120, 'Magnésium (mg/100 g)'],
  [10300, 'Zinc (mg/100 g)'],
  [10190, 'Potassium (mg/100 g)'],
  [10110, 'Sodium (mg/100 g)'],
  [51200, 'Rétinol (µg/100 g)'],
  [51330, 'Beta-Carotène (µg/100 g)'],
  [41833, 'AG 18:3 c9,c12,c15 (n-3), alpha-linolénique (g/100 g)'],
  [42053, 'AG 20:5 5c,8c,11c,14c,17c (n-3), EPA (g/100 g)'],
  [42263, 'AG 22:6 4c,7c,10c,13c,16c,19c (n-3), DHA (g/100 g)'],
]
const constXml = `<?xml version="1.0" encoding="UTF-8"?><TABLE>${CONSTS.map(([c, n]) =>
  `<CONST><const_code> ${c} </const_code><const_nom_fr> ${n.replace('&', '&amp;')} </const_nom_fr></CONST>`).join('')}</TABLE>`
const alimXml = `<?xml version="1.0" encoding="UTF-8"?><TABLE>
<ALIM><alim_code> 1 </alim_code><alim_nom_fr> Aliment A, cru </alim_nom_fr></ALIM>
<ALIM><alim_code> 2 </alim_code><alim_nom_fr> Aliment A,  cuit </alim_nom_fr></ALIM>
<ALIM><alim_code> 3 </alim_code><alim_nom_fr> Pain &amp; beurre </alim_nom_fr></ALIM></TABLE>`
const compo = (alim, c, t) => `<COMPO><alim_code> ${alim} </alim_code><const_code> ${c} </const_code><teneur> ${t} </teneur><min missing=" " /></COMPO>`
const compoXml = `<TABLE>${[
  compo(1, 328, '40'), compo(1, 25000, '1,5'), compo(1, 31000, '7'), compo(1, 40000, '0,2'), compo(1, 32000, '5,1'),
  compo(1, 34100, '1,8'), compo(1, 40302, 'traces'), compo(1, 10110, '< 0,5'), compo(1, 10190, '150'),
  compo(1, 51200, '0'), compo(1, 51330, '12'), compo(1, 41833, '0,05'), compo(1, 32210, '-'),
  compo(2, 328, '30'), compo(2, 10190, '120'),
].join('')}</TABLE>`

const raw = () => ({
  alims: parseRecords(alimXml, 'ALIM'),
  compos: parseRecords(compoXml, 'COMPO'),
  consts: parseRecords(constXml, 'CONST'),
})

describe('parseTeneur', () => {
  it('lit les nombres à virgule', () => expect(parseTeneur(' 12,5 ')).toEqual({ value: 12.5, q: null }))
  it('« - » et vide sont inconnus, jamais 0', () => {
    expect(parseTeneur('-')).toEqual({ value: null, q: null })
    expect(parseTeneur('')).toEqual({ value: null, q: null })
    expect(parseTeneur(undefined)).toEqual({ value: null, q: null })
  })
  it('« traces » vaut 0 et reste marqué', () => expect(parseTeneur('traces')).toEqual({ value: 0, q: 'traces' }))
  it('« < x » vaut x / 2 et garde la limite', () => expect(parseTeneur('< 0,5')).toEqual({ value: 0.25, q: '<0.5' }))
})

describe('decodeXml', () => {
  it("respecte l'encodage windows-1252 annoncé (Ciqual 2020)", () => {
    const bytes = Uint8Array.from([...'<?xml version="1.0" encoding="windows-1252"?><a>'].map((c) => c.charCodeAt(0)).concat([0xe9, 0xb5]))
    expect(decodeXml(bytes).endsWith('<a>éµ')).toBe(true)
  })
})

describe('buildTable', () => {
  const { table, meta } = buildTable(raw(), { version: 'Ciqual TEST', keep: { 'Aliment A, cru': { fodmap_score: 2, sodium_mg: 4 }, 'Disparu': {} }, keepFields: ['fodmap_score'] })

  it('trouve tous les constituants attendus', () => expect(meta.missingConstituents).toEqual([]))
  it('garde le code Ciqual et normalise les noms', () => {
    expect(table['Aliment A, cru'].ciqual_code).toBe('1')
    expect(table['Aliment A, cuit'].ciqual_code).toBe('2')
    expect(table['Pain & beurre']).toBeDefined()
  })
  it('reprend les valeurs de Ciqual, inconnu = null', () => {
    const a = table['Aliment A, cru']
    expect(a.energy_kcal).toBe(40)
    expect(a.protein_g).toBe(1.5)
    expect(a.potassium_mg).toBe(150)
    expect(a.fructose_g).toBeNull()
    expect(a.vitamin_c_mg).toBeNull()
    expect(table['Aliment A, cuit'].protein_g).toBeNull()
  })
  it('marque traces et « < x »', () => {
    const a = table['Aliment A, cru']
    expect(a.saturated_fat_g).toBe(0)
    expect(a.sodium_mg).toBe(0.25)
    expect(a._q).toMatchObject({ saturated_fat_g: 'traces', sodium_mg: '<0.5' })
  })
  it('calcule vitamine A et oméga-3 sans rien deviner', () => {
    const a = table['Aliment A, cru']
    expect(a.vitamin_a_ug).toBe(2) // 0 + 12 / 6
    expect(a.omega3_g).toBe(0.05)
    expect(a._q.omega3_g).toBe('partiel')
    expect(table['Aliment A, cuit'].vitamin_a_ug).toBeNull()
    expect(table['Aliment A, cuit'].omega3_g).toBeNull()
  })
  it("ne recopie de l'ancienne table que les champs demandés", () => {
    expect(table['Aliment A, cru'].fodmap_score).toBe(2)
    expect(table['Aliment A, cru'].sodium_mg).toBe(0.25)
    expect(meta.missingFromCiqual).toEqual(['Disparu'])
  })
  it("porte l'attribution de la Licence Ouverte", () => {
    expect(meta.attribution).toBe(CIQUAL_ATTRIBUTION('Ciqual TEST'))
    expect(meta.attribution).toMatch(/Anses.*Licence Ouverte/)
  })
  it('signale un constituant manquant (format changé)', () => {
    const r = raw()
    r.consts = r.consts.filter((c) => !/Sodium/.test(c.const_nom_fr))
    expect(buildTable(r, { version: 'x' }).meta.missingConstituents).toEqual(['sodium_mg'])
  })
  it("passe l'audit de cohérence", () => {
    const s = auditTable(table).summary
    expect(s.energy).toBe(0)
    expect(s.dryCooked).toBe(0)
  })
})

describe('format Ciqual 2025', () => {
  // 2025 : « Alcool (éthanol) », vitamine A publiée en équivalents rétinol, vitamine E parfois en alpha-tocophérol
  const r2025 = () => {
    const r = raw()
    const rename = { 'Alcool (g/100 g)': 'Alcool (éthanol) (g/100 g)' }
    r.consts = r.consts.map((c) => ({ ...c, const_nom_fr: rename[c.const_nom_fr] || c.const_nom_fr }))
    r.consts.push({ const_code: '51100', const_nom_fr: 'Activité vitaminique A, équivalents rétinol (µg/100 g)' })
    r.consts.push({ const_code: '71010', const_nom_fr: 'Alpha-tocophérol (vitamine E) (mg/100 g)' })
    r.compos.push({ alim_code: '1', const_code: '51100', teneur: '7' })
    r.compos.push({ alim_code: '1', const_code: '71010', teneur: '0,8' })
    r.compos.push({ alim_code: '2', const_code: '53100', teneur: '0,3' })
    return r
  }
  const { table, meta } = buildTable(r2025(), {
    version: 'Ciqual 2025',
    license: 'CC BY 4.0',
    source: 'doi:10.5281/zenodo.17550133',
    keep: { 'Aliment A': { fodmap_score: 1 }, 'Aliment A, cru': { fodmap_score: 2 } },
    keepFields: ['fodmap_score'],
    aliases: { 'Aliment A': 'Aliment A, cru', Fantôme: 'Introuvable, cru' },
  })

  it("reconnaît « Alcool (éthanol) » et n'exige pas les constituants propres à 2025", () => {
    expect(meta.missingConstituents).toEqual([])
    expect(buildTable(raw(), { version: '2020' }).meta.missingConstituents).toEqual([])
  })
  it('préfère la vitamine A publiée en équivalents rétinol', () => expect(table['Aliment A, cru'].vitamin_a_ug).toBe(7))
  it('prend l’alpha-tocophérol quand « Vitamine E » manque, et le marque', () => {
    expect(table['Aliment A, cru'].vitamin_e_mg).toBe(0.8)
    expect(table['Aliment A, cru']._q.vitamin_e_mg).toBe('alpha-tocophérol')
    expect(table['Aliment A, cuit'].vitamin_e_mg).toBe(0.3)
    expect(table['Aliment A, cuit']._q?.vitamin_e_mg).toBeUndefined()
  })
  it('un alias copie les valeurs de son aliment Ciqual et garde son propre score', () => {
    const a = table['Aliment A']
    expect(a.alias_of).toBe('Aliment A, cru')
    expect(a.potassium_mg).toBe(150)
    expect(a.fodmap_score).toBe(1)
    expect(meta.missingFromCiqual).toEqual([])
    expect(meta.missingAliasTargets).toEqual(['Introuvable, cru'])
  })
  it('les alias ne comptent pas comme aliments distincts dans l’audit', () => {
    expect(auditTable(table).foods).toBe(3)
  })
  it("énergie non publiée : recalculée depuis les macros connues, sinon inconnue", () => {
    const r = r2025()
    r.compos = r.compos.filter((c) => !(String(c.const_code) === '328'))
    const t = buildTable(r, { version: 'x' }).table
    expect(t['Aliment A, cru'].energy_kcal).toBe(Math.round(1.5 * 4 + 7 * 4 + 0.2 * 9 + 1.8 * 2))
    expect(t['Aliment A, cru']._q.energy_kcal).toBe('calculé')
    expect(t['Aliment A, cuit'].energy_kcal).toBeNull()
  })
  it('attribution selon la licence de la source', () => {
    expect(meta.attribution).toBe('Anses. Ciqual 2025. Table de composition nutritionnelle des aliments Ciqual (CC BY 4.0).')
    expect(meta.source).toBe('doi:10.5281/zenodo.17550133')
  })
})
