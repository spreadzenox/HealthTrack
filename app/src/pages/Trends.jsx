/**
 * Journal › Tendances (ORG-3, revue design du 07/11 ; quitte Analyses : Journal = voir ce qui s'est passé). Un
 * visualiseur : jour, semaine ou mois, une ou plusieurs mesures superposables. La vue Jour est l'historique du
 * bien-être (ORG-3b : chaque lecture au toucher). « Votre forme », le radar et les comptes à rebours en texte sont
 * retirés de cette page (code gardé). `?mesure=digestion` et `?vue=jour` ouvrent la page réglée (AUJ-9).
 */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import JournalTabs from '../components/JournalTabs'
import TrendsViewer from '../components/TrendsViewer'
import WellbeingHistory from './WellbeingHistory'
import { getAnalysis } from '../services/analysisRunner'
import { buildDailyJournal } from '../services/dailyJournal'
import { listEntries } from '../storage/localHealthStorage'
import { trendMeasure } from '../services/trendsData'

const DAY_MS = 86_400_000

/** Les 31 derniers jours des mesures du visualiseur (une nuit de plus pour celle qui finit le premier jour). */
async function readMeasureDays(now = new Date()) {
  const since = new Date(now.getTime() - 31 * DAY_MS).toISOString()
  const sleepSince = new Date(now.getTime() - 32 * DAY_MS).toISOString()
  const lists = await Promise.all([
    listEntries({ type: 'sleep', since: sleepSince, limit: Infinity }),
    listEntries({ type: 'steps', since, limit: Infinity }),
    listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since, limit: Infinity }),
    listEntries({ type: 'phone_usage', since, limit: Infinity }),
  ])
  return buildDailyJournal(lists.flat())
}

const readStates = () => getAnalysis('dayStates').catch(() => null)

export default function Trends({ readDays = readMeasureDays, readDayStates = readStates, now }) {
  const [params] = useSearchParams()
  const asked = params.get('mesure')
  const [period, setPeriod] = useState(params.get('vue') === 'jour' ? 'day' : 'week')
  const [data, setData] = useState(null)
  useEffect(() => {
    let alive = true
    const load = () => Promise.all([readDayStates(), readDays().catch(() => [])])
      .then(([states, days]) => alive && setData({ states, days }))
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [readDays, readDayStates])
  return (
    <section className="journal-page">
      <JournalTabs />
      {data ? (
        <TrendsViewer
          states={data.states}
          days={data.days}
          now={now}
          initialKeys={[trendMeasure(asked) ? asked : 'wellbeing']}
          period={period}
          onPeriod={setPeriod}
          dayView={<WellbeingHistory embedded initialPeriod="day" now={now} />}
        />
      ) : (
        <div className="loading"><div className="spinner" aria-hidden /></div>
      )}
    </section>
  )
}
