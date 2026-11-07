/**
 * Onglet « Agir » (ORG-1, ORG-1b, ORG-8 ; leçon 14 : Journal = voir, Analyses = comprendre, Agir = agir).
 * En cours (essais et test FODMAP), Mes habitudes, Proposés par vos analyses (« Commencer »), Terminés ; une section
 * vide ne s'affiche pas. Au départ, un état vide simple. En bas : vos essais figurent dans votre rapport médecin.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE } from '../services/today'
import { FODMAP_CHALLENGE_TYPE } from '../services/fodmapChallenge'
import { readPistesSummary } from '../services/pistesSummary'
import { actSections } from '../services/act'
import { getAnalysis } from '../services/analysisRunner'
import { resultsView, THEME_TONE } from '../services/resultsView'
import { createTrial, habitStatus, instruction, trialStatus, TRIAL_DAYS } from '../services/trials'
import { readTrialsData, saveNewTrial, saveTrial } from '../services/trialsData'
import LineIcon from '../components/LineIcon'
import TrialDots from '../components/TrialDots'

const GUT_WINDOW_DAYS = 120

async function readAct() {
  const since = new Date(Date.now() - GUT_WINDOW_DAYS * 86_400_000).toISOString()
  const [challenges, gut, trialsData, results] = await Promise.all([
    listEntries({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
    listEntries({ type: GUT_TYPE, since, limit: Infinity }),
    readTrialsData(),
    getAnalysis('analysisResults').catch(() => null),
  ])
  return { challenges, gut, pistes: readPistesSummary(), trialsData, results }
}

function Card({ item, action }) {
  return (
    <li>
      <Link to={item.to} className="today-card act-card" data-tone={item.tone ?? 'peach'}>
        <span className="act-card-body">
          <span className="act-card-title">{item.title}</span>
          {item.detail && <span className="act-card-detail">{item.detail}</span>}
          {item.dots && <TrialDots days={item.dots} />}
        </span>
        {action ? <span className="act-card-action">{action}</span> : <LineIcon name="chevron" size={20} className="act-chevron" />}
      </Link>
    </li>
  )
}

function Section({ title, items, action }) {
  if (!items.length) return null
  return (
    <section className="act-section" aria-label={title}>
      <h2 className="act-section-title">{title}</h2>
      <ul className="act-list">{items.map((i) => <Card key={i.id} item={i} action={action} />)}</ul>
    </section>
  )
}

/** Habitude gardée : les 14 dernières pastilles ; si l'on s'en éloigne, deux gestes (au plus une fois par mois). */
function Habit({ entry, status, onRelaunch, onRemove }) {
  const t = entry.payload
  return (
    <li className="today-card act-card act-habit" data-tone={THEME_TONE[t.factor.theme] ?? 'stone'}>
      <span className="act-card-body">
        <span className="act-card-title">{instruction(t)}</span>
        <TrialDots days={status.days.map((d) => ({ ...d, with: true }))} />
        {status.drifting && (
          <span className="act-drift">
            <span className="act-card-detail">Vous vous éloignez de cette habitude</span>
            <span className="act-drift-actions">
              <button type="button" className="act-drift-btn" onClick={onRelaunch}>Relancer le test</button>
              <button type="button" className="act-drift-btn is-quiet" onClick={onRemove}>Supprimer cette habitude</button>
            </span>
          </span>
        )}
      </span>
    </li>
  )
}

export default function Act({ read = readAct, now }) {
  const [data, setData] = useState(null)
  const navigate = useNavigate()
  const load = useCallback(() => {
    read().then((d) => setData(d)).catch(() => setData({ challenges: [], gut: [], pistes: null, trialsData: null, results: null }))
  }, [read])
  useEffect(() => {
     
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])
  if (!data) return null

  const at = now || new Date()
  const fodmap = actSections({ challenges: data.challenges, gut: data.gut, pistes: data.pistes, now: at })
  const td = data.trialsData ?? { trials: [], summaries: new Map(), outcomes: { wellbeing: new Map(), digestion: new Map() } }
  const trials = td.trials.filter((e) => !e.payload?.removedAt)
  const statusOf = (e) => trialStatus(e.payload, { summaries: td.summaries, outcome: td.outcomes[e.payload.factor.outcome] ?? new Map(), now: at })
  const live = trials.filter((e) => !statusOf(e).done)
  const kept = trials.filter((e) => e.payload.kept)
  const ended = trials.filter((e) => statusOf(e).done && !e.payload.kept)
  const busyKeys = new Set(trials.filter((e) => !statusOf(e).done || e.payload.kept).map((e) => e.payload.factor.key))

  const current = [
    ...live.map((e) => {
      const s = statusOf(e)
      return {
        id: `trial-${e.id}`, to: `/agir/essai/${e.id}`, tone: THEME_TONE[e.payload.factor.theme] ?? 'stone',
        title: e.payload.factor.label,
        detail: `Jour ${s.dayIndex} sur ${TRIAL_DAYS}. Aujourd’hui : ${instruction(e.payload, s.todayDay?.with ?? false).toLowerCase()}`,
        dots: s.calendar,
      }
    }),
    ...fodmap.current,
  ]
  const proposedTrials = ['wellbeing', 'digestion'].flatMap((o) => {
    const v = resultsView(data.results?.outcomes?.[o])
    return (v.pistes ?? []).filter((f) => !f.key.startsWith('fodmap_') && !busyKeys.has(f.key)).map((f) => ({
      id: `propose-${o}-${f.key}`, factor: f, tone: THEME_TONE[f.theme] ?? 'stone',
      title: `Tester : ${f.label.toLowerCase()}`,
      detail: `Lien repéré avec votre ${o === 'digestion' ? 'confort digestif' : 'bien-être'}, ${f.horizonLabel.toLowerCase()}.`,
    }))
  })
  const done = [
    ...ended.map((e) => {
      const s = statusOf(e)
      return {
        id: `trial-${e.id}`, to: `/agir/essai/${e.id}`, tone: THEME_TONE[e.payload.factor.theme] ?? 'stone',
        title: e.payload.factor.label,
        detail: s.verdict === 'verified' ? 'Vérifié par votre essai' : 'Pas d’effet net',
      }
    }),
    ...fodmap.done,
  ]
  const start = async (factor) => {
    const id = await saveNewTrial(createTrial(factor, { now: at }))
    navigate(`/agir/essai/${id}`)
  }
  const empty = !current.length && !kept.length && !proposedTrials.length && !fodmap.proposed.length && !done.length
  return (
    <section className="act-page" aria-labelledby="act-title">
      <h1 id="act-title" className="page-title">Agir</h1>
      {empty ? (
        <div className="today-card act-empty">
          <p className="act-empty-title">Rien en cours pour l’instant</p>
          <p className="act-empty-text">Quand vos analyses repèrent une piste, vous pourrez la vérifier ici par un essai.</p>
        </div>
      ) : (
        <>
          <Section title="En cours" items={current} />
          {kept.length > 0 && (
            <section className="act-section" aria-label="Mes habitudes">
              <h2 className="act-section-title">Mes habitudes</h2>
              <ul className="act-list">
                {kept.map((e) => (
                  <Habit key={e.id} entry={e} status={habitStatus(e.payload, { summaries: td.summaries, now: at })}
                    onRelaunch={() => start({ ...e.payload.factor, usualChange: { amount: e.payload.factor.change } })}
                    onRemove={() => saveTrial(e.id, { ...e.payload, removedAt: at.toISOString() })} />
                ))}
              </ul>
            </section>
          )}
          {(proposedTrials.length > 0 || fodmap.proposed.length > 0) && (
            <section className="act-section" aria-label="Proposés par vos analyses">
              <h2 className="act-section-title">Proposés par vos analyses</h2>
              <ul className="act-list">
                {proposedTrials.map((p) => (
                  <li key={p.id}>
                    <div className="today-card act-card" data-tone={p.tone}>
                      <span className="act-card-body">
                        <span className="act-card-title">{p.title}</span>
                        <span className="act-card-detail">{p.detail}</span>
                      </span>
                      <button type="button" className="act-card-action" onClick={() => start(p.factor)}>Commencer</button>
                    </div>
                  </li>
                ))}
                {fodmap.proposed.map((i) => <Card key={i.id} item={i} action="Commencer" />)}
              </ul>
            </section>
          )}
          <Section title="Terminés" items={done} />
        </>
      )}
      <p className="act-report">Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin.</p>
    </section>
  )
}
