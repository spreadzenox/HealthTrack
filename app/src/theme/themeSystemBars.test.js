import { describe, it, expect, vi } from 'vitest'

const { setStyle, registerPlugin } = vi.hoisted(() => {
  const setStyle = vi.fn(() => Promise.resolve())
  return { setStyle, registerPlugin: vi.fn(() => ({ setStyle })) }
})

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  registerPlugin,
  SystemBars: { setStyle },
}))
vi.mock('./safeAreaRestore', () => ({ restoreSafeArea: vi.fn() }))

describe('barres système (DEM-IOS-2)', () => {
  it('utilise le SystemBars déjà enregistré par Capacitor, sans le réenregistrer à chaque thème', async () => {
    const { applyTheme } = await import('./theme')
    applyTheme()
    await vi.waitFor(() => expect(setStyle).toHaveBeenCalledTimes(1))
    applyTheme()
    await vi.waitFor(() => expect(setStyle).toHaveBeenCalledTimes(2))
    expect(registerPlugin).not.toHaveBeenCalled()
    expect(setStyle.mock.calls[0][0]).toHaveProperty('dark')
  })
})
