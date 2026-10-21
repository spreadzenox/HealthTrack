/** Mode « détails » de l'accueil (DetailsToggle) : un seul réglage pour la page, retenu d'une ouverture à l'autre. */
import { useCallback, useState } from 'react'

const KEY = 'healthtrack-today-details'

export function useDetailsMode() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const toggle = useCallback(() => {
    setOn((v) => {
      try {
        localStorage.setItem(KEY, v ? '0' : '1')
      } catch {
        /* mode privé : réglage non retenu */
      }
      return !v
    })
  }, [])
  return [on, toggle]
}
