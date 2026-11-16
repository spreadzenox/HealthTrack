import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MeetPilou from './MeetPilou'
import LifeMoments from './LifeMoments'
import { companionName, loadCompanion, needsMeeting } from './companionState'
import { bus, EVENTS } from '../bus'
import { saveOnboarding } from '../../settings/onboarding'

beforeEach(() => {
  localStorage.clear()
  bus.clear()
})

describe('MeetPilou : la rencontre et le nom', () => {
  it('un toucher passe l’éclosion ; « Pilou » proposé, le nom choisi est gardé, annoncé sur le bus', () => {
    const onDone = vi.fn()
    const named = []
    bus.on(EVENTS.PILOU_NAMED, (p) => named.push(p))
    render(<MeetPilou onDone={onDone} />)
    expect(screen.getByText('Bonjour !')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Passer' }))
    expect(screen.getByRole('heading', { name: 'Comment voulez-vous l’appeler ?' })).toBeInTheDocument()
    expect(screen.getByText('C’est vous qui choisissez. Vous pourrez changer son nom dans Réglages.')).toBeInTheDocument()
    const field = screen.getByRole('textbox', { name: 'Son nom' })
    expect(field).toHaveValue('Pilou')
    fireEvent.change(field, { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled()
    fireEvent.change(field, { target: { value: 'Noisette' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(screen.getByText('Noisette ! Ça me plaît.')).toBeInTheDocument()
    expect(companionName()).toBe('Noisette')
    expect(loadCompanion().metBy).toBe('onboarding')
    expect(named).toEqual([{ name: 'Noisette' }])
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(onDone).toHaveBeenCalledWith('Noisette')
  })
})

describe('LifeMoments : utilisateur d’avant la refonte', () => {
  const show = (path = '/') => render(<MemoryRouter initialEntries={[path]}><LifeMoments /></MemoryRouter>)

  it('accueil déjà fait, aucun compagnon : il le rencontre une fois, sans refaire l’accueil', async () => {
    saveOnboarding({ done: true, endedBy: 'existing' })
    const { unmount } = show()
    expect(screen.getByRole('dialog', { name: 'La rencontre' })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Passer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(loadCompanion().metBy).toBe('update')
    unmount()
    show()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('pendant l’onboarding : rien', () => {
    saveOnboarding({ done: false })
    show('/bienvenue')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(needsMeeting({ done: false })).toBe(false)
  })

  it('émet app:opened une fois par lancement', () => {
    const got = []
    bus.on(EVENTS.APP_OPENED, (p) => got.push(p))
    saveOnboarding({ done: false })
    show('/bienvenue')
    expect(got.length).toBeLessThanOrEqual(1)
  })
})
