/**
 * Visualiseur de Journal › Tendances (ORG-3, ORG-3c, revue design du 07/11). Dans une seule carte : les mesures
 * choisies (puces avec leur point de couleur, « + » pour en ajouter), un sélecteur compact Jour / Semaine / Mois, la
 * courbe. Chaque jour : une ligne et sa fourchette, un point plein seulement les jours notés, repère « auj. » ;
 * l'attendu d'après vos habitudes ne prolonge que le futur, en pointillés (le pointillé ne sert qu'à ça). Toucher un
 * jour ouvre son détail ; un jour futur montre l'attendu et sa fourchette, jamais un « attendu » sur le passé.
 */
import { useMemo, useState } from 'react'
import { buildTrendSeries, canAdd, changeMarks, detailSource, trendMeasure, unitsOf } from '../services/trendsData'
import { appLocale } from '../i18n/locale.js'
import { niceAxis } from '../services/niceAxis'
import LineIcon from './LineIcon'
import TrendsDayDetail from './TrendsDayDetail'

const W = 340
const H = 190
const PAD = { l: 30, r: 30, t: 14, b: 26 }

const shortDay = (k) => {
  const d = new Date(`${k}T12:00:00`)
  return d.toLocaleDateString(appLocale(), { day: 'numeric', month: 'numeric' })
}
const longDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Domaine et graduations d'une unité : 1 à 5 pour les notes, sinon les valeurs visibles avec une petite marge,
 * étendues à des graduations rondes (POLISH-SIM-3b : « 4 000 / 8 000 / 12 000 » plutôt que « 4 651 / 11 759 »).
 */
function domainOf(unit, values) {
  if (unit === '/5') return { lo: 1, hi: 5, ticks: [1, 3, 5] }
  if (!values.length) return { lo: 0, hi: 1, ticks: [0, 1] }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo) * 0.05
  return niceAxis(Math.max(0, lo - pad), hi + pad)
}

function Chart({ data, keys, selected, onSelect, marks = [] }) {
  const { dates, today, series } = data
  const units = unitsOf(keys)
  const x = (date) => PAD.l + (dates.indexOf(date) / Math.max(1, dates.length - 1)) * (W - PAD.l - PAD.r)
  const yOf = {}
  for (const u of units) {
    const vals = keys.filter((k) => trendMeasure(k).unit === u).flatMap((k) => series[k].flatMap((p) => [p.value, p.low, p.high])).filter(Number.isFinite)
    const { lo, hi, ticks } = domainOf(u, vals)
    yOf[u] = { lo, hi, ticks, y: (v) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b) }
  }
  const step = dates.length > 14 ? 7 : 1
  const colW = (W - PAD.l - PAD.r) / Math.max(1, dates.length - 1)
  const fmtAxis = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: 1 })
  // POLISH-SIM-3 : avec deux axes, chacun prend la couleur de sa courbe (si une seule couleur porte cette unité).
  const axisTone = (u) => {
    if (units.length < 2) return undefined
    const tones = [...new Set(keys.filter((k) => trendMeasure(k).unit === u).map((k) => trendMeasure(k).tone))]
    return tones.length === 1 ? tones[0] : undefined
  }
  return (
    <svg className="trends-chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Courbe de ${keys.map((k) => trendMeasure(k).label).join(', ')}`}>
      {units.map((u, i) => {
        const s = yOf[u]
        const { ticks } = s
        const ax = i === 0 ? PAD.l - 6 : W - PAD.r + 6
        const anchor = i === 0 ? 'end' : 'start'
        const tone = axisTone(u)
        return [
          <text key={`${u}-unit`} className="trends-axis trends-axis-unit" data-tone={tone} x={ax} y={PAD.t - 6}
            textAnchor={anchor}>{u}</text>,
          ...ticks.map((t) => (
            <text key={`${u}-${t}`} className="trends-axis mono" data-tone={tone} x={ax} y={s.y(t) + 3}
              textAnchor={anchor}>{fmtAxis(t)}</text>
          )),
        ]
      })}
      {units.length > 0 && (() => {
        const t0 = yOf[units[0]].ticks
        const mid = t0[Math.floor(t0.length / 2)]
        return <line className="trends-grid" x1={PAD.l} x2={W - PAD.r} y1={yOf[units[0]].y(mid)} y2={yOf[units[0]].y(mid)} />
      })()}
      {dates.includes(today) && (
        <g className="trends-today">
          <line x1={x(today)} x2={x(today)} y1={PAD.t - 4} y2={H - PAD.b} />
          <text x={x(today)} y={H - 6} textAnchor="middle">auj.</text>
        </g>
      )}
      {/* POLISH-SIM-13 : la partie pointillée dit ce qu'elle est, une fois, au-dessus du futur (seulement s'il est tracé). */}
      {dates.includes(today) && keys.some((k) => series[k].some((p) => p.date > today)) && (
        <text className="trends-future-label" x={(x(today) + x(dates[dates.length - 1])) / 2} y={PAD.t - 6}
          textAnchor="middle">attendu</text>
      )}
      {dates.map((d, i) => (i % step === 0 && Math.abs(i - dates.indexOf(today)) >= Math.max(1, Math.ceil(step / 2)) ? (
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
      {marks.map((c) => (
        <g key={`${c.key}-${c.date}`} className="trends-change" data-tone={c.tone}>
          <line x1={x(c.date)} x2={x(c.date)} y1={PAD.t} y2={H - PAD.b} />
          <path d={`M${x(c.date) - 5},${PAD.t - 8}h10l-5,7z`} />
        </g>
      ))}
      {selected && <line className="trends-selected" x1={x(selected)} x2={x(selected)} y1={PAD.t - 4} y2={H - PAD.b} />}
      {dates.map((d) => (
        <rect key={d} className="trends-hit" x={x(d) - colW / 2} y={0} width={colW} height={H}
          role="button" tabIndex={-1} aria-label={longDay(d)} onClick={() => onSelect(selected === d ? null : d)} />
      ))}
    </svg>
  )
}

/**
 * Vue Jour (correction T2, maquette « Agir et Tendances ») : le bien-être seul, chaque lecture du visage en point à son
 * heure, reliées par un trait fin ; la note en losange ; aujourd'hui, l'après « maintenant » grisé. Ni moyenne, ni
 * fourchette par lecture, ni attendu (le pointillé ne sert qu'au futur).
 */
function DayChart({ date, view }) {
  const { readings, note, nowHour } = view
  const first = Math.min(6, ...readings.map((r) => Math.floor(r.hour)), note ? Math.floor(note.hour) : 6)
  const x = (h) => PAD.l + ((h - first) / (24 - first)) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - (v - 1) / 4) * (H - PAD.t - PAD.b)
  const ticks = [first, 12, 18, 24].filter((h, i, a) => a.indexOf(h) === i && (h === first || h - first >= 3))
  const line = readings.length > 1 ? `M${readings.map((r) => `${x(r.hour).toFixed(1)},${y(r.value).toFixed(1)}`).join('L')}` : null
  return (
    <>
      <svg className="trends-chart trends-daychart" viewBox={`0 0 ${W} ${H}`} role="img" data-tone="mint"
        aria-label={`Bien-être du ${longDay(date)}, heure par heure`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line className="trends-grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
            <text className="trends-axis mono" x={PAD.l - 6} y={y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {ticks.map((h) => (
          <text key={h} className="trends-axis" x={x(h)} y={H - 6} textAnchor="middle">{`${h} h`}</text>
        ))}
        {nowHour != null && nowHour > first && nowHour < 24 && (
          <g className="trends-after-now">
            <rect x={x(Math.max(first, nowHour))} y={PAD.t} width={x(24) - x(Math.max(first, nowHour))} height={H - PAD.t - PAD.b} />
            <text x={x(Math.max(first, nowHour)) + 4} y={PAD.t + 10}>maintenant</text>
          </g>
        )}
        <g className="trends-series" data-tone="mint">
          {line && <path className="trends-reading-line" d={line} />}
          {readings.map((r) => <circle key={r.at} className="trends-reading" cx={x(r.hour)} cy={y(r.value)} r={4} />)}
          {note && (
            <rect className="trends-note" x={x(note.hour) - 5} y={y(note.value) - 5} width={10} height={10}
              transform={`rotate(45 ${x(note.hour)} ${y(note.value)})`} />
          )}
        </g>
        {!readings.length && !note && (
          <text className="trends-day-none" x={(PAD.l + W - PAD.r) / 2} y={H / 2} textAnchor="middle">Aucune lecture du visage ce jour-là</text>
        )}
      </svg>
      {(readings.length > 0 || note) && (
        <ul className="trends-legend" aria-label="Légende" data-tone="mint">
          {readings.length > 0 && <li><span className="trends-legend-dot" aria-hidden="true" />une lecture du visage</li>}
          {note && <li><span className="trends-legend-note" aria-hidden="true" />votre note</li>}
        </ul>
      )}
    </>
  )
}

const capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const prevDay = (k) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() - 1); return keyOfDate(d) }
const nextDay = (k) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() + 1); return keyOfDate(d) }
function keyOfDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function DayDetail({ data, keys, date, onClose = null, extra = null, marks = [], titled = true }) {
  const future = date > data.today
  const face = !future ? extra?.face ?? null : null
  return (
    <div className="trends-detail" role="group" aria-label={`Détail du ${longDay(date)}`}>
      {titled && <div className="trends-detail-head">
        <p className="trends-detail-title">{longDay(date)}</p>
        {onClose && (
          <button type="button" className="trends-detail-close" aria-label="Fermer" onClick={onClose}>
            <LineIcon name="close" size={18} />
          </button>
        )}
      </div>}
      {future && <p className="trends-detail-note">D’après vos habitudes</p>}
      {face && face.readings > 0 && (
        <p className="trends-detail-note">
          {face.readings > 0 && `${face.readings} ${face.readings > 1 ? 'lectures' : 'lecture'} du visage`}
        </p>
      )}
      <ul className="trends-detail-list">
        {keys.map((k) => {
          const m = trendMeasure(k)
          const p = data.series[k].find((q) => q.date === date)
          if (!p) return null
          return (
            <li key={k} data-tone={m.tone}>
              <span className="trends-chip-dot" aria-hidden="true" />
              <span className="trends-detail-label">{m.label}</span>
              {m.unit === '/5' ? (
                // T3-c : le chiffre en mono, « /5 » en petit texte normal (pas de grand espace de la police mono)
                <span className="trends-detail-value"><span className="mono">{m.fmt(p.value).replace(/\s\/5$/, '')}</span><span className="trends-detail-unit">/5</span></span>
              ) : <span className="trends-detail-value mono">{m.fmt(p.value)}</span>}
              {future && Number.isFinite(p.low) && (
                <span className="trends-detail-range mono">{m.fmt(p.low)} à {m.fmt(p.high)}</span>
              )}
              {!future && m.state && (
                <span className="trends-detail-range">
                  {/* T3, POLISH-SIM-4 : la note dit son chiffre ici seulement, avec ce qui s'y mêle */}
                  {detailSource(k, { value: p.value, note: face?.note ?? null, readings: face?.readings ?? 0, gut: face?.gut ?? null, observed: p.observed })}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {marks.filter((c) => c.date === date).map((c) => (
        <div key={c.key} className="trends-change-detail" data-tone={c.tone}>
          <p className="trends-detail-title">Changement durable : {c.label.toLowerCase()}</p>
          <p className="trends-detail-note">Niveau avant <span className="mono">{c.before}</span>, après <span className="mono">{c.after}</span></p>
          {c.sameTime.length > 0 && <p className="trends-detail-note">Au même moment : {c.sameTime.join(', ').toLowerCase()}</p>}
        </div>
      ))}
      {!future && extra && <TrendsDayDetail face={keys.includes('wellbeing') ? face : null} contributions={extra.contributions} />}
    </div>
  )
}

/**
 * @param {{ states: object | null, days: object[], now?: Date, initialKeys?: string[],
 *   period: 'day'|'week'|'month', onPeriod: (p: string) => void }} props
 * `dayExtra(date, keys)` : ce qu'on sait d'un jour passé au-delà des courbes (visage, contributions), ou null.
 * `dayReadings(date)` : les lectures et la note du jour pour la vue Jour (dayReadingsView).
 * `initialDay` : jour ouvert par défaut en vue Jour (latestReadingDay).
 */
export default function TrendsViewer({
  states, days, now, initialKeys = ['wellbeing'], period, onPeriod, dayReadings = null, dayExtra = null, changes = null,
  initialDay = null,
}) {
  const [keys, setKeys] = useState(initialKeys)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [dayDate, setDayDate] = useState(null)
  // Vue Jour : la fiche du jour reprend les valeurs du mois (on peut remonter jusqu'à 30 jours)
  const data = useMemo(
    () => buildTrendSeries({ states, days, period: period === 'day' ? 'month' : period, now: now || new Date() }),
    [states, days, period, now],
  )
  const shown = keys.filter((k) => data.available.includes(k))
  const addable = data.available.filter((k) => canAdd(shown, k))
  const isDay = period === 'day'
  // Jour affiché : celui touché en Semaine ou Mois s'il n'est pas futur, sinon le dernier jour qui a une lecture ou
  // une note (aujourd'hui dès sa première lecture ; T3), sinon aujourd'hui
  const day = dayDate ?? (initialDay && initialDay <= data.today ? initialDay : data.today)
  // En Jour, seul le bien-être a un détail heure par heure : les autres mesures sont grisées dans « + »
  const dayAddable = data.available.filter((k) => k !== 'wellbeing')
  const choosePeriod = (id) => {
    if (id === 'day') setDayDate(selected && selected <= data.today ? selected : null)
    onPeriod(id)
    setSelected(null)
    setAdding(false)
  }
  // TS-2 : repères « changement » en vue Mois
  const marks = period === 'month' ? changeMarks(changes, shown, data.dates) : []
  // Revue du 09/11 : historique vierge (aucune courbe, aucune lecture ni note) → le message seul, sans Jour / Semaine /
  // Mois qui ne montreraient rien
  if (!data.available.length && !initialDay) {
    return (
      <article className="today-card trends-card">
        <p className="trends-empty">Vos courbes apparaîtront après 3 jours de mesures.</p>
      </article>
    )
  }
  return (
    <article className="today-card trends-card">
      <div className="trends-controls">
        <ul className="trends-chips" aria-label="Mesures affichées">
          {(isDay ? ['wellbeing'] : shown).map((k) => {
            const m = trendMeasure(k)
            return (
              <li key={k} className="trends-chip" data-tone={m.tone}>
                <span className="trends-chip-dot" aria-hidden="true" />
                {m.label}
                {!isDay && shown.length > 1 && (
                  <button type="button" className="trends-chip-remove" aria-label={`Retirer ${m.label}`}
                    onClick={() => setKeys(keys.filter((x) => x !== k))}>
                    <LineIcon name="close" size={12} />
                  </button>
                )}
              </li>
            )
          })}
          {(isDay ? dayAddable.length > 0 : addable.length > 0 && shown.length > 0) && (
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
              onClick={() => choosePeriod(id)}><span>{label}</span></button>
          ))}
        </div>
      </div>
      {adding && isDay && (
        <>
        <p className="trends-add-caption">Une valeur par jour, en Semaine</p>
        <ul className="trends-add-menu" aria-label="Mesures à ajouter">
          {dayAddable.map((k) => {
            const m = trendMeasure(k)
            return (
              <li key={k}>
                <button type="button" className="trends-chip is-daily" data-tone={m.tone}
                  onClick={() => { setKeys(shown.includes(k) ? shown : canAdd(shown, k) ? [...shown, k] : [k]); choosePeriod('week') }}>
                  <span className="trends-chip-dot" aria-hidden="true" />{m.label}
                </button>
              </li>
            )
          })}
        </ul>
        </>
      )}
      {adding && !isDay && (
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
      {isDay ? (
        <>
          <div className="trends-daynav">
            <button type="button" className="trends-daynav-btn is-prev" aria-label="Jour précédent" onClick={() => setDayDate(prevDay(day))}>
              <LineIcon name="chevron" size={18} />
            </button>
            <p className="trends-daynav-title">{day === data.today ? 'Aujourd’hui' : capFirst(longDay(day))}</p>
            <button type="button" className="trends-daynav-btn is-next" aria-label="Jour suivant" disabled={day >= data.today}
              onClick={() => setDayDate(nextDay(day))}>
              <LineIcon name="chevron" size={18} />
            </button>
          </div>
          <DayChart date={day} view={dayReadings ? dayReadings(day) : { readings: [], note: null, nowHour: null }} />
          <DayDetail data={data} keys={shown.length ? shown : ['wellbeing']} date={day} titled={false}
            extra={dayExtra?.(day, shown.length ? shown : ['wellbeing']) ?? null} />
        </>
      ) : shown.length ? (
        <>
          <Chart data={data} keys={shown} selected={selected} onSelect={setSelected} marks={marks} />
          {selected
            ? <DayDetail data={data} keys={shown} date={selected} onClose={() => setSelected(null)} extra={dayExtra?.(selected, shown) ?? null} marks={marks} />
            : <p className="trends-hint">Touchez un jour pour son détail.</p>}
          {shown.some((k) => trendMeasure(k).gloss) && (
            // POLISH-SIM-6 : une abréviation dit son nom en toutes lettres une fois, ici
            <ul className="trends-gloss">
              {shown.map(trendMeasure).filter((m) => m.gloss).map((m) => (
                <li key={m.key}><span className="trends-gloss-term">{m.label}</span> : {m.gloss}</li>
              ))}
            </ul>
          )}
        </>
      ) : data.available.length ? (
        // T1 : aucune mesure choisie → les courbes disponibles en grandes puces, bien visibles
        <div className="trends-pick">
          <p className="trends-pick-title">Choisissez une courbe</p>
          <ul className="trends-pick-list" aria-label="Courbes disponibles">
            {data.available.map((k) => {
              const m = trendMeasure(k)
              return (
                <li key={k}>
                  <button type="button" className="trends-chip trends-pick-chip" data-tone={m.tone} onClick={() => setKeys([k])}>
                    <span className="trends-chip-dot" aria-hidden="true" />{m.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="trends-empty">Vos courbes apparaîtront après 3 jours de mesures.</p>
      )}
    </article>
  )
}

