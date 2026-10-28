import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const dist = vi.hoisted(() => ({ play: false }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, get FEATURES() { return actual.featuresFor(dist.play ? 'play' : 'sideload') } }
})

import { PistesTeaser } from './TodayCards'

const remember = (summary) => localStorage.setItem('healthtrack_pistes_summary', JSON.stringify({ at: 'x', ...summary }))
const renderCard = () => render(<MemoryRouter><PistesTeaser read={async () => []} /></MemoryRouter>)

describe('PistesTeaser — pistes du ventre sans premium (POL-PLAY-21)', () => {
  beforeEach(() => {
    dist.play = false
    localStorage.clear()
  })

  it('play sans premium : le nombre, mais aucun aliment dans la page (comme Analyses)', async () => {
    dist.play = true
    remember({ gut: ['Oignon → ventre'], levers: [] })
    renderCard()
    expect(await screen.findByText('1 piste repérée')).toBeInTheDocument()
    expect(screen.getByText('premium')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Oignon/)
  })

  it('play sans premium : une piste du bien-être (gratuite) passe en premier', async () => {
    dist.play = true
    remember({ gut: ['Oignon → ventre'], levers: ['Marcher davantage'] })
    renderCard()
    expect(await screen.findByText('2 pistes repérées')).toBeInTheDocument()
    expect(screen.getByText('Marcher davantage')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Oignon/)
  })

  it('sideload : la piste du ventre est nommée', async () => {
    remember({ gut: ['Oignon → ventre'], levers: [] })
    renderCard()
    expect(await screen.findByText('Oignon → ventre')).toBeInTheDocument()
  })
})
