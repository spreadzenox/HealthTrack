import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useRef } from 'react'
import ScrollBanner from './ScrollBanner'

let observerCb = null
class FakeIO {
  constructor(cb) { observerCb = cb }
  observe() {}
  disconnect() {}
}

function Host() {
  const ref = useRef(null)
  return (
    <>
      <div ref={ref} />
      <ScrollBanner targetRef={ref} title="Pilou est content" sub="3 bulles à faire"
        dots={[{ id: 'a', tone: 'mint' }, { id: 'b', tone: 'honey' }]} />
    </>
  )
}

afterEach(() => { vi.unstubAllGlobals(); observerCb = null })

describe('ScrollBanner', () => {
  it('prend le relais quand l’îlot sort de l’écran, et y ramène', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO)
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    render(<Host />)
    expect(screen.queryByRole('button')).toBeNull()
    act(() => observerCb([{ boundingClientRect: { top: -200 }, intersectionRatio: 0.2 }]))
    const banner = screen.getByRole('button', { name: 'Pilou est content, 3 bulles à faire. Revenir à l’îlot' })
    fireEvent.click(banner)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    act(() => observerCb([{ boundingClientRect: { top: 10 }, intersectionRatio: 1 }]))
    expect(screen.queryByRole('button')).toBeNull()
  })
})
