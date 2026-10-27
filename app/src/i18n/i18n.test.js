import { afterEach, describe, expect, it } from 'vitest'
import { t } from './index.js'
import { __setLangForTests, appLocale, decimalMark, resolveLang, getLang, setLangChoice, getLangChoice, LANG_STORAGE_KEY } from './locale.js'
import en from './en.json'

afterEach(() => __setLangForTests('fr'))

describe('resolveLang', () => {
  it('reste en français tant que l’interrupteur VITE_I18N_EN est coupé', () => {
    expect(resolveLang({ enabled: false, choice: 'en', systemLanguages: ['en-US'] })).toBe('fr')
  })
  it('suit le choix enregistré, sinon la langue du téléphone (français seulement si elle est française)', () => {
    expect(resolveLang({ enabled: true, choice: 'en', systemLanguages: ['fr-FR'] })).toBe('en')
    expect(resolveLang({ enabled: true, choice: 'fr', systemLanguages: ['en-US'] })).toBe('fr')
    expect(resolveLang({ enabled: true, choice: 'auto', systemLanguages: ['fr-BE', 'en'] })).toBe('fr')
    expect(resolveLang({ enabled: true, choice: 'auto', systemLanguages: ['de-DE'] })).toBe('en')
    expect(resolveLang({ enabled: true, choice: null, systemLanguages: [] })).toBe('fr')
  })
})

describe('langue par défaut', () => {
  it('l’app (et donc chaque test) est en français, même si jsdom annonce un navigateur anglais', () => {
    expect(getLang()).toBe('fr')
    expect(appLocale()).toBe('fr-FR')
  })
  it('le choix est enregistré, mais sans interrupteur il ne change rien', () => {
    expect(setLangChoice('en')).toBe('fr')
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en')
    expect(getLangChoice()).toBe('en')
    setLangChoice('bidon')
    expect(getLangChoice()).toBe('auto')
    localStorage.removeItem(LANG_STORAGE_KEY)
  })
})

describe('formats', () => {
  it('virgule décimale en français, point en anglais', () => {
    expect((3.4).toFixed(1).replace('.', decimalMark())).toBe('3,4')
    __setLangForTests('en')
    expect((3.4).toFixed(1).replace('.', decimalMark())).toBe('3.4')
    expect(appLocale()).toBe('en-GB')
    expect((1234.5).toLocaleString(appLocale())).toBe('1,234.5')
  })
})

describe('t()', () => {
  it('rend la phrase française en français, avec ses valeurs', () => {
    expect(t('Plutôt une bonne journée')).toBe('Plutôt une bonne journée')
    expect(t('{n} jours notés', { n: 12 })).toBe('12 jours notés')
    expect(t('{n} jours', {})).toBe('{n} jours')
  })
  it('retombe sur le français quand une phrase manque au catalogue anglais (jamais une clé brute ni un vide)', () => {
    __setLangForTests('en')
    expect(t('Phrase absente du catalogue {x}', { x: 1 })).toBe('Phrase absente du catalogue 1')
  })
  it('traduit depuis le catalogue quand la phrase y est', () => {
    en['Bonjour {nom}'] = 'Hello {nom}'
    try {
      __setLangForTests('en')
      expect(t('Bonjour {nom}', { nom: 'Ana' })).toBe('Hello Ana')
    } finally {
      delete en['Bonjour {nom}']
    }
  })
  it('pluriels : 0 est singulier en français, pluriel en anglais', () => {
    const forms = { one: '{n} repas noté', other: '{n} repas notés' }
    expect(t.plural(0, forms)).toBe('0 repas noté')
    expect(t.plural(2, forms)).toBe('2 repas notés')
    en['{n} repas noté'] = '{n} meal logged'
    en['{n} repas notés'] = '{n} meals logged'
    try {
      __setLangForTests('en')
      expect(t.plural(0, forms)).toBe('0 meals logged')
      expect(t.plural(1, forms)).toBe('1 meal logged')
      expect(t.plural(1234, forms, { n: '1,234' })).toBe('1,234 meals logged')
    } finally {
      delete en['{n} repas noté']
      delete en['{n} repas notés']
    }
  })
})
