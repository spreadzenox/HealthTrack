import { describe, it, expect } from 'vitest'
import {
  SCHEMA, COUVRE_CHEFS, DEFAUT, normaliser, sanitizeFiche, tirer, compter, incompatibilite, changer, decrire,
  libelle, NOMS_CHAMPS, PAL_CHEVEUX, PAL_YEUX, mixHex, couleursBarbe,
} from './traits'

const LEA = {
  cheveux: { longueur: 'mi_longs', texture: 'ondules', coiffure: 'raie_cote', couleur: 'chatain', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'arques' },
  yeux: { couleur: 'noisette', forme: 'amande' },
  lunettes: { type: 'rondes', couleur: 'ecaille' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'legeres', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'puces', piercing_nez: false },
  incertains: ['yeux.couleur'],
}

describe('schéma de la fiche (PILOU-DOUBLE.md § 4)', () => {
  it('reprend exactement les familles et les valeurs imposées au relais', () => {
    expect(Object.keys(SCHEMA)).toEqual(['cheveux', 'sourcils', 'yeux', 'lunettes', 'barbe', 'peau', 'oreilles'])
    expect(SCHEMA.cheveux.couleur).toHaveLength(17)
    expect(SCHEMA.yeux.couleur).toHaveLength(7)
    expect(COUVRE_CHEFS).toContain('foulard')
  })
  it("ne contient aucun champ d'âge, de genre, de peau, d'origine, d'émotion ni de santé", () => {
    const tout = JSON.stringify({ SCHEMA, COUVRE_CHEFS, DEFAUT }).toLowerCase()
    for (const mot of ['age', 'genre', 'sexe', 'gender', 'origine', 'ethni', 'teint', 'emotion', 'humeur', 'sante', 'poids', 'beaute']) {
      expect(tout).not.toMatch(new RegExp(`"${mot}`))
    }
  })
  it('chaque valeur a un libellé et une palette', () => {
    for (const c of SCHEMA.cheveux.couleur) expect(PAL_CHEVEUX[c]).toHaveLength(4)
    for (const c of SCHEMA.yeux.couleur) expect(PAL_YEUX[c]).toHaveLength(4)
    for (const fam of Object.keys(SCHEMA)) for (const k of Object.keys(SCHEMA[fam])) {
      expect(NOMS_CHAMPS[`${fam}.${k}`]).toBeTruthy()
      for (const v of SCHEMA[fam][k]) expect(libelle(v, `${fam}.${k}`)).not.toMatch(/_/)
    }
    for (const c of COUVRE_CHEFS) expect(libelle(c)).not.toMatch(/_/)
  })
})

describe('normaliser', () => {
  it('garde une fiche valide et ajoute version et couvre-chef', () => {
    const { fiche, corrections } = normaliser(LEA)
    expect(corrections).toEqual([])
    expect(fiche.version).toBe(1)
    expect(fiche.couvre_chef).toBe('aucun')
    expect(fiche.cheveux).toEqual(LEA.cheveux)
    expect(fiche.incertains).toEqual(['yeux.couleur'])
  })
  it('retire tout champ hors schéma (âge, genre…)', () => {
    const { fiche } = normaliser({ ...LEA, age: 34, genre: 'f', peau: { ...LEA.peau, teint: 'clair' }, sante: 'x' })
    expect(fiche.age).toBeUndefined()
    expect(fiche.genre).toBeUndefined()
    expect(fiche.sante).toBeUndefined()
    expect(fiche.peau.teint).toBeUndefined()
    expect(JSON.stringify(fiche).length).toBeLessThan(600)
  })
  it('une valeur inconnue prend la valeur par défaut et devient « à vérifier »', () => {
    const { fiche } = normaliser({ ...LEA, yeux: { couleur: 'violet', forme: 'amande' }, incertains: ['inconnu.champ'] })
    expect(fiche.yeux.couleur).toBe(DEFAUT.yeux.couleur)
    expect(fiche.incertains).toEqual(['yeux.couleur'])
  })
  it('le couvre-chef ne vient que de la fiche de l’app (valeur inconnue → aucun)', () => {
    expect(normaliser({ ...LEA, couvre_chef: 'foulard' }).fiche.couvre_chef).toBe('foulard')
    expect(normaliser({ ...LEA, couvre_chef: 'casque' }).fiche.couvre_chef).toBe('aucun')
  })
  it('applique les règles de compatibilité', () => {
    const f = normaliser({ ...LEA, cheveux: { ...LEA.cheveux, longueur: 'courts', coiffure: 'tresses' } }).fiche
    expect(f.cheveux.longueur).toBe('mi_longs')
    const g = normaliser({ ...LEA, lunettes: { type: 'aviateur' } }).fiche
    expect(g.lunettes.couleur).toBe('dore')
    const h = normaliser({ ...LEA, lunettes: { type: 'aucune', couleur: 'noir' } }).fiche
    expect(h.lunettes.couleur).toBeUndefined()
  })
  it('sanitizeFiche : rien de lisible → Pilou d’origine (null)', () => {
    expect(sanitizeFiche(null)).toBeNull()
    expect(sanitizeFiche([])).toBeNull()
    expect(sanitizeFiche({ age: 3 })).toBeNull()
    expect(sanitizeFiche(LEA).yeux.couleur).toBe('noisette')
  })
})

describe('combinaisons et tirage', () => {
  it('compte ≈ 10¹³ combinaisons (7,9 × 10¹², SPEC § 7)', () => {
    const c = compter()
    expect(c.cheveux).toBe(53550)
    expect(c.coherents).toBe(29427)
    expect(c.total).toBe(7863978150000)
  })
  it('« Surprenez-moi » donne des fiches cohérentes, reproductibles et variées', () => {
    const vues = new Set()
    for (let i = 0; i < 200; i++) {
      const f = tirer(i)
      expect(normaliser(f).corrections).toEqual([])
      expect(tirer(i)).toEqual(f)
      vues.add(JSON.stringify(f))
    }
    expect(vues.size).toBeGreaterThan(190)
  })
})

describe('Studio : valeurs incompatibles et changements', () => {
  const lea = normaliser(LEA).fiche
  it('grise les coiffures impossibles avec leur raison', () => {
    const rase = changer(lea, 'cheveux.longueur', 'rases')
    expect(incompatibilite(rase, 'cheveux.coiffure', 'frange')).toMatch(/rasés/)
    expect(incompatibilite(lea, 'cheveux.coiffure', 'frange')).toBeNull()
    expect(incompatibilite(changer(lea, 'cheveux.coiffure', 'tresses'), 'cheveux.longueur', 'courts')).toMatch(/mi-longs/)
  })
  it('toucher une valeur la confirme (elle sort de « À vérifier »)', () => {
    expect(lea.incertains).toEqual(['yeux.couleur'])
    expect(changer(lea, 'yeux.couleur', 'noisette').incertains).toEqual([])
  })
  it('change le couvre-chef à la main', () => {
    expect(changer(lea, 'couvre_chef', 'bonnet').couvre_chef).toBe('bonnet')
  })
})

describe('couleurs et description', () => {
  it('mélange des couleurs', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(couleursBarbe({ cheveux: { couleur: 'noir' }, barbe: { couleur: 'grise' } }).base).toBe('#ADA69E')
  })
  it('décrit des réglages, jamais une personne', () => {
    const d = decrire(normaliser({ ...LEA, couvre_chef: 'bonnet' }).fiche, 'Pilou')
    expect(d).toBe("Pilou : cheveux châtains mi-longs, raie sur le côté, yeux noisette, lunettes rondes, taches de rousseur, boucles d'oreilles, bonnet")
    expect(decrire(null, 'Pilou')).toMatch(/origine/)
  })
})
