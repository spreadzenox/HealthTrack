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
import { dayDeviations, measureNorms, normSinceFromChanges, readDeviationEntries } from '../services/dayDeviations'
import { lastAnalysis } from '../services/analysisRunner'
import { localDateKey } from '../services/analysisEngine'
import { measureTone } from '../theme/themes'
import LineIcon from './LineIcon'
import StripPlus from './StripPlus'
import './TodayBySource.css'
import { monoDigits } from '../utils/monoDigits'

const ICONS = {
  sleep: 'moon', hrv: 'pulse', restingHr: 'heart', steps: 'steps', screen: 'phone',
  wellbeing: 'smile', gut: 'digestion', meals: 'meal', cigarettes: 'cigarette',
}
/** Clé du thème de chaque ligne (src/theme/themes.js). */
const THEME_KEYS = { screen: 'screenMinutes', cigarettes: 'phone' }
/** Moments d’une valeur reprise de la veille (services/today.js `measureTiles`). */
const FROM_YESTERDAY = new Set(['hier', 'nuit d’avant'])
/** Courbe de chaque ligne dans Journal › Tendances (POLISH-SIM-2 : une ligne touchée ouvre sa courbe). */
const TREND_KEYS = {
  sleep: 'sleep', hrv: 'hrv', restingHr: 'restingHr', steps: 'steps', screen: 'screen', wellbeing: 'wellbeing', gut: 'digestion',
}

/**
 * @param {{ tiles: object[], summary: object | null, entries: object[], showGut?: boolean, now?: Date,
 *   readNorms?: () => Promise<object[]>, onItems?: (items: object[]) => void }} props
 *   `onItems` : les écarts nets du jour, pour la carte des analyses (TESTEUR-1d-3).
 */
export default function TodayBySource({
  tiles, summary, entries, showGut = false, now, readNorms = readDeviationEntries, onItems,
}) {
  const [norms, setNorms] = useState({ today: {}, yesterday: {} })
  const refresh = useCallback(async () => {
    try {
      const days = buildDailyJournal(await readNorms())
      const at = now || new Date()
      // TS-2 : la norme repart du dernier changement durable, pris dans le dernier calcul connu (aucun calcul ici)
      const options = { since: normSinceFromChanges(lastAnalysis('changes')) }
      // POLISH-SIM-22 : une mesure reprise d’hier (montre pas encore synchronisée) se compare à la même habitude
      const yesterday = localDateKey(new Date(at.getTime() - 86_400_000).toISOString())
      setNorms({
        today: measureNorms(days, at, options).norms,
        yesterday: measureNorms(days, at, { ...options, dayKey: yesterday }).norms,
      })
      const dev = dayDeviations(days, at, options)
      onItems?.(dev.ready ? dev.items : [])
    } catch {
      setNorms({ today: {}, yesterday: {} })
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
            const n = (FROM_YESTERDAY.has(i.when) ? norms.yesterday : norms.today)[i.key]
            return (
              <li key={i.key} data-tone={measureTone(THEME_KEYS[i.key] ?? i.key)}>
                <Row trend={TREND_KEYS[i.key]}>
                <span className="today-data-icon"><LineIcon name={ICONS[i.key] ?? 'dots'} size={20} /></span>
                <span className="today-data-label">
                  {i.label}
                  {i.when && <span className="today-data-when"> · {i.when}</span>}
                </span>
                <span className="today-data-value">{monoDigits(i.value)}</span>
                {n && (
                  <span className={`today-data-usual${n.direction ? ' is-notable' : ''}`}>
                    {n.direction && (
                      <span className="today-data-arrow mono" aria-label={n.text}>{n.direction === 'up' ? '↑' : '↓'}</span>
                    )}
                    <span>d’habitude <span className="today-data-usual-value">{monoDigits(n.usualValue)}</span></span>
                  </span>
                )}
                </Row>
              </li>
            )
          })}
        </ul>
        <p className="today-data-from">{sourcesSentence(groups.map((g) => g.id))}</p>
        <StripPlus />
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

/** Une ligne : un lien vers sa courbe quand Tendances en a une, sinon un simple bloc. */
function Row({ trend, children }) {
  if (!trend) return <div className="today-data-item">{children}</div>
  return <Link to={`/tendances?mesure=${trend}`} className="today-data-item is-link">{children}</Link>
}
