/**
 * « Historique du bien-être » (POL-2), ouvert depuis la carte « Bien-être estimé » de l'Accueil : la courbe du
 * bien-être estimé sur un jour, une semaine ou un mois, puis, pour qui veut creuser, le détail de ce que sortent les
 * modèles du visage (valence, éveil, expressions). Tout est présenté comme des estimations, jamais un diagnostic ;
 * les notes données à la main sont des points à part. Rien n'est calculé hors du téléphone.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WellbeingPrompt from '../components/WellbeingPrompt'
import LineIcon from '../components/LineIcon'
import { loadWellbeingHistory } from '../services/mood/faceMoodData'
import { frDecimal } from '../services/today'
import { appLocale } from '../i18n/locale.js'

const PERIOD_TABS = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]
const PERIOD_WORDS = { day: 'aujourd’hui', week: 'ces 7 jours', month: 'ces 30 jours' }

const W = 320
const H = 170
const PAD = { top: 10, right: 12, bottom: 24, left: 24 }
const DAY_MS = 86400000

function xScale(period, from, now) {
  const innerW = W - PAD.left - PAD.right
  const t0 = Date.parse(from)
  const t1 = period === 'day' ? t0 + DAY_MS : now.getTime()
  return (iso) => PAD.left + Math.min(1, Math.max(0, (Date.parse(iso) - t0) / Math.max(1, t1 - t0))) * innerW
}

function axisLabels(period, from) {
  const t0 = new Date(from)
  if (period === 'day') {
    return [6, 12, 18].map((h) => ({ at: new Date(t0.getTime() + h * 3600000).toISOString(), text: `${h} h` }))
  }
  const n = period === 'week' ? 7 : 30
  const step = period === 'week' ? 1 : 7
  const out = []
  for (let i = 0; i < n; i += step) {
    const d = new Date(t0)
    d.setDate(d.getDate() + i)
    d.setHours(12)
    out.push({
      at: d.toISOString(),
      text: period === 'week'
        // Deux lettres (« lu ma me ») : l'initiale seule confond mardi et mercredi.
        ? d.toLocaleDateString(appLocale(), { weekday: 'short' }).replace('.', '').slice(0, 2)
        : d.toLocaleDateString(appLocale(), { day: 'numeric', month: 'short' }).replace('.', ''),
    })
  }
  return out
}

/** Courbe du bien-être estimé (0–5) : fourchettes par lecture (jour), points des jours, notes à la main en losange. */
export function HistoryChart({ history, now }) {
  const { period, from, points, notes, mean } = history
  const innerH = H - PAD.top - PAD.bottom
  const y = (v) => PAD.top + innerH * (1 - v / 5)
  // En semaine et en mois, chaque jour est placé à midi pour que les points tombent sous leur étiquette.
  const pointAt = (p) => {
    if (period === 'day') return p.at
    const d = new Date(`${p.date}T12:00:00`)
    return d.toISOString()
  }
  const x = xScale(period, from, period === 'day' ? now : new Date(new Date(now).setHours(23, 59, 59, 999)))
  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${x(pointAt(p)).toFixed(1)} ${y(p.note).toFixed(1)}`).join(' ')
  return (
    <svg className="wbh-chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Bien-être estimé ${PERIOD_WORDS[period]} : ${points.length} ${period === 'day' ? 'lectures' : 'jours'}`}>
      {[0, 2.5, 5].map((g) => (
        <g key={g}>
          <line className="wbh-grid" x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} />
          <text className="wbh-axis" x={PAD.left - 6} y={y(g) + 3} textAnchor="end">{frDecimal(g)}</text>
        </g>
      ))}
      {mean != null && points.length > 1 && (
        <line className="wbh-mean" x1={PAD.left} x2={W - PAD.right} y1={y(mean)} y2={y(mean)} />
      )}
      {period === 'day' && points.filter((p) => Number.isFinite(p.low) && Number.isFinite(p.high)).map((p) => (
        <line key={`r${p.at}`} className="wbh-range" x1={x(p.at)} x2={x(p.at)} y1={y(p.high)} y2={y(p.low)} />
      ))}
      {points.length > 1 && <path className="wbh-line" d={line} />}
      {points.map((p) => (
        <circle key={p.at} className={`wbh-dot${p.few ? ' is-few' : ''}`} cx={x(pointAt(p))} cy={y(p.note)} r={period === 'month' ? 3 : 4.5} />
      ))}
      {notes.map((n) => {
        const cx = x(n.at)
        const cy = y(n.score)
        return <path key={`n${n.at}`} className="wbh-note" d={`M ${cx} ${cy - 5} L ${cx + 5} ${cy} L ${cx} ${cy + 5} L ${cx - 5} ${cy} Z`} />
      })}
      {axisLabels(period, from).map((l) => (
        <text key={l.at} className="wbh-axis" x={x(l.at)} y={H - 6} textAnchor="middle">{l.text}</text>
      ))}
    </svg>
  )
}

/** Barre centrée sur 0, de −1 à 1, avec ses deux mots aux extrémités. */
function BipolarBar({ value, left, right, label }) {
  const pos = ((value + 1) / 2) * 100
  return (
    <div className="wbh-bipolar">
      <div className="wbh-bipolar-head">
        <span className="wbh-bipolar-label">{label}</span>
        <span className="mono">{value > 0 ? '+' : value < 0 ? '−' : ''}{Math.abs(value).toLocaleString(appLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="wbh-bipolar-track" aria-hidden="true">
        <span className="wbh-bipolar-zero" />
        <span className="wbh-bipolar-fill" style={value >= 0 ? { left: '50%', width: `${pos - 50}%` } : { left: `${pos}%`, width: `${50 - pos}%` }} />
      </div>
      <div className="wbh-bipolar-ends"><span>{left}</span><span>{right}</span></div>
    </div>
  )
}

function ExpressionBars({ mix }) {
  return (
    <ul className="wbh-expressions" aria-label="Expressions du visage estimées">
      {mix.items.map((it) => (
        <li key={it.key}>
          <span className="wbh-ex-label">{it.label}</span>
          <span className="wbh-ex-track" aria-hidden="true"><span style={{ width: `${Math.round(it.p * 100)}%` }} /></span>
          <span className="wbh-ex-value mono">{Math.round(it.p * 100)} %</span>
        </li>
      ))}
    </ul>
  )
}

export default function WellbeingHistory({ now: givenNow }) {
  const [period, setPeriod] = useState('week')
  const [history, setHistory] = useState(undefined)
  const [noteOpen, setNoteOpen] = useState(false)
  const [now] = useState(() => givenNow ?? new Date())

  useEffect(() => {
    let alive = true
    const load = () => loadWellbeingHistory({ period, now })
      .then((h) => { if (alive) setHistory(h) })
      .catch(() => { if (alive) setHistory(null) })
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [period, now])

  const empty = history && !history.points.length && !history.notes.length
  return (
    <section className="wbh-page">
      <p className="wbh-back"><Link to="/">← Aujourd’hui</Link></p>
      <h2 className="page-title">Historique du bien-être</h2>

      <div className="wbh-tabs" role="group" aria-label="Période">
        {PERIOD_TABS.map((t) => (
          <button key={t.id} type="button" className={`wbh-tab${period === t.id ? ' is-on' : ''}`}
            aria-pressed={period === t.id} onClick={() => setPeriod(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {history === undefined && <div className="loading"><div className="spinner" aria-hidden /></div>}
      {history === null && <p className="today-card-text">L’historique n’a pas pu être lu.</p>}

      {history && (
        <article className="today-card wbh-card">
          <p className="wbh-figure">
            {history.mean != null ? (
              <>
                <span className="wbh-figure-note">{frDecimal(history.mean)}</span>
                <span className="wbh-figure-scale"> / 5 en moyenne</span>
              </>
            ) : (
              <span className="wbh-figure-scale">Pas encore d’estimation</span>
            )}
          </p>
          {!empty && <p className="wbh-figure-sub mono">
            {history.readings} {history.readings > 1 ? 'lectures' : 'lecture'} · {history.days} {history.days > 1 ? 'jours' : 'jour'}
            {history.notes.length > 0 && ` · ${history.notes.length} ${history.notes.length > 1 ? 'notes' : 'note'} à la main`}
          </p>}
          {empty ? (
            <p className="today-card-text">
              Aucune lecture {PERIOD_WORDS[history.period]}. La lecture du visage se règle dans{' '}
              <Link to="/connectors">Sources</Link>.
            </p>
          ) : (
            <HistoryChart history={history} now={now} />
          )}
          {!empty && <ul className="wbh-legend" aria-label="Légende">
            <li><span className="wbh-key is-estimate" aria-hidden="true" />estimé (visage)</li>
            {history.notes.length > 0 && <li><span className="wbh-key is-note" aria-hidden="true" />noté à la main</li>}
            {history.points.some((p) => p.few) && <li><span className="wbh-key is-few" aria-hidden="true" />peu de lectures</li>}
          </ul>}
          <button type="button" className="mood-manual" onClick={() => setNoteOpen(true)}>
            <LineIcon name="plus" size={16} />
            Noter moi-même
          </button>
        </article>
      )}

      {history && history.readings > 0 && (
        <article className="today-card wbh-models" aria-labelledby="wbh-models-title">
          <h3 id="wbh-models-title" className="today-card-title">Ce que lisent les modèles</h3>
          <p className="wbh-models-intro">
            Moyennes {PERIOD_WORDS[history.period]}. Ce sont des estimations de l’expression du visage, pas de ce que vous
            ressentez, ni un diagnostic.
          </p>
          {history.valence != null && (
            <BipolarBar label="Valence" value={history.valence} left="désagréable" right="agréable" />
          )}
          {history.arousal != null && (
            <BipolarBar label="Éveil" value={history.arousal} left="calme" right="animé" />
          )}
          {history.valence == null && history.arousal == null && (
            <p className="wbh-models-intro">Le modèle valence / éveil n’a pas encore lu ces lectures (il se télécharge une fois).</p>
          )}
          {history.expressions ? (
            <>
              <h4 className="wbh-subtitle">Expressions</h4>
              <ExpressionBars mix={history.expressions} />
              <p className="wbh-foot mono">sur {history.expressions.readings} {history.expressions.readings > 1 ? 'lectures' : 'lecture'}</p>
            </>
          ) : (
            <p className="wbh-foot">Les expressions (joie, neutre, surprise…) apparaîtront avec les prochaines lectures.</p>
          )}
          <p className="wbh-foot">
            Deux modèles embarqués (HSEmotion), sur le téléphone. Seuls ces nombres sont gardés, aucune image.
          </p>
        </article>
      )}

      <WellbeingPrompt open={noteOpen} onClose={() => setNoteOpen(false)} />
    </section>
  )
}
