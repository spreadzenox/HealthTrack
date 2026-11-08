/**
 * Journal › Tendances (ORG-3, revue design du 07/11 ; quitte Analyses : Journal = voir ce qui s'est passé). Un
 * visualiseur : jour, semaine ou mois, une ou plusieurs mesures superposables. La vue Jour suit la maquette validée
 * (correction T2 du 07/11) : les lectures du jour et la note, puis la même fiche du jour qu'en Semaine ; l'ancien
 * historique du bien-être (WellbeingHistory) est retiré. « Votre forme », le radar et les comptes à rebours en texte sont
 * retirés de cette page (code gardé). `?mesure=digestion` et `?vue=jour` ouvrent la page réglée (AUJ-9).
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import JournalTabs from '../components/JournalTabs'
import TrendsViewer from '../components/TrendsViewer'
import { getAnalysis } from '../services/analysisRunner'
import { buildDailyJournal } from '../services/dailyJournal'
import { listEntries } from '../storage/localHealthStorage'
import { buildTrendSeries, defaultTrendsView } from '../services/trendsData'
import { dayFaceDetail, dayReadingsView, latestReadingDay } from '../services/trendsDay'
import { loadFaceMoodEntries } from '../services/mood/faceMoodData'

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
// Détail d'un jour (ORG-3c) : lectures du visage et notes, contributions du modèle d'Analyses (ORG-5, contrat)
const readFace = () => loadFaceMoodEntries().then(({ bursts, notes }) => [...bursts, ...notes]).catch(() => [])
const readChanges = () => getAnalysis('changes').catch(() => null)
const readContributions = () => getAnalysis('analysisResults').then((r) => r?.contributions ?? null).catch(() => null)

export default function Trends({
  readDays = readMeasureDays, readDayStates = readStates, readFaceEntries = readFace, readDayContributions = readContributions, readDayChanges = readChanges, now,
}) {
  const [params] = useSearchParams()
  const asked = params.get('mesure')
  // Choisie par la personne ; sinon la vue par défaut, décidée une fois les données lues (correction T1)
  const [chosen, setPeriod] = useState(null)
  const [data, setData] = useState(null)
  // Budget de lectures (perf D2) : à l'ouverture, seulement l'estimation TS-1 ; les contributions (calcul d'Analyses)
  // au premier jour touché, les changements durables à la première vue Mois.
  const [wantContrib, setWantContrib] = useState(false)
  const [contributions, setContributions] = useState(null)
  const [changes, setChanges] = useState(null)
  useEffect(() => {
    let alive = true
    const load = () => Promise.all([readDayStates(), readDays().catch(() => []), readFaceEntries()])
      .then(([states, days, face]) => alive && setData({ states, days, face }))
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [readDays, readDayStates, readFaceEntries])
  useEffect(() => {
    if (!wantContrib) return undefined
    let alive = true
    readDayContributions().then((c) => alive && setContributions(c))
    return () => {
      alive = false
    }
  }, [wantContrib, readDayContributions])
  // T1 : une courbe dès qu'une mesure le peut. L'estimation TS-1 est attendue (spinner) avant de décider : le
  // bien-être ne manque jamais seulement parce qu'elle n'est pas encore calculée.
  const view = useMemo(() => (data ? defaultTrendsView({
    asked,
    askedDay: params.get('vue') === 'jour',
    available: buildTrendSeries({ states: data.states, days: data.days, period: 'week', now: now || new Date() }).available,
    hasWellbeing: data.face.length > 0 || Boolean(data.states?.days?.some((d) => !d.future && d.observed?.wellbeing)),
  }) : null), [data, asked, params, now])
  const period = chosen ?? view?.period ?? 'week'
  useEffect(() => {
    if (period !== 'month' || changes) return undefined
    let alive = true
    readDayChanges().then((c) => alive && setChanges(c ?? {}))
    return () => {
      alive = false
    }
  }, [period, changes, readDayChanges])
  // Le confort digestif seul affiché : ses contributions ; sinon celles du bien-être
  const dayExtra = (date, keys) => {
    if (!wantContrib) setTimeout(() => setWantContrib(true), 0)
    return {
      face: dayFaceDetail(data?.face ?? [], date),
      contributions: contributions?.[keys.includes('wellbeing') || !keys.includes('digestion') ? 'wellbeing' : 'digestion']?.[date] ?? null,
    }
  }
  return (
    <section className="journal-page">
      <JournalTabs />
      {data ? (
        <TrendsViewer
          states={data.states}
          days={data.days}
          now={now}
          initialKeys={view.keys}
          period={period}
          onPeriod={setPeriod}
          dayReadings={(date) => dayReadingsView(data.face, date, now || new Date())}
          initialDay={latestReadingDay(data.face, now || new Date())}
          dayExtra={dayExtra}
          changes={changes}
        />
      ) : (
        <div className="loading"><div className="spinner" aria-hidden /></div>
      )}
    </section>
  )
}
