import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LanguageSetting from './LanguageSetting'
import { LANG_STORAGE_KEY } from '../i18n/locale.js'

afterEach(() => localStorage.removeItem(LANG_STORAGE_KEY))

describe('LanguageSetting', () => {
  it('propose Automatique, Français et English, Automatique par défaut', () => {
    render(<LanguageSetting reload={() => {}} />)
    expect(screen.getByRole('radio', { name: /Automatique/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Français' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'English' })).toBeInTheDocument()
  })

  it('enregistre le choix et recharge l’app', () => {
    const reload = vi.fn()
    render(<LanguageSetting reload={reload} />)
    fireEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en')
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
