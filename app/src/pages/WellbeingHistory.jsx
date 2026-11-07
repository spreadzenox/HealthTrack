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
import { toDisplay, gapToDisplay } from '../services/mood/wellbeingScale'
import { appLocale } from '../i18n/locale.js'
import { faceModelTag } from '../services/mood/modelName'
import { PERIODS, habitShifts, viewEnd } from '../services/mood/wellbeingHistory'
import { keepSegments, keepWhole } from '../utils/keepWhole'

const PERIOD_TABS = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]
const PERIOD_WORDS = { day: 'aujourd’hui', week: 'ces 7 jours', fortnight: 'ces 14 jours', month: 'ces 30 jours' }
const PERIOD_NOW = { day: 'Aujourd’hui', week: 'Ces 7 jours', month: 'Ces 30 jours' }
const STEP_WORDS = {
  day: ['Jour précédent', 'Jour suivant'],
  week: ['Semaine précédente', 'Semaine suivante'],
  month: ['Mois précédent', 'Mois suivant'],
}
/** Balayage horizontal minimal (px) pour changer de période sur la courbe. */
const SWIPE_MIN = 60

/** « 1er » comme on l'écrit en français, sinon le numéro du jour. */
const dayNum = (d) => (d.getDate() === 1 ? '1er' : String(d.getDate()))
const monthName = (d) => d.toLocaleDateString(appLocale(), { month: 'long' })
/** « du 23 au 29 octobre », « du 26 octobre au 1er novembre » (année précisée si elle n'est pas celle d'aujourd'hui). */
function rangeText(fromIso, endIso, todayIso) {
  const a = new Date(fromIso)
  const b = new Date(endIso)
  const year = b.getFullYear() !== new Date(todayIso).getFullYear() ? ` ${b.getFullYear()}` : ''
  const start = a.getMonth() === b.getMonth() ? dayNum(a) : `${dayNum(a)} ${monthName(a)}`
  return `du ${start} au ${dayNum(b)} ${monthName(b)}${year}`
}
const longDay = (d) => new Date(d).toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

/** Titre de la période affichée : « Ces 7 jours », ou, en remontant le temps, « vendredi 23 octobre » / « du 11 au 17 octobre ». */
function periodTitle(period, offset, from, end, today) {
  if (!offset) return PERIOD_NOW[period]
  return period === 'day' ? longDay(from) : rangeText(from, end, today)
}

/** Même chose au fil d'une phrase : « aujourd’hui », « le vendredi 23 octobre », « du 11 au 17 octobre ». */
function periodWords(history) {
  if (!history.offset) return PERIOD_WORDS[history.period]
  const t = periodTitle(history.period, history.offset, history.from, history.end, history.today)
  return history.period === 'day' ? `le ${t}` : t
}

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
  const n = PERIODS[period]
  // 14 jours (Tendances) : une date tous les 3 jours, jusqu'à aujourd'hui.
  const step = period === 'week' ? 1 : period === 'fortnight' ? 3 : 7
  const first = period === 'fortnight' ? (n - 1) % step : 0
  const out = []
  for (let i = first; i < n; i += step) {
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
export function HistoryChart({ history, now, selected = null, onSelect }) {
  const words = periodWords(history)
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
  // Vue Jour : la ligne suit la tendance lissée (BE-BIAIS-4), les points restent les lectures.
  const smooth = period === 'day' && history.trend?.length === points.length
  const linePoints = smooth ? history.trend : points
  const line = linePoints.map((p, i) => `${i ? 'L' : 'M'} ${x(pointAt(p)).toFixed(1)} ${y(p.note).toFixed(1)}`).join(' ')
  return (
    <svg className="wbh-chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Bien-être estimé ${words} : ${period === 'day' ? `${history.readings} lectures` : `${points.length} jours`}${points.some((p) => p.hourly) ? ', un point par heure' : ''}`}>
      {[0, 2.5, 5].map((g) => (
        <g key={g}>
          <line className="wbh-grid" x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} />
          <text className="wbh-axis" x={PAD.left - 6} y={y(g) + 3} textAnchor="end">{toDisplay(g)}</text>
        </g>
      ))}
      {mean != null && points.length > 1 && (
        <line className="wbh-mean" x1={PAD.left} x2={W - PAD.right} y1={y(mean)} y2={y(mean)} />
      )}
      {period === 'day' && points.filter((p) => Number.isFinite(p.low) && Number.isFinite(p.high)).map((p) => (
        <line key={`r${p.at}`} className="wbh-range" x1={x(p.at)} x2={x(p.at)} y1={y(p.high)} y2={y(p.low)} />
      ))}
      {points.length > 1 && <path className={`wbh-line${smooth ? ' is-trend' : ''}`} d={line} data-trend={smooth ? '' : undefined} />}
      {points.map((p) => (
        <circle key={p.at} className={`wbh-dot${p.few ? ' is-few' : ''}${smooth ? ' is-reading' : ''}${selected === p.at ? ' is-on' : ''}`}
          cx={x(pointAt(p))} cy={y(p.note)} r={selected === p.at ? 6.5 : period === 'month' ? 3 : 4.5} />
      ))}
      {notes.map((n) => {
        const cx = x(n.at)
        const cy = y(n.score)
        return <path key={`n${n.at}`} className="wbh-note" d={`M ${cx} ${cy - 5} L ${cx + 5} ${cy} L ${cx} ${cy + 5} L ${cx - 5} ${cy} Z`} />
      })}
      {axisLabels(period, from).map((l) => (
        <text key={l.at} className="wbh-axis" x={x(l.at)} y={H - 6} textAnchor="middle">{l.text}</text>
      ))}
      {selected && points.some((p) => p.at === selected) && (() => {
        const sx = x(pointAt(points.find((p) => p.at === selected)))
        return <line className="wbh-sel" x1={sx} x2={sx} y1={PAD.top} y2={H - PAD.bottom} />
      })()}
      {onSelect && points.map((p, i) => {
        // Colonne pleine hauteur, coupée à mi-chemin des points voisins : on touche n'importe où au-dessus ou
        // au-dessous d'un point (en vue Mois, 30 colonnes étroites forment une bande qu'on parcourt du doigt).
        const cx = x(pointAt(p))
        const prev = i ? x(pointAt(points[i - 1])) : null
        const next = i < points.length - 1 ? x(pointAt(points[i + 1])) : null
        const left = prev == null ? PAD.left - 6 : (prev + cx) / 2
        const right = next == null ? W - PAD.right + 6 : (cx + next) / 2
        const toggle = () => onSelect(selected === p.at ? null : p.at)
        return (
          <rect key={`hit${p.at}`} className="wbh-hit" data-scrub="" x={left} y={PAD.top} width={Math.max(1, right - left)}
            height={H - PAD.top - PAD.bottom} role="button" tabIndex={0} aria-pressed={selected === p.at}
            aria-label={`${pointTitle(p, period)} : ${frDecimal(toDisplay(p.note))} sur 5`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle()
              }
            }} />
        )
      })}
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

const hm = (iso) => {
  const d = new Date(iso)
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`
}

/** « Lecture de 8 h 05 », « Lectures de 8 h à 9 h » (jour très lu) ou « jeudi 22 octobre » (semaine, mois). */
function pointTitle(p, period) {
  if (period !== 'day') {
    return new Date(`${p.date}T12:00:00`).toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' })
  }
  if (p.hourly) {
    const h = new Date(p.at).getHours()
    return `Lectures de ${h} h à ${h + 1} h`
  }
  return `Lecture de ${hm(p.at)}`
}

function readingsLine(detail) {
  const n = detail?.readings ?? 0
  const poor = detail?.poor ?? 0
  if (n === 1) return poor ? 'lecture peu nette' : 'lecture nette'
  const base = `${n} lectures`
  return poor ? `${base}, dont ${poor} peu ${poor > 1 ? 'nettes' : 'nette'}` : base
}

const pct = (p) => `${Math.round(p * 100)}%`
const NOUNS = { exHappiness: 'joie', exSurprise: 'surprise', exSadness: 'tristesse', exAnger: 'colère', exFear: 'peur', exDisgust: 'dégoût', exContempt: 'mépris' }
const shiftWords = (s) => (s.key === 'exNeutral'
  ? `${s.delta > 0 ? 'plus' : 'moins'} souvent neutre`
  : `${s.delta > 0 ? 'plus' : 'moins'} de ${NOUNS[s.key] ?? s.label.toLowerCase()}`)

/**
 * Expressions comparées à l'habitude de la personne (BE-BIAIS-3, retour (5) du 04/11) : « Par rapport à votre
 * habitude : plus de joie, moins de tristesse. » Rien sans habitude (moins de 3 jours lus).
 */
function HabitLine({ mix }) {
  const shifts = habitShifts(mix)
  if (!shifts) return null
  return (
    <p className="wbh-habit">
      {shifts.length
        ? `Par rapport à votre habitude : ${shifts.map(shiftWords).join(', ')}.`
        : 'Proche de votre habitude.'}
    </p>
  )
}

/** Les 8 expressions en grille 4 × 2 : chaque case se remplit depuis le bas selon sa part ; trait = l'habitude. */
function ExpressionMatrix({ mix }) {
  return (
    <ul className="wbh-matrix" aria-label="Expressions du visage estimées">
      {mix.items.map((it) => (
        <li key={it.key}>
          <span className="wbh-matrix-fill" style={{ height: `${Math.round(it.p * 100)}%` }} aria-hidden="true" />
          {Number.isFinite(it.habit) && <span className="wbh-matrix-habit" style={{ bottom: pct(it.habit) }} aria-hidden="true" />}
          <span className="wbh-matrix-value mono">{Math.round(it.p * 100)} %</span>
          <span className="wbh-matrix-label">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** Détail du point touché (BE-HISTO-DETAIL, retour (6) du 04/11) : ce que les modèles ont lu, jamais un diagnostic. */

export function ReadingDetail({ point, period, onClose }) {
  const title = pointTitle(point, period)
  const d = point.detail ?? { readings: point.readings ?? 1, poor: 0, valence: null, arousal: null, expressions: null }
  const hasRange = period === 'day' && Number.isFinite(point.low) && Number.isFinite(point.high)
  return (
    <article className="today-card wbh-detail" role="region" aria-label={title}>
      <div className="wbh-detail-head">
        <h3 className="today-card-title">{title}</h3>
        <button type="button" className="wbh-detail-close" aria-label="Fermer la lecture" onClick={onClose}>
          <LineIcon name="close" size={18} />
        </button>
      </div>
      <p className="wbh-figure">
        <span className="wbh-detail-note">{frDecimal(toDisplay(point.note))}</span>
        <span className="wbh-figure-scale"> / 5</span>
        {hasRange && <span className="wbh-detail-range mono"> entre {frDecimal(toDisplay(point.low))} et {frDecimal(toDisplay(point.high))}</span>}
      </p>
      <p className="wbh-figure-sub mono">{readingsLine(d)}</p>
      {d.valence != null && <BipolarBar label="Valence" value={d.valence} left="désagréable" right="agréable" />}
      {d.arousal != null && <BipolarBar label="Éveil" value={d.arousal} left="calme" right="animé" />}
      {d.expressions
        ? <><ExpressionMatrix mix={d.expressions} /><HabitLine mix={d.expressions} /></>
        : <p className="wbh-foot">Pas d’expressions pour cette lecture.</p>}
    </article>
  )
}

/**
 * Fiabilité mesurée sur les notes de la personne (BE-BIAIS-3) : écart moyen entre ses notes et le visage du même
 * jour, chaque jour laissé de côté pour le recalage. Aucun chiffre tant que 3 jours ne sont pas notés.
 */
function Reliability({ agreement }) {
  if (!agreement) {
    return <p className="wbh-reliability">Fiabilité mesurée dès 3 jours notés : elle compare vos notes à ces lectures.</p>
  }
  const gap = gapToDisplay(agreement.gap)
  const pts = gap > 1 ? 'points' : 'point'
  return (
    <p className="wbh-reliability">
      Écart moyen avec vos notes : <span className="mono">{frDecimal(gap)} {pts} sur 5</span>, mesuré sur
      {' '}{agreement.days} jours notés.
    </p>
  )
}

function ExpressionBars({ mix }) {
  return (
    <ul className="wbh-expressions" aria-label="Expressions du visage estimées">
      {mix.items.map((it) => (
        <li key={it.key}>
          <span className="wbh-ex-label">{it.label}</span>
          <span className="wbh-ex-track" aria-hidden="true">
            <span style={{ width: `${Math.round(it.p * 100)}%` }} />
            {Number.isFinite(it.habit) && <i className="wbh-ex-habit" style={{ left: pct(it.habit) }} />}
          </span>
          <span className="wbh-ex-value mono">{Math.round(it.p * 100)} %</span>
        </li>
      ))}
    </ul>
  )
}

/** « sur 13 lectures », ou « sur 13 des 33 lectures » quand les expressions ne viennent que des lectures récentes. */
function expressionsBase(n, total) {
  const word = (k) => (k > 1 ? 'lectures' : 'lecture')
  return total > n ? `sur ${n} des ${total} ${word(total)}` : `sur ${n} ${word(n)}`
}

/**
 * `embedded` (ORG-3b) : la vue Jour de Journal › Tendances ; ni retour, ni titre, ni choix de période (la carte de
 * Tendances a le sien), période fixée à `initialPeriod`.
 */
export default function WellbeingHistory({ now: givenNow, features, embedded = false, initialPeriod = 'week' }) {
  const [period, setPeriod] = useState(initialPeriod)
  const [history, setHistory] = useState(undefined)
  const [noteOpen, setNoteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  // Nombre de périodes en arrière (BE-HISTO-DETAIL-2) : 0 = la période qui finit maintenant.
  const [offset, setOffset] = useState(0)
  const [touch, setTouch] = useState(null)
  const [now] = useState(() => givenNow ?? new Date())

  useEffect(() => {
    let alive = true
    const end = viewEnd(period, now, offset)
    const load = () => loadWellbeingHistory({ period, now: end })
      .then((h) => { if (alive) setHistory(h && { ...h, offset, end: end.toISOString(), today: now.toISOString() }) })
      .catch(() => { if (alive) setHistory(null) })
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [period, now, offset])

  const empty = history && !history.points.length && !history.notes.length
  const canBack = Boolean(history?.earliest && history.from > history.earliest)
  const step = (delta) => {
    const next = offset + delta
    if (next < 0 || (delta > 0 && !canBack)) return
    setOffset(next)
    setSelected(null)
  }
  // Balayer la courbe vers la droite remonte le temps (comme on tourne une page vers le passé), vers la gauche revient.
  const onTouchEnd = (e) => {
    const t = e.changedTouches?.[0]
    if (!touch || !t) return
    const dx = t.clientX - touch.x
    const dy = t.clientY - touch.y
    setTouch(null)
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx > 0 ? 1 : -1)
  }
  const selectedPoint = history && selected ? history.points.find((p) => p.at === selected) : null
  return (
    <section className="wbh-page">
      {!embedded && <p className="wbh-back"><Link to="/">← Aujourd’hui</Link></p>}
      {!embedded && <h2 className="page-title">Historique du bien-être</h2>}

      {!embedded && <div className="wbh-tabs" role="group" aria-label="Période">
        {PERIOD_TABS.map((t) => (
          <button key={t.id} type="button" className={`wbh-tab${period === t.id ? ' is-on' : ''}`}
            aria-pressed={period === t.id} onClick={() => { setPeriod(t.id); setOffset(0); setSelected(null) }}>
            {t.label}
          </button>
        ))}
      </div>}

      {history === undefined && <div className="loading"><div className="spinner" aria-hidden /></div>}
      {history === null && <p className="today-card-text">L’historique n’a pas pu être lu.</p>}

      {history && (
        <div className="wbh-nav">
          <button type="button" className="wbh-step" aria-label={STEP_WORDS[period][0]} disabled={!canBack} onClick={() => step(1)}>
            <LineIcon name="chevron" size={20} className="wbh-step-back" />
          </button>
          <p className="wbh-nav-title">{periodTitle(period, history.offset, history.from, history.end, history.today)}</p>
          <button type="button" className="wbh-step" aria-label={STEP_WORDS[period][1]} disabled={offset === 0} onClick={() => step(-1)}>
            <LineIcon name="chevron" size={20} className="wbh-step-next" />
          </button>
        </div>
      )}

      {history && (
        <article className="today-card wbh-card"
          onTouchStart={(e) => { const t = e.touches?.[0]; if (t) setTouch({ x: t.clientX, y: t.clientY }) }}
          onTouchEnd={onTouchEnd}>
          <p className="wbh-figure">
            {history.mean != null ? (
              <>
                <span className="wbh-figure-note">{frDecimal(toDisplay(history.mean))}</span>
                <span className="wbh-figure-scale"> / 5 en moyenne</span>
              </>
            ) : (
              <span className="wbh-figure-scale">Pas encore d’estimation</span>
            )}
          </p>
          {!empty && <p className="wbh-figure-sub mono">
            {keepSegments([
              `${history.readings} ${history.readings > 1 ? 'lectures' : 'lecture'}`,
              history.period !== 'day' && `${history.days} ${history.days > 1 ? 'jours' : 'jour'}`,
              history.notes.length > 0 && `${history.notes.length} ${history.notes.length > 1 ? 'notes' : 'note'} à la main`,
            ])}
          </p>}
          {empty ? (
            <p className="today-card-text">
              Aucune lecture {periodWords(history)}. La lecture du visage se règle dans{' '}
              <Link to="/connectors">Sources</Link>.
            </p>
          ) : (
            <HistoryChart history={history} now={history.offset ? new Date(history.end) : now} selected={selected} onSelect={setSelected} />
          )}
          {!empty && !selected && history.points.length > 0 && (
            <p className="wbh-hint">Touchez un point pour voir sa lecture.</p>
          )}
          {!empty && <ul className="wbh-legend" aria-label="Légende">
            <li><span className={`wbh-key is-estimate${history.period === 'day' && history.trend?.length > 0 ? ' is-reading' : ''}`} aria-hidden="true" />estimé (visage){history.points.some((p) => p.hourly) && ', par heure'}</li>
            {history.period === 'day' && history.trend?.length > 0 && (
              <li><span className="wbh-key is-trend" aria-hidden="true" />tendance lissée</li>
            )}
            {history.notes.length > 0 && <li><span className="wbh-key is-note" aria-hidden="true" />noté à la main</li>}
            {history.period === 'day' && history.points.some((p) => Number.isFinite(p.low) && Number.isFinite(p.high)) && (
              <li><span className="wbh-key is-range" aria-hidden="true" />fourchette</li>
            )}
            {history.mean != null && history.points.length > 1 && (
              <li><span className="wbh-key is-mean" aria-hidden="true" />moyenne</li>
            )}
            {history.points.some((p) => p.few) && <li><span className="wbh-key is-few" aria-hidden="true" />peu de lectures</li>}
          </ul>}
          <button type="button" className="mood-manual" onClick={() => setNoteOpen(true)}>
            <LineIcon name="plus" size={16} />
            <span>{keepWhole('Noter moi-même')}</span>
          </button>
        </article>
      )}

      {selectedPoint && (
        <ReadingDetail point={selectedPoint} period={history.period} onClose={() => setSelected(null)} />
      )}

      {history && history.readings > 0 && (
        <article className="today-card wbh-models" aria-labelledby="wbh-models-title">
          <h3 id="wbh-models-title" className="today-card-title">Ce que lisent les modèles</h3>
          <p className="wbh-models-intro">
            Moyennes {periodWords(history)}. Ce sont des estimations de l’expression du visage, pas de ce que vous
            ressentez, ni un diagnostic.
          </p>
          {history.valence != null && (
            <BipolarBar label="Valence" value={history.valence} left="désagréable" right="agréable" />
          )}
          {history.arousal != null && (
            <BipolarBar label="Éveil" value={history.arousal} left="calme" right="animé" />
          )}
          <Reliability agreement={history.agreement} />
          {history.valence == null && history.arousal == null && (
            <p className="wbh-models-intro">Le modèle valence / éveil n’a pas encore lu ces lectures (il se télécharge une fois).</p>
          )}
          {history.expressions ? (
            <>
              <h4 className="wbh-subtitle">Expressions</h4>
              <HabitLine mix={history.expressions} />
              <ExpressionBars mix={history.expressions} />
              <p className="wbh-foot mono">
                {expressionsBase(history.expressions.readings, history.readings)}
                {history.expressions.habitDays ? ` · trait : votre habitude sur ${history.expressions.habitDays} jours` : ''}
              </p>
              <p className="wbh-foot">
                Un visage au repos peut être lu un peu triste ou méprisant : l’écart à votre habitude dit mieux ce
                qui change.
              </p>
            </>
          ) : (
            <p className="wbh-foot">Les expressions (joie, neutre, surprise…) apparaîtront avec les prochaines lectures.</p>
          )}
          <p className="wbh-foot">
            Deux modèles embarqués{faceModelTag(features)}, sur le téléphone. Seuls ces nombres sont gardés, aucune image.
          </p>
        </article>
      )}

      <WellbeingPrompt open={noteOpen} onClose={() => setNoteOpen(false)} />
    </section>
  )
}
