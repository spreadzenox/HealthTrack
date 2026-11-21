import { describe, it, expect, vi } from 'vitest'

const { registerPlugin } = vi.hoisted(() => ({
  registerPlugin: vi.fn((name) => ({ pluginName: name })),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
  registerPlugin,
}))

describe('plugins des rappels exportés (DEM-IOS-3)', () => {
  it.each([
    ['./gutEvening', 'NativeGutEvening', 'GutEvening'],
    ['./eveningNote', 'NativeEveningNote', 'EveningNote'],
    ['./fodmapReminder', 'NativePortionReminder', 'PortionReminder'],
  ])('%s exporte %s, enregistré une seule fois', async (path, exported, name) => {
    const mod = await import(path)
    expect(mod[exported]).toEqual({ pluginName: name })
    expect(registerPlugin.mock.calls.filter(([n]) => n === name)).toHaveLength(1)
  })
})
