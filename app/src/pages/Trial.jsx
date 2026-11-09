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

const fr = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: 1 })
const tick = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fr(Math.abs(v))}`

/**
 * POLISH-ESSAI-AXES (maquette `essai-en-cours.png`) : Avec et Sans en deux lignes sur un axe horizontal commun,
 * resserré sur les valeurs reçues (graduations d'un demi-point), puis la piste « Écart » graduée (−1 / 0 / +1)
 * avec sa fourchette, dans le même dessin.
 */
function valueDomain(values) {
  if (!values.length) return { lo: 1, hi: 5, step: 1 }
  let lo = Math.max(1, Math.floor((Math.min(...values) - 0.2) * 2) / 2)
  let hi = Math.min(5, Math.ceil((Math.max(...values) + 0.2) * 2) / 2)
  while (hi - lo < 1.5) {
    if (lo > 1) lo -= 0.5
    if (hi - lo < 1.5 && hi < 5) hi += 0.5
  }
  return { lo, hi, step: hi - lo > 2 ? 1 : 0.5 }
}

function ResultChart({ result, scale, scaleDelta }) {
  const W = 320
  const X0 = 56
  const X1 = W - 16
  const ROW = { with: 20, without: 50 }
  const shown = { with: result.with.map(scale), without: result.without.map(scale) }
  const { lo, hi, step } = valueDomain([...shown.with, ...shown.without])
  const x = (v) => X0 + ((v - lo) / (hi - lo)) * (X1 - X0)
  const ticks = []
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 2) / 2)
  const hasDiff = result.diff != null
  const span = hasDiff ? Math.max(1, Math.ceil(Math.abs(scaleDelta(result.low))), Math.ceil(Math.abs(scaleDelta(result.high)))) : 1
  const dx = (d) => X0 + ((d + span) / (2 * span)) * (X1 - X0)
  const DY = 104
  return (
    <svg className="trial-chart" viewBox={`0 0 ${W} 134`} role="img"
      aria-label={`Lendemains avec : ${result.with.length}, sans : ${result.without.length}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="trial-chart-line" x1={x(t)} x2={x(t)} y1={6} y2={64} />
          <text className="trial-axis mono" x={x(t)} y={80} textAnchor="middle">{fr(t)}</text>
        </g>
      ))}
      {['with', 'without'].map((k) => {
        const m = k === 'with' ? result.meanWith : result.meanWithout
        return (
          <g key={k} className={`trial-col is-${k}`}>
            <text className="trial-row-label" x={0} y={ROW[k] + 4}>{k === 'with' ? 'Avec' : 'Sans'}</text>
            {m != null && <line className="trial-mean" x1={x(scale(m))} x2={x(scale(m))} y1={ROW[k] - 11} y2={ROW[k] + 11} />}
            {shown[k].map((v, i) => <circle key={i} className="trial-pt" cx={x(v)} cy={ROW[k]} r="5" />)}
          </g>
        )
      })}
      <g className={`trial-diff${hasDiff ? '' : ' is-empty'}`}>
        <text className="trial-row-label" x={0} y={DY + 4}>Écart</text>
        <line className="trial-diff-base" x1={X0} x2={X1} y1={DY} y2={DY} />
        <line className="trial-diff-zero" x1={dx(0)} x2={dx(0)} y1={DY - 8} y2={DY + 8} />
        {hasDiff && (
          <>
            <rect className="trial-diff-range" x={dx(scaleDelta(result.low))} y={DY - 6}
              width={Math.max(2, dx(scaleDelta(result.high)) - dx(scaleDelta(result.low)))} height={12} rx={6} />
            <circle className="trial-diff-dot" cx={dx(scaleDelta(result.diff))} cy={DY} r="6" />
          </>
        )}
        {[-span, 0, span].map((t) => (
          <text key={t} className="trial-axis mono" x={dx(t)} y={DY + 24} textAnchor="middle">{tick(t)}</text>
        ))}
      </g>
    </svg>
  )
}

/** « Après 6 lendemains : +0,3 point, entre −0,2 et +0,9. » (maquette) */
function diffSentence(result, scaleDelta) {
  const d = scaleDelta(result.diff)
  const n = result.with.length + result.without.length
  return `Après ${n} lendemains : ${signed(d)} ${Math.abs(d) >= 2 ? 'points' : 'point'}, entre ${signed(scaleDelta(result.low))} et ${signed(scaleDelta(result.high))}.`
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
  // POLISH-ESSAI-ORDRE : la légende reprend la consigne (« ● dormir au moins 7 h 30 »), comme la maquette
  const consigne = instruction(t, true)
  const withLabel = consigne.charAt(0).toLowerCase() + consigne.slice(1)
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
      <article className="today-card trial-result" aria-label="Résultat">
        <h2 className="act-section-title">
          {s.done ? (s.verdict === 'verified' ? 'Vérifié par votre essai' : 'Pas d’effet net') : 'Résultat en cours'}
        </h2>
        {/* POLISH-ESSAI-VIDE : axes Avec / Sans et piste Écart dès le premier jour, comme la maquette */}
        <ResultChart result={s.result} scale={scale} scaleDelta={scaleDelta} />
        {s.result.diff != null && <p className="act-card-detail trial-diff-text">{diffSentence(s.result, scaleDelta)}</p>}
        {s.result.diff == null && s.result.with.length + s.result.without.length > 0 && (
          <p className="act-card-detail">L’écart s’affiche dès {RESULT_MIN_EACH} lendemains de chaque sorte.</p>
        )}
        <p className="act-card-detail">Chaque point : {what} le lendemain d’un jour avec ou sans.</p>
        {crossed.length > 0 && (
          <p className="trial-crossed" role="note">
            {what.charAt(0).toUpperCase() + what.slice(1)} a changé de niveau pendant l’essai : l’écart est à lire avec prudence.
          </p>
        )}
      </article>
      <article className="today-card trial-calendar">
        <h2 className="act-section-title">Les {s.calendar.length} jours</h2>
        <TrialDots days={s.calendar} grid />
        <ul className="trial-legend" aria-label="Légende">
          <li><span className="trial-legend-dot is-with" aria-hidden="true" />{withLabel}</li>
          <li><span className="trial-legend-dot" aria-hidden="true" />comme d’habitude</li>
          <li>✓ tenu · – pas tenu</li>
        </ul>
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
