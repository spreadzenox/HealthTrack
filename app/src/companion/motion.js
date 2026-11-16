/**
 * Mouvements réduits du compagnon (brief § 7.7, SPEC personnage § 10) : réglage de l'app `auto | on | off`
 * (`auto` = réglage du système, `prefers-reduced-motion`). Partagé par tous les lots (CONTRAT.md § 6).
 */
import { useEffect, useState } from 'react'
import { bus, EVENTS } from './bus'

const KEY = 'halcya.companion.reducedMotion'
const VALUES = ['auto', 'on', 'off']

export function getReducedMotionSetting() {
  try {
    const v = localStorage.getItem(KEY)
    return VALUES.includes(v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function systemReduced() {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  } catch {
    return false
  }
}

export function isReducedMotion() {
  const s = getReducedMotionSetting()
  if (s === 'on') return true
  if (s === 'off') return false
  return systemReduced()
}

export function setReducedMotionSetting(value) {
  if (!VALUES.includes(value)) throw new RangeError(`mouvements réduits : valeur inconnue « ${value} »`)
  try {
    if (value === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, value)
  } catch { /* rien */ }
  bus.emit(EVENTS.REDUCED_MOTION_CHANGED, { value: isReducedMotion() })
}

/** Valeur effective, relue quand le réglage de l'app ou celui du système change. */
export function useReducedMotion() {
  const [value, setValue] = useState(isReducedMotion)
  useEffect(() => {
    const stop = bus.on(EVENTS.REDUCED_MOTION_CHANGED, (p) => setValue(Boolean(p?.value)))
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onSystem = () => {
      const next = isReducedMotion()
      setValue(next)
      bus.emit(EVENTS.REDUCED_MOTION_CHANGED, { value: next })
    }
    mq?.addEventListener?.('change', onSystem)
    return () => {
      stop()
      mq?.removeEventListener?.('change', onSystem)
    }
  }, [])
  return value
}
