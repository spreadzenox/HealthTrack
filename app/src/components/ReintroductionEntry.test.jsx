import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const dist = vi.hoisted(() => ({ play: false }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, get FEATURES() { return actual.featuresFor(dist.play ? 'play' : 'sideload') } }
})

import ReintroductionEntry from './ReintroductionEntry'

const renderEntry = (read) => render(<BrowserRouter><ReintroductionEntry read={read} /></BrowserRouter>)

describe('ReintroductionEntry (7b-2)', () => {
  beforeEach(() => {
    dist.play = false
    localStorage.clear()
  })

  it('sideload : pas d’étiquette premium', async () => {
    renderEntry(async () => null)
    expect(await screen.findByText('Tester un groupe FODMAP')).toBeInTheDocument()
    expect(screen.queryByText('premium')).not.toBeInTheDocument()
  })

  it('play sans premium : étiquette « premium », comme le rapport PDF (POL-PLAY-3)', async () => {
    dist.play = true
    renderEntry(async () => null)
    expect(await screen.findByText('premium')).toBeInTheDocument()
  })

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
