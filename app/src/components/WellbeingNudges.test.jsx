import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { StartCalibration, UnlockReminder } from './WellbeingNudges'

const wrap = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('UnlockReminder (POL-PLAY-84)', () => {
  it('une ligne discrète vers Sources, fermable ; aucun chiffre de précision', () => {
    const dismiss = vi.fn()
    wrap(<UnlockReminder onDismiss={dismiss} />)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('À chaque déverrouillage, bien plus de lectures')
    expect(note.textContent).not.toMatch(/%/)
    expect(screen.getByRole('link', { name: 'Voir dans Sources' })).toHaveAttribute('href', '/connectors')
    fireEvent.click(screen.getByRole('button', { name: 'Ne plus afficher ce rappel' }))
    expect(dismiss).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('link', { name: 'Voir dans Sources' }))
    expect(dismiss).toHaveBeenCalledTimes(2)
  })
})

describe('StartCalibration (BE-BIAIS-2, AUJ-2b)', () => {
  it('demande la note du jour, avec la progression, tant que 3 jours ne sont pas notés', () => {
    const add = vi.fn()
    const remind = vi.fn()
    wrap(<StartCalibration cal={{ done: 0, needed: 3, notedToday: false }} onAddManual={add} onReminder={remind} />)
    expect(screen.getByText('Calibration du bien-être : 0 jour sur 3')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Notez votre bien-être chaque jour pendant 3 jours')
    fireEvent.click(screen.getByRole('button', { name: 'Remplir maintenant' }))
    expect(add).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Recevoir un rappel' }))
    expect(remind).toHaveBeenCalled()
  })

  it('sans rappel possible (pas de notification du soir), seulement « Remplir maintenant »', () => {
    wrap(<StartCalibration cal={{ done: 1, needed: 3, notedToday: false }} onAddManual={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Remplir maintenant' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Recevoir un rappel' })).toBeNull()
  })

  it('une fois la note du jour donnée, rendez-vous demain', () => {
    wrap(<StartCalibration cal={{ done: 2, needed: 3, notedToday: true }} onAddManual={vi.fn()} />)
    expect(screen.getByText('Calibration du bien-être : 2 jours sur 3. Prochaine note demain.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
