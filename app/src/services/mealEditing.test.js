import { describe, it, expect } from 'vitest'
import {
  matchIngredientName,
  searchIngredients,
  normalizeMealItem,
  itemKcal,
  mealKcal,
  mealUncounted,
  setItemGrams,
  itemsForEditing,
  atToLocalInput,
  localInputToAt,
  isDrink,
  quantityUnit,
  displayQuantity,
} from './mealEditing.js'

describe('matchIngredientName', () => {
  it('garde un nom exact de la base', () => {
    expect(matchIngredientName('Abondance')).toBe('Abondance')
  })
  it('retrouve un nom malgré la casse, les accents et les espaces', () => {
    expect(matchIngredientName('  abricot, denoyaute,   cru ')).toBe('Abricot, dénoyauté, cru')
    expect(matchIngredientName('riz blanc, cuit')).toBe('Riz blanc cuit')
  })
  it('renvoie null pour un nom inconnu ou vide', () => {
    expect(matchIngredientName('Zorglub au caramel')).toBeNull()
    expect(matchIngredientName('')).toBeNull()
    expect(matchIngredientName(null)).toBeNull()
  })
})

describe('searchIngredients', () => {
  it('trouve les ingrédients contenant tous les mots, sans accents', () => {
    const res = searchIngredients('abricot sec', 5)
    expect(res.length).toBeGreaterThan(0)
    expect(res.length).toBeLessThanOrEqual(5)
    for (const name of res) expect(name.toLowerCase()).toContain('abricot')
    expect(res).toContain('Abricot, dénoyauté, sec')
  })
  it('classe en premier les noms qui commencent par la requête, puis les plus courts', () => {
    const res = searchIngredients('abricot', 3)
    expect(res[0].startsWith('Abricot')).toBe(true)
    expect(res[0].length).toBeLessThanOrEqual(res[1].length)
  })
  it('« œuf » (ligature du clavier) trouve les « Oeuf » de la base', () => {
    expect(searchIngredients('œuf dur')).toContain('Oeuf dur')
    expect(matchIngredientName('Œuf poché')).toBe('Oeuf poché')
  })
  it('cherche en début de mot : « ail » ne propose pas « Haché de volaille »', () => {
    const res = searchIngredients('ail', 8)
    expect(res[0]).toMatch(/^Ail\b/)
    expect(res).not.toContain('Haché de volaille')
  })
  it('met les mots entiers avant les débuts de mot : les laits avant « Laitue », le vin avant « Vinaigre »', () => {
    const lait = searchIngredients('lait', 6)
    expect(lait.indexOf('Laitue, crue')).toBe(-1)
    const vin = searchIngredients('vin', 5)
    expect(vin.slice(0, 4).every((n) => /^Vin\b/.test(n))).toBe(true)
  })
  it('garde le milieu de mot en secours quand aucun mot ne commence ainsi', () => {
    expect(searchIngredients('olaill', 3).length).toBeGreaterThan(0)
  })
  it('ne propose qu’une fois un même aliment Ciqual (« Oignon cuit » et « Oignon, cuit »)', () => {
    const res = searchIngredients('oignon', 6)
    expect(res.filter((n) => /^Oignon,? cuit$/.test(n))).toHaveLength(1)
  })
  it('ne renvoie rien pour une requête de moins de 2 caractères', () => {
    expect(searchIngredients('a')).toEqual([])
    expect(searchIngredients('  ')).toEqual([])
  })
})

describe('normalizeMealItem', () => {
  it('corrige le nom, arrondit les grammes et refait le libellé de quantité', () => {
    expect(normalizeMealItem({ ingredient: 'abondance', quantity_g: '42.4', confidence: 'low' })).toEqual({
      ingredient: 'Abondance',
      quantity: '42 g',
      quantity_g: 42,
      confidence: 'low',
    })
  })
  it('signale un ingrédient absent de la base sans le perdre', () => {
    const it0 = normalizeMealItem({ ingredient: 'Zorglub', quantity_g: 30 })
    expect(it0.ingredient).toBe('Zorglub')
    expect(it0.unknown).toBe(true)
  })
  it('accepte une quantité absente', () => {
    const it0 = normalizeMealItem({ ingredient: 'Abondance' })
    expect(it0.quantity).toBe('portion non précisée')
    expect(it0.quantity_g).toBeUndefined()
  })
  it('ignore une confiance inconnue', () => {
    expect(normalizeMealItem({ ingredient: 'Abondance', quantity_g: 10, confidence: 'sure' }).confidence).toBeUndefined()
  })
})

describe('kcal', () => {
  it('calcule les kcal d’un ingrédient à partir des valeurs pour 100 g', () => {
    // Abondance : 393 kcal / 100 g
    expect(itemKcal({ ingredient: 'Abondance', quantity_g: 50 })).toBe(197)
  })
  it('renvoie null si l’ingrédient est inconnu ou sans grammes', () => {
    expect(itemKcal({ ingredient: 'Zorglub', quantity_g: 50 })).toBeNull()
    expect(itemKcal({ ingredient: 'Abondance' })).toBeNull()
  })
  it('additionne les kcal du repas', () => {
    expect(mealKcal([
      { ingredient: 'Abondance', quantity_g: 100 },
      { ingredient: 'Abondance', quantity_g: 50 },
      { ingredient: 'Zorglub', quantity_g: 50 },
    ])).toBe(590)
    expect(mealKcal([])).toBe(0)
  })
  it('arrondit la somme exacte une seule fois, comme Nutrition (POLISH-KCAL-ARRONDI)', () => {
    // 2 × 50 g d'Abondance = 393 kcal exactes ; la somme des arrondis donnerait 197 + 197 = 394
    expect(mealKcal([
      { ingredient: 'Abondance', quantity_g: 50 },
      { ingredient: 'Abondance', quantity_g: 50 },
    ])).toBe(393)
  })
  it('nomme les aliments que le total ne compte pas (hors base ou sans grammes)', () => {
    expect(mealUncounted([
      { ingredient: 'Abondance', quantity_g: 100 },
      { ingredient: 'Zorglub', quantity_g: 50 },
      { ingredient: 'Abondance', quantity: '1 bol' },
    ])).toEqual(['Zorglub', 'Abondance'])
    expect(mealUncounted([{ ingredient: 'Abondance', quantity_g: 100 }])).toEqual([])
    expect(mealUncounted(undefined)).toEqual([])
  })
})

describe('setItemGrams', () => {
  it('met à jour les grammes et le libellé', () => {
    expect(setItemGrams({ ingredient: 'Abondance', quantity: '10 g', quantity_g: 10 }, '125')).toMatchObject({
      quantity_g: 125,
      quantity: '125 g',
    })
  })
  it('borne les grammes entre 0 et 5000 et accepte la virgule', () => {
    expect(setItemGrams({ ingredient: 'Abondance' }, '12,6').quantity_g).toBe(13)
    expect(setItemGrams({ ingredient: 'Abondance' }, '-4').quantity_g).toBe(0)
    expect(setItemGrams({ ingredient: 'Abondance' }, '99999').quantity_g).toBe(5000)
  })
  it('vide la quantité si la saisie est vide', () => {
    const r = setItemGrams({ ingredient: 'Abondance', quantity_g: 10, quantity: '10 g' }, '')
    expect(r.quantity_g).toBeUndefined()
    expect(r.quantity).toBe('portion non précisée')
  })
})

describe('itemsForEditing', () => {
  it('reprend les grammes enregistrés et signale les aliments absents de la base', () => {
    const items = itemsForEditing([
      { ingredient: 'Abondance', quantity: '80 g', quantity_g: 80, confidence: 'low' },
      { ingredient: 'Fromage lunaire', quantity: '20 g', quantity_g: 20 },
    ])
    expect(items[0]).toEqual({ ingredient: 'Abondance', quantity: '80 g', quantity_g: 80, confidence: 'low' })
    expect(items[1]).toMatchObject({ ingredient: 'Fromage lunaire', quantity_g: 20, unknown: true })
  })

  it('retrouve les grammes des anciens repas enregistrés en texte (« 150g », « 200 g »)', () => {
    const items = itemsForEditing([
      { ingredient: 'Abondance', quantity: '150g' },
      { ingredient: 'Abondance', quantity: '200 g' },
      { ingredient: 'Abondance', quantity: '12,5 g' },
    ])
    expect(items.map((it) => it.quantity_g)).toEqual([150, 200, 13])
  })

  it('garde une quantité textuelle non convertible (« 1 bol ») sans inventer de grammes', () => {
    const [item] = itemsForEditing([{ ingredient: 'Abondance', quantity: '1 bol' }])
    expect(item.quantity_g).toBeUndefined()
    expect(item.quantity).toBe('1 bol')
  })

  it('ignore les éléments sans nom et accepte une liste absente', () => {
    expect(itemsForEditing([{ quantity: '10 g' }, null])).toEqual([])
    expect(itemsForEditing(undefined)).toEqual([])
  })
})

describe('heure du repas (champ datetime-local)', () => {
  it('fait l’aller-retour en heure locale', () => {
    const at = new Date(2026, 9, 9, 12, 34).toISOString()
    expect(atToLocalInput(at)).toBe('2026-10-09T12:34')
    expect(localInputToAt('2026-10-09T12:34')).toBe(at)
  })

  it('renvoie une chaîne vide / null pour une valeur invalide', () => {
    expect(atToLocalInput('n’importe quoi')).toBe('')
    expect(localInputToAt('')).toBeNull()
    expect(localInputToAt('abc')).toBeNull()
  })
})

describe('boissons en ml (POLISH-BOISSON-ML)', () => {
  it('reconnaît les boissons prêtes à boire', () => {
    for (const name of [
      'Eau', 'Bière blanche', 'Vin rouge', 'Café', 'Thé vert, infusé, sans sucres ajoutés', 'Jus de pomme, pur jus',
      'Lait demi-écrémé, UHT', 'Cola, sucré', 'Kombucha, préemballé', 'Boisson au soja, nature, non enrichie, préemballée',
      'Lait fermenté ou yaourt à boire, aux fruits, sucré',
      'Boisson préparée à partir de sirop à diluer type menthe, fraise, etc, sucré, dilué dans l\'eau',
    ]) expect(isDrink(name), name).toBe(true)
  })

  it('laisse en grammes poudres, feuilles, sirops à diluer, yaourts et aliments', () => {
    for (const name of [
      'Thé, feuille', 'Café, moulu', 'Café, poudre soluble', 'Lait en poudre, entier', 'Sirop à diluer, sucré',
      'Lait concentré sucré, entier', 'Lait de coco', 'Lait gélifié aromatisé, rayon frais',
      'Lait fermenté type yaourt au bifidus, nature', 'Vin cuisiné (alcool évaporé)', 'Abondance', 'Poulet, rôti',
      'Pâtes alimentaires, cuites', 'Chicorée rouge, crue', 'Vinaigre de vin', 'Gingembre, cru', '',
    ]) expect(isDrink(name), name).toBe(false)
    expect(quantityUnit('Abondance')).toBe('g')
    expect(quantityUnit('Bière blanche')).toBe('ml')
  })

  it('écrit « ml » pour une boisson, la valeur stockée reste quantity_g', () => {
    expect(normalizeMealItem({ ingredient: 'Bière blanche', quantity_g: 250 })).toMatchObject({ quantity_g: 250, quantity: '250 ml' })
    expect(setItemGrams({ ingredient: 'Eau' }, '330')).toMatchObject({ quantity_g: 330, quantity: '330 ml' })
    expect(setItemGrams({ ingredient: 'Abondance' }, '30')).toMatchObject({ quantity: '30 g' })
  })

  it('relit un ancien libellé « 250 ml » ou « 250 g » d’une boisson', () => {
    expect(itemsForEditing([{ ingredient: 'Bière blanche', quantity: '250 ml' }])[0]).toMatchObject({ quantity_g: 250, quantity: '250 ml' })
    expect(itemsForEditing([{ ingredient: 'Bière blanche', quantity: '250 g' }])[0]).toMatchObject({ quantity_g: 250, quantity: '250 ml' })
  })
})

describe('displayQuantity (POLISH-BOISSON-ML)', () => {
  it('lit un ancien « 150 g » de boisson en ml, sans toucher au reste', () => {
    expect(displayQuantity({ ingredient: 'Café', quantity: '150 g', quantity_g: 150 })).toBe('150 ml')
    expect(displayQuantity({ ingredient: 'Abondance', quantity: '50 g' })).toBe('50 g')
    expect(displayQuantity({ ingredient: 'Café', quantity: '1 tasse' })).toBe('1 tasse')
    expect(displayQuantity({ ingredient: 'Café' })).toBeUndefined()
  })
})
