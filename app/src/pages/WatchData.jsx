/**
 * « Données de la montre » (M5, signalement du 21/10) : pour chaque donnée que la montre Huawei peut rendre, la
 * dernière valeur reçue, sa date, le nombre d'échantillons des 7 derniers jours et l'issue de la dernière lecture.
 * Le propriétaire voit d'un coup d'œil ce qui remonte. Calcul dans src/devices/huawei/coverage.js.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { COVERAGE_DAYS, COVERAGE_LOOKBACK_DAYS, coverageSummary, watchCoverage } from '../devices/huawei/coverage'
import { WATCH_SOURCE } from '../devices/huawei/sync'
import { getWatchAutoSyncState } from '../services/watchAutoSync'
import { formatAt } from '../utils/format'
import { formatAgo } from '../utils/timeAgo'
import '../Food.css'
import './WatchData.css'

const STATUS_LABELS = { ok: 'reçu', stale: 'ancien', none: 'rien', planned: 'à venir' }

async function defaultLoad(now) {
  const since = new Date(now - COVERAGE_LOOKBACK_DAYS * 86_400_000).toISOString()
  return listEntries({ source: WATCH_SOURCE, since, limit: Infinity })
}

const clock = () => Date.now()

export default function WatchData({ load = defaultLoad, now = clock }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [state] = useState(() => getWatchAutoSyncState())

  useEffect(() => {
    let alive = true
    const t = now()
    load(t)
      .then((entries) => alive && setRows(watchCoverage(entries, { now: t, reads: state.reads || null })))
      .catch((e) => alive && setError(e?.message || String(e)))
    return () => {
      alive = false
    }
  }, [load, now, state])

  // sans montre ni mesure : une phrase et un bouton plutôt que 12 lignes « rien » (VC-6)
  const hasWatch = Boolean(state.everConnected || state.readsAt) || Boolean(rows?.some((r) => r.last))
  // sans lecture détaillée mais avec des mesures (synchro de base) : leur date plutôt qu'un « synchronisez » trompeur
  const lastAt = rows?.reduce((max, r) => (r.last && (!max || r.last.at > max) ? r.last.at : max), null)
  const syncLine = state.readsAt
    ? `Dernière lecture par l’app : ${formatAgo(state.readsAt, new Date(now()))}.`
    : lastAt
      ? `Dernière mesure reçue : ${formatAgo(lastAt, new Date(now()))}.`
      : 'Pas encore de lecture détaillée : synchronisez la montre depuis Sources.'

  return (
    <section className="food-page watch-data-page">
      <p className="watch-data-back">
        <Link to="/connectors">← Sources</Link>
      </p>
      <h2 className="page-title">Données de la montre</h2>
      <p className="page-intro">
        Ce qui remonte de votre montre (compatible avec les montres Huawei), type par type : la dernière valeur, sa date et le nombre
        de mesures des {COVERAGE_DAYS} derniers jours.
      </p>
      {hasWatch && (
        <p className="watch-data-sync">{rows ? syncLine : null}</p>
      )}
      {error && <p className="hint">Lecture impossible : {error}</p>}
      {!rows && !error && <p className="hint">Chargement…</p>}
      {rows && !hasWatch && (
        <div className="watch-data-none">
          <p>Aucune montre connectée pour l’instant. Une fois votre montre connectée, vous verrez ici ce qu’elle envoie, type par type.</p>
          <Link to="/connectors" className="btn btn-primary">
            Connecter une montre
          </Link>
        </div>
      )}
      {rows && hasWatch && (
        <>
          <p className="watch-data-summary">{coverageSummary(rows)}</p>
          <ul className="watch-data-list" aria-label="Données de la montre">
            {rows.map((r) => (
              <li key={r.id} className={`watch-data-row watch-data-row--${r.status}`}>
                <div className="watch-data-head">
                  <span className="watch-data-label">{r.label}</span>
                  <span className="watch-data-tag">{STATUS_LABELS[r.status]}</span>
                </div>
                {r.last ? (
                  <p className="watch-data-value">
                    <strong>{r.last.value}</strong> <span className="watch-data-date">· {formatAt(r.last.at)}</span>
                  </p>
                ) : (
                  <p className="watch-data-empty">
                    {r.status === 'planned' ? 'Pas encore lu par l’app : prévu dans une prochaine version.' : `Rien reçu depuis ${COVERAGE_LOOKBACK_DAYS} jours.`}
                  </p>
                )}
                {(r.last || r.read) && (
                  <p className="watch-data-meta">
                    {[r.last && `${r.count} ${r.unit} sur ${COVERAGE_DAYS} j`, r.read && `dernière lecture : ${r.read.label}`].filter(Boolean).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="hint">
            Un type « rien » alors que la montre le mesure ? Vérifiez sur la montre que la mesure est activée (TruSleep pour le sommeil,
            température de la peau, stress automatique), synchronisez, puis envoyez une capture de cette page.
          </p>
        </>
      )}
    </section>
  )
}
