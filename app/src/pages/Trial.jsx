/**
 * Un essai d'Agir (ORG-8, maquette validée du 07/11) : la consigne du jour, le calendrier de pastilles tirées au sort,
 * la question seulement si les données manquent, « Résultat en cours » (le lendemain des jours avec / sans, moyennes,
 * écart et fourchette dès 3 lendemains de chaque sorte), et à la fin « Vérifié par votre essai » ou « pas d'effet
 * net », avec « Garder cette habitude ». Des liens vérifiés chez vous, jamais une cause générale.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { readTrialsData, saveTrial } from '../services/trialsData'
import { instruction, trialStatus, RESULT_MIN_EACH, TRIAL_DAYS } from '../services/trials'
import { THEME_TONE } from '../services/resultsView'
import { toDisplay } from '../services/mood/wellbeingScale'
import { appLocale } from '../i18n/locale.js'
import TrialDots from '../components/TrialDots'
import { getAnalysis } from '../services/analysisRunner'
import { crossingChanges } from '../services/method/changes'

const readChanges = () => getAnalysis('changes').catch(() => null)

const fr1 = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fr1(Math.abs(v))}`

/** Points Avec / Sans du lendemain, moyennes, et barre « Écart » avec fourchette. */
function ResultChart({ result, scale }) {
  const W = 300
  const H = 120
  const y = (v) => 10 + (1 - (scale(v) - 1) / 4) * (H - 20)
  const col = { with: 90, without: 210 }
  const jitter = (i) => ((i % 5) - 2) * 6
  return (
    <svg className="trial-chart" viewBox={`0 0 ${W} ${H + 18}`} role="img"
      aria-label={`Lendemains avec : ${result.with.length}, sans : ${result.without.length}`}>
      {[1, 3, 5].map((t) => (
        <g key={t}>
          <line className="trial-grid" x1={40} x2={W - 20} y1={10 + (1 - (t - 1) / 4) * (H - 20)} y2={10 + (1 - (t - 1) / 4) * (H - 20)} />
          <text className="trial-axis mono" x={30} y={13 + (1 - (t - 1) / 4) * (H - 20)} textAnchor="end">{t}</text>
        </g>
      ))}
      {[['with', result.with, result.meanWith], ['without', result.without, result.meanWithout]].map(([k, vals, m]) => (
        <g key={k} className={`trial-col is-${k}`}>
          {vals.map((v, i) => <circle key={i} className="trial-pt" cx={col[k] + jitter(i)} cy={y(v)} r="4" />)}
          {m != null && <line className="trial-mean" x1={col[k] - 22} x2={col[k] + 22} y1={y(m)} y2={y(m)} />}
          <text className="trial-axis" x={col[k]} y={H + 14} textAnchor="middle">{k === 'with' ? 'Avec' : 'Sans'}</text>
        </g>
      ))}
    </svg>
  )
}

function DiffBar({ result, scaleDelta }) {
  const max = Math.max(1, Math.abs(scaleDelta(result.low)), Math.abs(scaleDelta(result.high)))
  const pos = (v) => `${50 + (scaleDelta(v) / max) * 50}%`
  return (
    <div className="trial-diff">
      <span className="trial-diff-label">Écart</span>
      <span className="trial-diff-track" aria-hidden="true">
        <span className="trial-diff-zero" />
        <span className="trial-diff-range" style={{ left: pos(result.low), right: `calc(100% - ${pos(result.high)})` }} />
        <span className="trial-diff-dot" style={{ left: pos(result.diff) }} />
      </span>
      <span className="trial-diff-value mono">{signed(scaleDelta(result.diff))}</span>
    </div>
  )
}

export default function Trial({ read = readTrialsData, readTrialChanges = readChanges, now }) {
  const { id } = useParams()
  const [state, setState] = useState(undefined)
  const [changes, setChanges] = useState(null)
  useEffect(() => {
    let alive = true
    readTrialChanges().then((c) => alive && setChanges(c))
    return () => {
      alive = false
    }
  }, [readTrialChanges])
  const load = useCallback(() => {
    read()
      .then((data) => {
        const entry = data.trials.find((e) => String(e.id) === String(id))
        setState(entry?.payload ? { entry, data } : null)
      })
      .catch(() => setState(null))
  }, [id, read])
  useEffect(() => {
     
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])
  if (state === undefined) return null
  if (state === null) return <section className="act-page"><p className="today-card-text">Cet essai est introuvable.</p></section>

  const { entry, data } = state
  const t = entry.payload
  const at = now || new Date()
  const outcomeId = t.factor.outcome === 'digestion' ? 'digestion' : 'wellbeing'
  const s = trialStatus(t, { summaries: data.summaries, outcome: data.outcomes[outcomeId] ?? new Map(), now: at })
  // Bien-être stocké de 0 à 5 : affiché de 1 à 5 ; le confort digestif l'est déjà
  const scale = outcomeId === 'wellbeing' ? (v) => toDisplay(v) : (v) => v
  const scaleDelta = outcomeId === 'wellbeing' ? (d) => toDisplay(d) - toDisplay(0) : (d) => d
  const what = outcomeId === 'digestion' ? 'votre confort digestif' : 'votre bien-être'
  // TS-2 : un changement durable du résultat suivi pendant l'essai fausse la comparaison ; on le dit
  const crossed = crossingChanges(changes?.[outcomeId], t.schedule[0].date, t.schedule[t.schedule.length - 1].date)
  const answer = (held) => saveTrial(entry.id, { ...t, answers: { ...t.answers, [s.ask.date]: held } })
  const keep = () => saveTrial(entry.id, { ...t, kept: true, endedAt: t.endedAt ?? at.toISOString() })
  const stop = () => saveTrial(entry.id, { ...t, endedAt: at.toISOString() })
  return (
    <section className="act-page trial-page" data-tone={THEME_TONE[t.factor.theme] ?? 'stone'}>
      <p className="act-back"><Link to="/agir">← Agir</Link></p>
      <h1 className="page-title">{instruction(t, true)}</h1>
      {!s.done && (
        <article className="today-card trial-today">
          <p className="trial-day">Jour <span className="mono">{s.dayIndex}</span> sur <span className="mono">{TRIAL_DAYS}</span></p>
          <p className="trial-instruction">
            {s.todayDay?.with ? 'Aujourd’hui, jour avec.' : 'Aujourd’hui, jour sans : comme d’habitude.'}
          </p>
        </article>
      )}
      {s.ask && !s.done && (
        <article className="today-card trial-ask" role="group" aria-label="Question sur hier">
          {s.ask.missing && <p className="act-card-detail">{s.ask.missing}</p>}
          <p className="trial-ask-q">{s.ask.question}</p>
          <div className="trial-ask-btns">
            <button type="button" className="act-drift-btn" onClick={() => answer(true)}>Oui</button>
            <button type="button" className="act-drift-btn is-quiet" onClick={() => answer(false)}>Non</button>
          </div>
        </article>
      )}
      <article className="today-card trial-calendar">
        <TrialDots days={s.calendar} />
        <p className="act-card-detail">Pleine : jour avec. Contour : jour sans. ✓ tenu, – pas tenu.</p>
      </article>
      <article className="today-card trial-result" aria-label="Résultat">
        <h2 className="act-section-title">
          {s.done ? (s.verdict === 'verified' ? 'Vérifié par votre essai' : 'Pas d’effet net') : 'Résultat en cours'}
        </h2>
        {s.result.with.length + s.result.without.length > 0
          ? <ResultChart result={s.result} scale={scale} />
          : <p className="act-card-detail">Le premier point arrive le lendemain du premier jour.</p>}
        {s.result.diff != null
          ? <DiffBar result={s.result} scaleDelta={scaleDelta} />
          : <p className="act-card-detail">L’écart s’affiche dès {RESULT_MIN_EACH} lendemains de chaque sorte.</p>}
        <p className="act-card-detail">Chaque point : {what} le lendemain d’un jour avec ou sans.</p>
        {crossed.length > 0 && (
          <p className="trial-crossed" role="note">
            {what.charAt(0).toUpperCase() + what.slice(1)} a changé de niveau pendant l’essai : l’écart est à lire avec prudence.
          </p>
        )}
      </article>
      {s.done && !t.kept && (
        <button type="button" className="reco-cta" onClick={keep}>Garder cette habitude</button>
      )}
      {!s.done && <button type="button" className="act-drift-btn is-quiet trial-stop" onClick={stop}>Arrêter l’essai</button>}
      <details className="trial-why">
        <summary>Pourquoi des jours tirés au sort ?</summary>
        <p>Si vous choisissiez vos jours, vous prendriez peut-être les jours où tout va déjà bien. Le tirage au sort
          sépare l’effet de la consigne de tout le reste.</p>
      </details>
      <details className="trial-why">
        <summary>Ce qui est mesuré</summary>
        <p>{what.charAt(0).toUpperCase() + what.slice(1)} chaque lendemain, comparé entre les jours avec et les jours
          sans. La consigne est vérifiée par vos données quand elles existent ; sinon, une question le lendemain.</p>
      </details>
    </section>
  )
}
