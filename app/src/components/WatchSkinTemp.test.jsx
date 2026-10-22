import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WatchSkinTemp from './WatchSkinTemp'
import { getSkinTempContinuous } from '../services/watchSync'

describe('WatchSkinTemp', () => {
  beforeEach(() => localStorage.clear())

  it('désactivé par défaut ; activer enregistre le choix, envoyé à la prochaine synchro', () => {
    render(<WatchSkinTemp />)
    const box = screen.getByLabelText('Mesure continue de la température de la peau')
    expect(box.checked).toBe(false)
    expect(screen.getByText(/Désactivée tant que vous ne l’activez pas/)).toBeTruthy()
    fireEvent.click(box)
    expect(box.checked).toBe(true)
    expect(getSkinTempContinuous()).toMatchObject({ wanted: true, applied: null })
    expect(screen.getByText(/prochaine synchronisation/)).toBeTruthy()
  })

  it('dit quand la montre a pris le réglage, ou ne le propose pas', () => {
    localStorage.setItem('healthtrack_watch_skin_temp', JSON.stringify({ wanted: true, applied: true, outcome: 'applied' }))
    const { unmount } = render(<WatchSkinTemp />)
    expect(screen.getByText(/Activée sur la montre/)).toBeTruthy()
    unmount()
    localStorage.setItem('healthtrack_watch_skin_temp', JSON.stringify({ wanted: true, applied: null, outcome: 'unsupported' }))
    render(<WatchSkinTemp />)
    expect(screen.getByText(/ne propose pas ce réglage/)).toBeTruthy()
  })
})
