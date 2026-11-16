import { loadCompanion, openDay } from './companionState'
import { localDateKey } from '../../services/analysisEngine'
import { bus, EVENTS } from '../bus'

/** app:opened, une fois par lancement (pas à chaque changement d'onglet). */
let opened = false
export const wasOpened = () => opened
export function emitAppOpened(now = new Date(), target = bus) {
  const today = localDateKey(now.toISOString())
  const firstOfDay = loadCompanion().lastAppDay !== today
  const awayDays = openDay(today, loadCompanion(), 'lastAppDay')
  opened = true
  const payload = { firstOfDay, morning: now.getHours() < 11, awayDays }
  target.emit(EVENTS.APP_OPENED, payload)
  return payload
}

