import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompanionHome from './CompanionHome'
import { bus } from '../bus'
import { habitEntry } from '../../services/habits'

const NOW = new Date(2026, 10, 16, 14, 0)
const MED = { id: 'meditation', label: 'Méditation' }
const READ = { id: 'reading', label: 'Lecture' }

function renderHome(props = {}) {
  const onHabit = vi.fn()
  const onWellbeing = vi.fn()
  const ui = (p) => (
    <MemoryRouter>
      <CompanionHome scene={false} entries={[]} habits={[MED, READ]} now={NOW} onHabit={onHabit} onWellbeing={onWellbeing} {...p} />
    </MemoryRouter>
  )
  const utils = render(ui(props))
  return { ...utils, onHabit, onWellbeing, rerenderWith: (p) => utils.rerender(ui({ ...props, ...p })) }
}

beforeEach(() => { localStorage.clear(); bus.clear() })
afterEach(() => vi.useRealTimers())

describe('CompanionHome — les bulles', () => {
  it('une bulle-bouton par chose à noter, lisible au lecteur d’écran', () => {
    renderHome()
    const list = screen.getByRole('list', { name: 'À noter aujourd’hui' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Bien-être, à faire, touchez pour noter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Méditation, à faire, touchez pour noter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Repas, 0 sur 3/ })).toBeInTheDocument()
    expect(screen.getByText('Pilou est tranquille · 4 bulles à faire')).toBeInTheDocument()
  })

  it('une habitude s’ouvre en question ; « Non » est noté comme « Oui »', () => {
    const { onHabit } = renderHome()
    fireEvent.click(screen.getByRole('button', { name: /^Lecture, à faire/ }))
    const dialog = screen.getByRole('dialog', { name: 'Avez-vous lu aujourd’hui ?' })
    expect(within(dialog).getByText('Oui ou non, les deux comptent.')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Non' }))
    expect(onHabit).toHaveBeenCalledWith(READ, false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('la bulle du bien-être ouvre la note, et Pilou regarde la bulle pressée', () => {
    const { onWellbeing } = renderHome()
    fireEvent.click(screen.getByRole('button', { name: /^Bien-être/ }))
    expect(onWellbeing).toHaveBeenCalled()
    expect(bus.last('bubble:pressed')).toMatchObject({ id: 'wellbeing', kind: 'wellbeing', theme: 'menthe' })
  })

  it('une bulle faite éclate, le dit, et le bus le sait (« non » compris)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const events = []
    const off = bus.on('*', (payload, type) => events.push({ type, payload }))
    const { onHabit, rerenderWith } = renderHome()
    fireEvent.click(screen.getByRole('button', { name: /^Lecture, à faire/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Non' }))
    expect(onHabit).toHaveBeenCalled()
    rerenderWith({ entries: [habitEntry(READ, '2026-11-16', false)] })
    expect(screen.queryByRole('button', { name: /^Lecture, à faire/ })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Lecture : non, c’est noté.')
    const popped = events.find((e) => e.type === 'bubble:popped')
    expect(popped.payload).toMatchObject({ id: 'habit:reading', kind: 'habit', theme: 'miel', answer: 'no' })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(events.some((e) => e.type === 'flower:grow' && e.payload.theme === 'miel' && e.payload.angleDeg === -74)).toBe(true)
    expect(events.some((e) => e.type === 'mood:changed' && e.payload.word === 'De bonne humeur' && e.payload.value === 0.25)).toBe(true)
    expect(screen.getByRole('meter', { name: 'Humeur de Pilou' })).toHaveAttribute('aria-valuetext', 'De bonne humeur')
    off()
  })

  it('la jauge dit que c’est l’humeur du compagnon, pas celle de la personne (POLISH-SIM-109)', () => {
    renderHome({ name: 'Moka' })
    expect(screen.getByRole('meter', { name: 'Humeur de Moka' })).toBeInTheDocument()
    expect(screen.queryByText('Humeur du jour')).toBeNull()
  })

  it('l’humeur ne redescend pas quand une saisie est annulée', () => {
    const { rerenderWith } = renderHome({ entries: [habitEntry(READ, '2026-11-16', true)] })
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'De bonne humeur')
    rerenderWith({ entries: [] })
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'De bonne humeur')
  })

  it('la digestion attend le soir et le dit', () => {
    renderHome({ askGut: true })
    fireEvent.click(screen.getByRole('button', { name: /^Digestion, à partir de/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/se note le soir/)
  })
})

describe('CompanionHome — la première semaine', () => {
  it('jour 1 : la barre, le cadeau à ouvrir, puis son texte', () => {
    const events = []
    const off = bus.on('*', (payload, type) => events.push({ type, payload }))
    renderHome({ wellbeing: { noted: 0, todayNoted: false } })
    expect(screen.getByRole('heading', { name: 'Jour 1 sur 7 avant vos premiers résultats' })).toBeInTheDocument()
    expect(screen.getByText('Cadeau du jour : touchez la bulle dorée')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cadeau du jour pour Pilou/ }))
    expect(events.find((e) => e.type === 'gift:opened').payload).toEqual({ day: 1, item: 'arbuste' })
    expect(screen.queryByRole('button', { name: /Cadeau du jour pour Pilou/ })).toBeNull()
    expect(screen.getAllByText('Un arbuste pour l’îlot ! Prochain cadeau demain.').length).toBeGreaterThan(0)
    off()
  })

  it('le 7e jour : la carte des analyses et le délai du confort digestif', () => {
    localStorage.setItem('halcya.companion.firstWeek', JSON.stringify({ opened: [1, 2, 3, 4, 5, 6] }))
    renderHome({ wellbeing: { noted: 7, todayNoted: true }, askGut: true, gut: { daysLeft: 7 } })
    expect(screen.getByRole('heading', { name: 'Vos premiers résultats de bien-être sont prêts' })).toBeInTheDocument()
    expect(screen.getByText('Confort digestif : premier score dans 7 jours.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir' })).toHaveAttribute('href', '/recommendations')
    expect(bus.last('milestone')).toEqual({ kind: 'day7' })
    expect(bus.last('gift:opened')).toEqual({ day: 7, item: 'arc-en-ciel' })
  })

  it('à l’ouverture : l’humeur, les fleurs et les cadeaux déjà reçus sont dits à la scène', () => {
    renderHome({ wellbeing: { noted: 3, todayNoted: true }, entries: [{ id: 'a', type: 'food', at: new Date(2026, 10, 16, 8).toISOString() }] })
    expect(bus.last('mood:changed')).toMatchObject({ word: 'De bonne humeur', done: 1, planned: 6 })
    expect(bus.last('flowers:set').flowers).toEqual([{ id: 'a', theme: 'peche', angleDeg: -74, radius: 0.95, scale: 1 }])
    expect(bus.last('gift:placed')).toEqual({ day: 2, item: 'lanterne', items: ['arbuste', 'lanterne'] })
  })

  it('sans les états du jour, aucune barre', () => {
    renderHome({ wellbeing: null })
    expect(screen.queryByText(/avant vos premiers résultats/)).toBeNull()
  })
})

describe('CompanionHome — la nuit et le jour 14', () => {
  it('la nuit, les bulles restantes sont des lucioles toujours touchables, et rien ne presse', () => {
    renderHome({ now: new Date(2026, 10, 16, 23, 10) })
    const b = screen.getByRole('button', { name: /^Méditation, à faire/ })
    expect(b.className).toContain('is-firefly')
    expect(screen.getByText('Pilou dort. Le reste peut attendre demain.')).toBeInTheDocument()
  })

  it('le jour 14 : une grande fleur pêche et son étiquette, une seule fois', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { rerenderWith } = renderHome({ askGut: true, gut: { daysLeft: 1 } })
    rerenderWith({ gut: { daysLeft: 0 } })
    act(() => { vi.advanceTimersByTime(700) })
    expect(bus.last('milestone')).toEqual({ kind: 'day14' })
    expect(bus.last('flower:grow')).toMatchObject({ theme: 'peche', scale: 2.1 })
    expect(screen.getByRole('status')).toHaveTextContent('Confort digestif : premier score prêt')
  })

  it('le nom choisi est celui qu’on lit partout', () => {
    renderHome({ name: 'Nuage' })
    expect(screen.getByText('Nuage est tranquille · 4 bulles à faire')).toBeInTheDocument()
  })
})
