import { useEffect, useRef } from 'react'
import { emitDayDone } from './emit'

/** « Plus rien à faire » arrive sous nos yeux (pas déjà fini à l'ouverture) : day:done sur le bus, une fois. */
export function useDayDone(finished) {
  const before = useRef(finished)
  useEffect(() => {
    if (finished && !before.current) emitDayDone()
    before.current = finished
  }, [finished])
}
