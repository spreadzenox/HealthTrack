/** Le nom que la personne a donné à Pilou (lot VIE), sinon le dernier annoncé sur le bus, sinon « Pilou ». */
import { bus } from '../bus'
import { companionName } from '../life/companionState'

export function nomDePilou() {
  try {
    const n = companionName()
    if (typeof n === 'string' && n.trim()) return n.trim()
  } catch { /* état du compagnon illisible : on retombe sur le bus */ }
  return bus.last('pilou:named')?.name || 'Pilou'
}
