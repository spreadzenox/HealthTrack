import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BaselineCards from './BaselineCards'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({ listEntries: vi.fn() }))
vi.mock('../config/distribution', async (importOriginal) => ({ ...(await importOriginal()), DISTRIBUTION: 'appstore' }))

const NOW = new Date(2026, 9, 28, 14, 0)
const daysAgo = (n) => new Date(2026, 9, 28 - n, 7, 0).toISOString()
const sdnn = (n, value) => ({ type: 'heart_rate', at: daysAgo(n), payload: { value, subtype: 'heartRateVariabilitySdnn' } })

// Sur iPhone : la VFC de l'app Santé (SDNN) a sa propre carte « ma norme », à côté de la FC repos.
describe('BaselineCards sur iPhone (variante appstore)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('lit aussi la VFC SDNN et en montre la norme', async () => {
    const history = Array.from({ length: 60 }, (_, i) => sdnn(i + 7, 45 + (i % 2 ? -2 : 2)))
    listEntries.mockResolvedValue([...history, sdnn(0, 45), sdnn(1, 44), sdnn(2, 46)])
    render(<BrowserRouter><BaselineCards /></BrowserRouter>)
    expect(await screen.findByText('VFC (SDNN)')).toBeTruthy()
    expect(listEntries.mock.calls[0][0].subtypes).toContain('heartRateVariabilitySdnn')
  })
})
