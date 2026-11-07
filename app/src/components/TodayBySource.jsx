/**
 * « Vos données du jour » (AUJ-3, revue design du 07/11) : un seul bloc, une ligne par mesure avec son icône et la
 * couleur de son thème (leçons 9 et 12), la valeur du jour et, dès 7 jours d'historique, l'écart à VOTRE norme sur la
 * mesure elle-même (« d'habitude 7 h 10 », flèche quand l'écart est net ; jamais un jugement, règle 6). Les sources
 * sont dites une fois, en petit en bas, sans nom d'appareil ni d'app. « Ce qui change aujourd'hui » (DayChanges)
 * n'existe plus : ses écarts sont ici, sur chaque mesure.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sourcesSentence, todayBySource } from '../services/today'
import { buildDailyJournal } from '../services/dailyJournal'
import { dayDeviations, measureNorms, readDeviationEntries } from '../services/dayDeviations'
import { measureTone } from '../theme/themes'
import LineIcon from './LineIcon'
import './TodayBySource.css'

const ICONS = {
  sleep: 'moon', hrv: 'pulse', restingHr: 'heart', steps: 'steps', screen: 'phone',
  wellbeing: 'smile', gut: 'digestion', meals: 'meal', cigarettes: 'cigarette',
}
/** Clé du thème de chaque ligne (src/theme/themes.js). */
const THEME_KEYS = { screen: 'screenMinutes', cigarettes: 'phone' }

/**
 * @param {{ tiles: object[], summary: object | null, entries: object[], showGut?: boolean, now?: Date,
 *   readNorms?: () => Promise<object[]>, onItems?: (items: object[]) => void }} props
 *   `onItems` : les écarts nets du jour, pour la carte des analyses (TESTEUR-1d-3).
 */
export default function TodayBySource({
  tiles, summary, entries, showGut = false, now, readNorms = readDeviationEntries, onItems,
}) {
  const [norms, setNorms] = useState({})
  const refresh = useCallback(async () => {
    try {
      const days = buildDailyJournal(await readNorms())
      const at = now || new Date()
      setNorms(measureNorms(days, at).norms)
      const dev = dayDeviations(days, at)
      onItems?.(dev.ready ? dev.items : [])
    } catch {
      setNorms({})
      onItems?.([])
    }
  }, [readNorms, now, onItems])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    refresh()
    window.addEventListener('health-entries-updated', refresh)
    return () => window.removeEventListener('health-entries-updated', refresh)
  }, [refresh])

  // Les repas ont leur bloc, « Mes repas du jour » (AUJ-5, leçon 16 : une information n'a qu'une maison)
  const groups = todayBySource({ tiles, summary, entries, now: now || new Date(), showGut })
    .map((g) => ({ ...g, items: g.items.filter((i) => i.key !== 'meals') }))
    .filter((g) => g.items.length)
  // Rien du tout : ni titre ni lien (le bien-être du jour et le bandeau d'ajout suffisent au premier jour)
  if (!groups.length) return null
  const items = groups.flatMap((g) => g.items)
  return (
    <section className="today-sources" aria-labelledby="today-sources-title">
      <h2 id="today-sources-title" className="today-sources-title">Vos données du jour</h2>
      <div className="today-data">
        <ul className="today-data-items">
          {items.map((i) => {
            const n = norms[i.key]
            return (
              <li key={i.key} className="today-data-item" data-tone={measureTone(THEME_KEYS[i.key] ?? i.key)}>
                <span className="today-data-icon"><LineIcon name={ICONS[i.key] ?? 'dots'} size={20} /></span>
                <span className="today-data-label">
                  {i.label}
                  {i.when && <span className="today-data-when"> · {i.when}</span>}
                </span>
                <span className="today-data-value mono">{i.value}</span>
                {n && (
                  <span className={`today-data-usual${n.direction ? ' is-notable' : ''}`}>
                    {n.direction && (
                      <span className="today-data-arrow mono" aria-label={n.text}>{n.direction === 'up' ? '↑' : '↓'}</span>
                    )}
                    <span>d’habitude <span className="mono">{n.usualValue}</span></span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <p className="today-data-from">{sourcesSentence(groups.map((g) => g.id))}</p>
      </div>
      {!todayBySource.hasWatch(groups) && (
        <Link to="/connectors" className="today-sources-add">
          Ajouter une montre
          <LineIcon name="chevron" size={16} />
        </Link>
      )}
    </section>
  )
}
