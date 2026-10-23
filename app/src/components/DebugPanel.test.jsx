import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DebugPanel from './DebugPanel'
import { markScreenSeen, saveOnboarding } from '../settings/onboarding'

describe('DebugPanel — export', () => {
  let blobs
  beforeEach(() => {
    localStorage.clear()
    blobs = []
    vi.stubGlobal('URL', { ...URL, createObjectURL: (b) => (blobs.push(b), 'blob:x'), revokeObjectURL: () => {} })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('met l’état de l’onboarding en tête du fichier, même sans journal (I156)', async () => {
    saveOnboarding({ goal: 'gut', step: 1 })
    markScreenSeen('tracks', 5)
    render(<DebugPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    const text = await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.readAsText(blobs[0])
    })
    const first = text.split('\n')[0]
    expect(first.startsWith('[onboarding] ')).toBe(true)
    expect(JSON.parse(first.slice(13))).toMatchObject({ goal: 'gut', lastScreen: 'tracks', screens: 5, done: false })
  })
})
