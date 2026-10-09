import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import MealEditor from './MealEditor'

function Harness({ initial, onChange = () => {}, disabled = false }) {
  const [items, setItems] = useState(initial)
  return (
    <MealEditor
      items={items}
      disabled={disabled}
      onChange={(next) => { setItems(next); onChange(next) }}
    />
  )
}

const cheese = { ingredient: 'Abondance', quantity: '50 g', quantity_g: 50 }

describe('MealEditor', () => {
  it('affiche chaque ingrédient avec ses grammes, ses kcal et le total', () => {
    render(<Harness initial={[cheese, { ...cheese, quantity_g: 100, quantity: '100 g' }]} />)
    expect(screen.getAllByLabelText(/Grammes de Abondance/i).map((i) => i.value)).toEqual(['50', '100'])
    expect(screen.getByText('197 kcal')).toBeInTheDocument()
    expect(screen.getByText(/≈ 590 kcal/)).toBeInTheDocument()
  })

  it('modifie les grammes à la saisie et avec les boutons − / +', () => {
    const onChange = vi.fn()
    render(<Harness initial={[cheese]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/Grammes de Abondance/i), { target: { value: '80' } })
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ quantity_g: 80, quantity: '80 g' })])
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 10 g à Abondance/i }))
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ quantity_g: 90 })])
    fireEvent.click(screen.getByRole('button', { name: /Retirer 10 g à Abondance/i }))
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ quantity_g: 80 })])
  })

  it('supprime un ingrédient', () => {
    const onChange = vi.fn()
    render(<Harness initial={[cheese]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer Abondance/i }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('ajoute un ingrédient trouvé par la recherche (100 g par défaut)', () => {
    const onChange = vi.fn()
    render(<Harness initial={[]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/Ajouter un ingrédient/i), { target: { value: 'abricot sec' } })
    const list = screen.getByRole('listbox')
    fireEvent.click(within(list).getByRole('option', { name: 'Abricot, dénoyauté, sec' }))
    expect(onChange).toHaveBeenLastCalledWith([
      { ingredient: 'Abricot, dénoyauté, sec', quantity: '100 g', quantity_g: 100 },
    ])
    expect(screen.getByLabelText(/Ajouter un ingrédient/i).value).toBe('')
  })

  it('signale un ingrédient absent de la base et permet de le remplacer en gardant les grammes', () => {
    const onChange = vi.fn()
    render(<Harness initial={[{ ingredient: 'Abricot sec bio', quantity: '30 g', quantity_g: 30, unknown: true }]} onChange={onChange} />)
    expect(screen.getByText(/Aliment absent de la base/i)).toBeInTheDocument()
    expect(screen.getByText(/hors aliments absents de la base/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Remplacer Abricot sec bio/i }))
    const search = screen.getByLabelText(/Remplacer par/i)
    expect(search.value).toBe('Abricot sec bio')
    fireEvent.change(search, { target: { value: 'abricot sec' } })
    fireEvent.click(screen.getByRole('option', { name: 'Abricot, dénoyauté, sec' }))
    expect(onChange).toHaveBeenLastCalledWith([
      { ingredient: 'Abricot, dénoyauté, sec', quantity: '30 g', quantity_g: 30 },
    ])
  })

  it('marque les estimations peu sûres « à vérifier »', () => {
    render(<Harness initial={[{ ...cheese, confidence: 'low' }]} />)
    expect(screen.getByText(/à vérifier/i)).toBeInTheDocument()
  })

  it('bloque les modifications une fois le repas enregistré', () => {
    render(<Harness initial={[cheese]} disabled />)
    expect(screen.getByLabelText(/Grammes de Abondance/i)).toBeDisabled()
    expect(screen.queryByLabelText(/Ajouter un ingrédient/i)).not.toBeInTheDocument()
  })
})
