/**
 * Visualiseur de Journal › Tendances (ORG-3, ORG-3c, revue design du 07/11). Dans une seule carte : les mesures
 * choisies (puces avec leur point de couleur, « + » pour en ajouter), un sélecteur compact Jour / Semaine / Mois, la
 * courbe. Chaque jour : une ligne et sa fourchette, un point plein seulement les jours notés, repère « auj. » ;
 * l'attendu d'après vos habitudes ne prolonge que le futur, en pointillés (le pointillé ne sert qu'à ça). Toucher un
 * jour ouvre son détail ; un jour futur montre l'attendu et sa fourchette, jamais un « attendu » sur le passé.
 */
import { useMemo, useState } from 'react'
import { buildTrendSeries, canAdd, trendMeasure, unitsOf } from '../services/trendsData'
import { appLocale } from '../i18n/locale.js'
import LineIcon from './LineIcon'

const W = 340
const H = 190
const PAD = { l: 30, r: 30, t: 14, b: 26 }

const shortDay = (k) => {
  const d = new Date(`${k}T12:00:00`)
  return d.toLocaleDateString(appLocale(), { day: 'numeric', month: 'numeric' })
}
const longDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

/** Domaine d'une unité : 1 à 5 pour les notes, sinon les valeurs visibles avec une marge. */
function domainOf(unit, values) {
  if (unit === '/5') return [1, 5]
  if (!values.length) return [0, 1]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.15
  return [Math.max(0, lo - pad), hi + pad]
}

function Chart({ data, keys, selected, onSelect }) {
  const { dates, today, series } = data
  const units = unitsOf(keys)
  const x = (date) => PAD.l + (dates.indexOf(date) / Math.max(1, dates.length - 1)) * (W - PAD.l - PAD.r)
  const yOf = {}
  for (const u of units) {
    const vals = keys.filter((k) => trendMeasure(k).unit === u).flatMap((k) => series[k].flatMap((p) => [p.value, p.low, p.high])).filter(Number.isFinite)
    const [lo, hi] = domainOf(u, vals)
    yOf[u] = { lo, hi, y: (v) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b) }
  }
  const step = dates.length > 14 ? 7 : 1
  const colW = (W - PAD.l - PAD.r) / Math.max(1, dates.length - 1)
  const fmtAxis = (u, v) => (u === '/5' ? String(Math.round(v)) : Math.round(v).toLocaleString(appLocale()))
  return (
    <svg className="trends-chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Courbe de ${keys.map((k) => trendMeasure(k).label).join(', ')}`}>
      {units.map((u, i) => {
        const s = yOf[u]
        const ticks = u === '/5' ? [1, 3, 5] : [s.lo, (s.lo + s.hi) / 2, s.hi]
        return ticks.map((t) => (
          <text key={`${u}-${t}`} className="trends-axis mono" x={i === 0 ? PAD.l - 6 : W - PAD.r + 6} y={s.y(t) + 3}
            textAnchor={i === 0 ? 'end' : 'start'}>{fmtAxis(u, t)}</text>
        ))
      })}
      {units.length && <line className="trends-grid" x1={PAD.l} x2={W - PAD.r} y1={yOf[units[0]].y(units[0] === '/5' ? 3 : (yOf[units[0]].lo + yOf[units[0]].hi) / 2)} y2={yOf[units[0]].y(units[0] === '/5' ? 3 : (yOf[units[0]].lo + yOf[units[0]].hi) / 2)} />}
      {dates.includes(today) && (
        <g className="trends-today">
          <line x1={x(today)} x2={x(today)} y1={PAD.t - 4} y2={H - PAD.b} />
          <text x={x(today)} y={H - 6} textAnchor="middle">auj.</text>
        </g>
      )}
      {dates.map((d, i) => (i % step === 0 && d !== today ? (
        <text key={d} className="trends-axis mono" x={x(d)} y={H - 6} textAnchor="middle">{shortDay(d)}</text>
      ) : null))}
      {keys.map((k) => {
        const m = trendMeasure(k)
        const y = yOf[m.unit].y
        const pts = series[k]
        const past = pts.filter((p) => !p.future)
        const future = pts.filter((p) => p.future)
        const banded = pts.filter((p) => Number.isFinite(p.low) && Number.isFinite(p.high))
        const area = (list) => (list.length > 1
          ? `M${list.map((p) => `${x(p.date).toFixed(1)},${y(p.high).toFixed(1)}`).join('L')}L${[...list].reverse().map((p) => `${x(p.date).toFixed(1)},${y(p.low).toFixed(1)}`).join('L')}Z`
          : null)
        const line = (list) => (list.length > 1 ? `M${list.map((p) => `${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join('L')}` : null)
        const lastPast = past[past.length - 1]
        const futureLine = future.length ? line([lastPast, ...future].filter(Boolean)) : null
        const futureBand = future.length ? area([lastPast, ...future].filter((p) => p && Number.isFinite(p.low))) : null
        return (
          <g key={k} className="trends-series" data-tone={m.tone}>
            {area(banded.filter((p) => !p.future)) && <path className="trends-band" d={area(banded.filter((p) => !p.future))} />}
            {futureBand && <path className="trends-band is-future" d={futureBand} />}
            {line(past) && <path className="trends-line" d={line(past)} />}
            {futureLine && <path className="trends-line is-future" d={futureLine} />}
            {past.map((p) => (
              <circle key={p.date} className={`trends-dot${p.observed ? ' is-full' : ''}`} cx={x(p.date)} cy={y(p.value)}
                r={selected === p.date ? 5 : 3.2} />
            ))}
          </g>
        )
      })}
      {selected && <line className="trends-selected" x1={x(selected)} x2={x(selected)} y1={PAD.t - 4} y2={H - PAD.b} />}
      {dates.map((d) => (
        <rect key={d} className="trends-hit" x={x(d) - colW / 2} y={0} width={colW} height={H}
          role="button" tabIndex={-1} aria-label={longDay(d)} onClick={() => onSelect(selected === d ? null : d)} />
      ))}
    </svg>
  )
}

function DayDetail({ data, keys, date, onClose }) {
  const future = date > data.today
  return (
    <div className="trends-detail" role="group" aria-label={`Détail du ${longDay(date)}`}>
      <div className="trends-detail-head">
        <p className="trends-detail-title">{longDay(date)}</p>
        <button type="button" className="trends-detail-close" aria-label="Fermer" onClick={onClose}>
          <LineIcon name="close" size={18} />
        </button>
      </div>
      {future && <p className="trends-detail-note">D’après vos habitudes</p>}
      <ul className="trends-detail-list">
        {keys.map((k) => {
          const m = trendMeasure(k)
          const p = data.series[k].find((q) => q.date === date)
          if (!p) return null
          return (
            <li key={k} data-tone={m.tone}>
              <span className="trends-chip-dot" aria-hidden="true" />
              <span className="trends-detail-label">{m.label}</span>
              <span className="trends-detail-value mono">{m.fmt(p.value)}</span>
              {future && Number.isFinite(p.low) && (
                <span className="trends-detail-range mono">{m.fmt(p.low)} à {m.fmt(p.high)}</span>
              )}
              {!future && m.state && <span className="trends-detail-range">{p.observed ? 'noté' : 'estimé'}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * @param {{ states: object | null, days: object[], now?: Date, initialKeys?: string[],
 *   period: 'week'|'month', onPeriod: (p: string) => void, dayView?: import('react').ReactNode }} props
 */
export default function TrendsViewer({ states, days, now, initialKeys = ['wellbeing'], period, onPeriod, dayView = null }) {
  const [keys, setKeys] = useState(initialKeys)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const data = useMemo(
    () => buildTrendSeries({ states, days, period: period === 'day' ? 'week' : period, now: now || new Date() }),
    [states, days, period, now],
  )
  const shown = keys.filter((k) => data.available.includes(k))
  const addable = data.available.filter((k) => canAdd(shown, k))
  return (
    <article className="today-card trends-card">
      <div className="trends-controls">
        <ul className="trends-chips" aria-label="Mesures affichées">
          {shown.map((k) => {
            const m = trendMeasure(k)
            return (
              <li key={k} className="trends-chip" data-tone={m.tone}>
                <span className="trends-chip-dot" aria-hidden="true" />
                {m.label}
                {shown.length > 1 && (
                  <button type="button" className="trends-chip-remove" aria-label={`Retirer ${m.label}`}
                    onClick={() => setKeys(keys.filter((x) => x !== k))}>
                    <LineIcon name="close" size={12} />
                  </button>
                )}
              </li>
            )
          })}
          {addable.length > 0 && period !== 'day' && (
            <li>
              <button type="button" className="trends-add" aria-label="Ajouter une mesure" aria-expanded={adding}
                onClick={() => setAdding(!adding)}>
                <LineIcon name="plus" size={14} />
              </button>
            </li>
          )}
        </ul>
        <div className="trends-periods" role="group" aria-label="Période">
          {[['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']].map(([id, label]) => (
            <button key={id} type="button" className={`trends-period${period === id ? ' is-on' : ''}`} aria-pressed={period === id}
              onClick={() => { onPeriod(id); setSelected(null) }}><span>{label}</span></button>
          ))}
        </div>
      </div>
      {adding && period !== 'day' && (
        <ul className="trends-add-menu" aria-label="Mesures à ajouter">
          {addable.map((k) => {
            const m = trendMeasure(k)
            return (
              <li key={k}>
                <button type="button" className="trends-chip" data-tone={m.tone}
                  onClick={() => { setKeys([...shown, k]); setAdding(false) }}>
                  <span className="trends-chip-dot" aria-hidden="true" />{m.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {period === 'day' ? dayView : shown.length ? (
        <>
          <Chart data={data} keys={shown} selected={selected} onSelect={setSelected} />
          {selected
            ? <DayDetail data={data} keys={shown} date={selected} onClose={() => setSelected(null)} />
            : <p className="trends-hint">Touchez un jour pour son détail.</p>}
        </>
      ) : (
        <p className="trends-empty">
          {data.available.length
            ? 'Choisissez une mesure avec « + ».'
            : 'Vos courbes apparaîtront après 3 jours de mesures.'}
        </p>
      )}
    </article>
  )
}

