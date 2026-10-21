import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import FaceReadIndicator from './FaceReadIndicator'
import { FACE_READ_EVENT } from '../services/faceAppOpen'

const fire = (detail) => act(() => {
  window.dispatchEvent(new CustomEvent(FACE_READ_EVENT, { detail }))
})

describe('FaceReadIndicator', () => {
  it('rien par défaut ; visible pendant toute la lecture, puis un mot bref si le visage est lu', () => {
    vi.useFakeTimers()
    render(<FaceReadIndicator />)
    expect(screen.queryByRole('status')).toBeNull()
    fire({ phase: 'start' })
    expect(screen.getByRole('status').textContent).toMatch(/Lecture du visage/)
    fire({ phase: 'end', outcome: 'face' })
    expect(screen.getByRole('status').textContent).toMatch(/aucune image/)
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.queryByRole('status')).toBeNull()
    vi.useRealTimers()
  })

  it('lecture sautée ou sans visage : le bandeau disparaît tout de suite', () => {
    render(<FaceReadIndicator />)
    fire({ phase: 'start' })
    fire({ phase: 'end', outcome: 'skip:too_soon' })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
