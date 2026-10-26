import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ReintroductionEntry from './ReintroductionEntry'

const renderEntry = (read) => render(<BrowserRouter><ReintroductionEntry read={read} /></BrowserRouter>)

describe('ReintroductionEntry (7b-2)', () => {
  it('sans test en cours : propose de tester un groupe', async () => {
    renderEntry(async () => null)
    expect(await screen.findByText('Tester un groupe FODMAP')).toBeInTheDocument()
    expect(screen.getByTestId('reintro-entry')).toHaveAttribute('href', '/reintroduction')
  })

  it('pendant un test : son état en une ligne', async () => {
    renderEntry(async () => 'Lait · jour 2 · portion à prendre')
    expect(await screen.findByText('Votre test en cours')).toBeInTheDocument()
    expect(screen.getByText(/Lait · jour 2 · portion à prendre/)).toBeInTheDocument()
  })

  it('lecture impossible : la carte reste utilisable', async () => {
    renderEntry(async () => { throw new Error('x') })
    expect(await screen.findByText('Tester un groupe FODMAP')).toBeInTheDocument()
  })
})
