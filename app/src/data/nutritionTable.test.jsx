import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  getNutritionTable,
  loadNutritionTable,
  useNutritionTable,
  _resetNutritionTable,
  fetchTableFile,
} from './nutritionTable'
import { ingredientNames, itemKcal, matchIngredientName, mealKcal } from '../services/mealEditing'
import { computeTotalsFromItems } from '../services/nutritionKPIs'
import SavedMealEditor from '../components/SavedMealEditor'

const FROMAGE = { ingredient: 'Abondance', quantity_g: 100 }

describe('table Ciqual chargée à la demande', () => {
  afterEach(async () => {
    await loadNutritionTable() // les autres tests l'attendent chargée (setup)
  })

  it('pas encore chargée : kcal inconnues, calculs nutritionnels refusés', () => {
    _resetNutritionTable()
    expect(getNutritionTable()).toBeNull()
    expect(itemKcal(FROMAGE)).toBeNull()
    expect(mealKcal([FROMAGE])).toBe(0)
    expect(() => computeTotalsFromItems([FROMAGE])).toThrow(/non chargée/)
    expect(() => matchIngredientName('abondance')).toThrow(/non chargée/)
  })

  it('un seul chargement partagé, puis tout est disponible', async () => {
    _resetNutritionTable()
    const [a, b] = await Promise.all([loadNutritionTable(), loadNutritionTable()])
    expect(a).toBe(b)
    expect(getNutritionTable()).toBe(a)
    expect(itemKcal(FROMAGE)).toBeGreaterThan(0)
    expect(matchIngredientName(' abondance ')).toBe('Abondance')
    expect(computeTotalsFromItems([FROMAGE]).energy_kcal).toBe(itemKcal(FROMAGE))
  })

  it("les noms canoniques sont les clés de la table, dans l'ordre", async () => {
    const table = await loadNutritionTable()
    const names = ingredientNames()
    expect(names).toEqual(Object.keys(table))
    expect(names.length).toBeGreaterThan(3000)
    expect(names[0]).toBe('Abat, cuit (aliment moyen)')
  })

  it('useNutritionTable démarre le chargement et re-rend à son arrivée', async () => {
    _resetNutritionTable()
    function Probe() {
      const table = useNutritionTable()
      return <p>{table ? `prête (${Object.keys(table).length})` : 'en attente'}</p>
    }
    render(<Probe />)
    expect(screen.getByText('en attente')).toBeInTheDocument()
    await act(async () => { await loadNutritionTable() })
    expect(await screen.findByText(/^prête \(\d+\)$/)).toBeInTheDocument()
  })

  it("l'éditeur de repas attend la table avant de rapprocher les ingrédients", async () => {
    _resetNutritionTable()
    const entry = { id: 'm1', at: '2026-10-14T07:00:00.000Z', type: 'food', payload: { items: [{ ingredient: 'abondance', quantity_g: 40 }] } }
    render(<SavedMealEditor entry={entry} onSaved={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByLabelText('Heure du repas')).not.toBeInTheDocument()
    await act(async () => { await loadNutritionTable() })
    expect(await screen.findByLabelText('Heure du repas')).toBeInTheDocument()
    // nom rapproché de la base (pas signalé « absent »), kcal calculées
    expect(screen.getByText(/Abondance/)).toBeInTheDocument()
    expect(screen.getByText(/Total estimé/)).toBeInTheDocument()
  })
})

describe('table Ciqual en fichier partagé (application et worker, une seule copie)', () => {
  it('lit le fichier JSON à son adresse', async () => {
    const calls = []
    const fakeFetch = async (url) => {
      calls.push(url)
      return { ok: true, status: 200, json: async () => ({ Abondance: { energy_kcal: 400 } }) }
    }
    const t = await fetchTableFile('assets/table.json', fakeFetch)
    expect(calls).toEqual(['assets/table.json'])
    expect(t.Abondance.energy_kcal).toBe(400)
  })

  it('refuse une réponse en erreur ou vide (nouvel essai au prochain appel)', async () => {
    const notFound = async () => ({ ok: false, status: 404, json: async () => ({}) })
    await expect(fetchTableFile('x.json', notFound)).rejects.toThrow(/404/)
    const empty = async () => ({ ok: true, status: 200, json: async () => ({}) })
    await expect(fetchTableFile('x.json', empty)).rejects.toThrow(/vide/)
  })
})
