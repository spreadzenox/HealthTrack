import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DigestBlock from './DigestBlock'

const NOW = new Date()
const dayAt = (daysAgo, h = 10) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo, h)
  return d.toISOString()
}
const note = (daysAgo, level = 'calm', h = 10) => ({ type: 'gut', at: dayAt(daysAgo, h), payload: { level } })

const wrap = (props) => render(
  <BrowserRouter><DigestBlock onNote={vi.fn()} summary={null} read={async () => []} {...props} /></BrowserRouter>,
)

describe('readGutNotes (POLISH-SIM-32)', () => {
  it('lit toutes les notes digestives, comme Analyses, pas seulement les 42 derniers jours', async () => {
    await import('fake-indexeddb/auto')
    const { createEntry: addEntry } = await import('../storage/localHealthStorage')
    const { readGutNotes } = await import('../services/gutNotes')
    await addEntry({ type: 'gut', source: 'manual', at: dayAt(60), payload: { level: 'calm' } })
    await addEntry({ type: 'gut', source: 'manual', at: dayAt(2), payload: { level: 'pain' } })
    const notes = await readGutNotes()
    expect(notes.map((n) => n.payload.level).sort()).toEqual(['calm', 'pain'])
  })
})

describe('DigestBlock (AUJ-4)', () => {
  it('avant les analyses : le compte à rebours, ce qu’elles cherchent, N/28 et « Noter ma digestion »', async () => {
    const onNote = vi.fn()
    wrap({ onNote, read: async () => [note(1), note(2), note(3, 'pain')] })
    expect(await screen.findByRole('heading', { name: 'Encore 25 jours notés avant vos analyses digestives' })).toBeInTheDocument()
    expect(screen.getByText(/cherchera quels facteurs sont statistiquement liés à votre confort digestif\./)).toBeInTheDocument()
    expect(screen.getByText('3/28')).toBeInTheDocument()
    // POLISH-SIM-32 : quelle fenêtre ? Aucune : tous les jours notés comptent, d'affilée ou non
    expect(screen.getByText('3/28').parentElement).toHaveTextContent('3/28 jours notés, pas forcément d’affilée')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Noter ma digestion' }))
    expect(onNote).toHaveBeenCalled()
  })

  it('ni délais, ni correction statistique, ni minimum', async () => {
    wrap({ read: async () => [note(1)] })
    await screen.findByRole('heading')
    expect(document.body.textContent).not.toMatch(/Benjamini|délai|minimum|0–4 h/)
  })

  it('les notes du jour sur un petit graphique, rien sans note du jour', async () => {
    const { unmount } = wrap({ read: async () => [note(0, 'calm', 9), note(0, 'discomfort', 14), note(2)] })
    const chart = await screen.findByRole('link', { name: /Vos notes du jour : Calme, Gêne/ })
    // AUJ-9 : il ouvre Journal › Tendances sur le confort digestif
    expect(chart).toHaveAttribute('href', '/tendances?mesure=digestion')
    unmount()
    wrap({ read: async () => [note(2)] })
    await screen.findByRole('heading')
    expect(screen.queryByRole('link', { name: /Vos notes du jour/ })).toBeNull()
  })

  it('analyses prêtes : une ligne qui ouvre Analyses › Digestion, sans résultat recopié ici', async () => {
    wrap({ read: async () => [note(1)], summary: { gut: ['Oignon → digestion'], levers: [] } })
    const link = await screen.findByRole('link', { name: /Vos analyses digestives sont prêtes/ })
    expect(link).toHaveAttribute('href', '/recommendations/ventre')
    expect(screen.queryByText('Oignon → digestion')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('AUJ-4b : « Vos apports jusqu’ici » après le premier repas, sans couleur d’alerte ; un toucher ouvre Nutrition', async () => {
    const meals = [{ type: 'food', at: dayAt(0, 12), payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 100 }] } }]
    const { unmount } = wrap({ read: async () => [], meals })
    const link = await screen.findByRole('link', { name: /Vos apports jusqu’ici/ })
    expect(link).toHaveAttribute('href', '/nutrition')
    expect(link).toHaveTextContent(/kcal/)
    expect(link).toHaveTextContent(/protéines/)
    expect(link.textContent).not.toMatch(/trop|excès|attention/i)
    unmount()
    wrap({ read: async () => [], meals: [] })
    await screen.findByRole('heading')
    expect(screen.queryByText('Vos apports jusqu’ici')).toBeNull()
  })
})
