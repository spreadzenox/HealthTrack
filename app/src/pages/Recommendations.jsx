import { useState, useEffect, useMemo } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import {
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  countTotalDataDays,
  MIN_DAYS_BASIC,
  MIN_DAYS_ADVANCED,
} from '../services/analysisEngine'
import { useAutoSync } from '../hooks/useAutoSync'
import './Recommendations.css'

// ─── Correlation bar chart (SVG) ─────────────────────────────────────────────

function CorrelationBar({ label, r, impact }) {
  const pct = Math.round(Math.abs(impact) * 100)
  // Green = positive correlation with wellbeing, red = negative correlation.
  const isPositive = r >= 0
  return (
    <div className="reco-corr-row">
      <span className="reco-corr-label">{label}</span>
      <div className="reco-corr-bar-wrap">
        <div
          className={'reco-corr-bar ' + (isPositive ? 'reco-corr-pos' : 'reco-corr-neg')}
          style={{ width: `${pct}%` }}
          aria-label={`${pct}%`}
        />
      </div>
      <span className="reco-corr-value">{r >= 0 ? '+' : ''}{r.toFixed(2)}</span>
    </div>
  )
}

// ─── Importance bar (ML tab) ──────────────────────────────────────────────────

function ImportanceBar({ label, importance, direction }) {
  const pct = Math.round(importance * 100)
  return (
    <div className="reco-corr-row">
      <span className="reco-corr-label">{label}</span>
      <div className="reco-corr-bar-wrap">
        <div
          className={'reco-corr-bar ' + (direction === 'positive' ? 'reco-corr-pos' : 'reco-corr-neg')}
          style={{ width: `${Math.min(pct, 100)}%` }}
          aria-label={`${pct}%`}
        />
      </div>
      <span className="reco-corr-value">
        {direction === 'positive' ? '▲' : '▼'} {Math.min(pct, 100)}%
      </span>
    </div>
  )
}

// ─── Advice card ─────────────────────────────────────────────────────────────

function AdviceCard({ rank, advice, impact }) {
  return (
    <li className="reco-advice-card">
      <span className="reco-advice-rank">{rank}</span>
      <div className="reco-advice-content">
        <p className="reco-advice-text">{advice}</p>
        {impact !== undefined && (
          <p className="reco-advice-impact">
            Impact estimé : <strong>{Math.round(impact * 100)}%</strong> de corrélation
          </p>
        )}
      </div>
    </li>
  )
}

// ─── Not enough data placeholder ─────────────────────────────────────────────

function NotEnoughData({ currentDays, minDays, tabLabel }) {
  const remaining = minDays - currentDays
  return (
    <div className="reco-not-enough">
      <div className="reco-not-enough-icon" aria-hidden>📊</div>
      <p className="reco-not-enough-title">
        Données insuffisantes pour les {tabLabel}
      </p>
      <p className="reco-not-enough-hint">
        {currentDays === 0
          ? `Enregistrez votre bien-être chaque jour pour activer cette fonctionnalité (les données alimentaires ou de sommeil seules ne suffisent pas).`
          : `Il manque encore ${remaining} jour${remaining > 1 ? 's' : ''} avec un score bien-être (vous en avez ${currentDays}). Pensez à enregistrer votre bien-être quotidiennement.`}
      </p>
      <p className="reco-not-enough-min">
        Seuil minimum : <strong>{minDays} jours</strong> avec score bien-être
      </p>
    </div>
  )
}

// ─── Basic tab ────────────────────────────────────────────────────────────────

function BasicTab({ entries }) {
  const result = useMemo(() => computeBasicCorrelations(entries), [entries])
  const totalDays = useMemo(() => countTotalDataDays(entries), [entries])

  if (result.status === 'not_enough_data') {
    return (
      <NotEnoughData
        currentDays={result.currentDays}
        minDays={result.minDays}
        tabLabel="recommandations basiques"
      />
    )
  }

  const { datasetDays, correlations, topNegativeFactors } = result

  return (
    <div className="reco-tab-content">
      <p className="reco-meta">
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} avec score bien-être</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}.
        Méthode : corrélation de Pearson entre chaque variable et le bien-être.
      </p>

      {topNegativeFactors.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            🎯 Top 3 — facteurs à améliorer en priorité
          </h3>
          <p className="reco-section-hint">
            Ces variables sont statistiquement les plus liées à une baisse de votre bien-être.
          </p>
          <ol className="reco-advice-list">
            {topNegativeFactors.map((f, i) => (
              <AdviceCard
                key={f.variable}
                rank={i + 1}
                advice={f.advice}
                impact={f.impact}
              />
            ))}
          </ol>
        </section>
      )}

      {correlations.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">📈 Corrélations avec votre bien-être</h3>
          <p className="reco-section-hint">
            Barres vertes = corrélation positive avec votre bien-être · Barres rouges = corrélation négative.
          </p>
          <div className="reco-corr-chart">
            {correlations.map((c) => (
              <CorrelationBar key={c.variable} label={c.label} r={c.r} impact={Math.abs(c.r)} />
            ))}
          </div>
        </section>
      )}

      <p className="reco-disclaimer">
        Ces résultats sont uniquement basés sur vos propres données et ne constituent pas un avis médical.
      </p>
    </div>
  )
}

// ─── Advanced tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ entries }) {
  const result = useMemo(() => computeAdvancedAnalysis(entries), [entries])
  const totalDays = useMemo(() => countTotalDataDays(entries), [entries])

  if (result.status === 'not_enough_data') {
    return (
      <NotEnoughData
        currentDays={result.currentDays}
        minDays={result.minDays}
        tabLabel="recommandations avancées"
      />
    )
  }

  const { datasetDays, modelInfo, featureImportance, topRecommendations, residuals } = result

  const r2Display = modelInfo?.r2 != null ? `${Math.round(modelInfo.r2 * 100)}%` : 'N/A'
  const method = modelInfo?.method === 'ols_linear_regression'
    ? 'Régression linéaire multiple (OLS + Ridge)'
    : 'Corrélation de Pearson (fallback)'

  return (
    <div className="reco-tab-content">
      <p className="reco-meta">
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} avec score bien-être</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}.
        Modèle : <em>{method}</em>.
        {modelInfo?.r2 != null && (
          <> Pouvoir explicatif (R²) : <strong>{r2Display}</strong>.</>
        )}
      </p>

      {topRecommendations?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            🤖 Recommandations du modèle ML
          </h3>
          <p className="reco-section-hint">
            Ces conseils sont générés par régression sur l'ensemble de vos données historiques.
          </p>
          <ol className="reco-advice-list">
            {topRecommendations.map((advice, i) => (
              <AdviceCard key={i} rank={i + 1} advice={advice} />
            ))}
          </ol>
        </section>
      )}

      {featureImportance?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            🔬 Importance des variables (coefficients standardisés)
          </h3>
          <p className="reco-section-hint">
            Vert = impact positif sur votre bien-être · Rouge = impact négatif.
            Taille de la barre = force de l'impact.
          </p>
          <div className="reco-corr-chart">
            {featureImportance.map((f) => (
              <ImportanceBar
                key={f.variable}
                label={f.label}
                importance={f.importance}
                direction={f.direction}
              />
            ))}
          </div>
        </section>
      )}

      {residuals && residuals.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            📉 Bien-être prédit vs réel
          </h3>
          <p className="reco-section-hint">
            Comparaison entre les valeurs prédites par le modèle et vos scores réels (derniers {Math.min(residuals.length, 14)} jours).
          </p>
          <div className="reco-residuals">
            {residuals.slice(-14).map((r) => {
              const [, m, d] = r.dateKey.split('-')
              const diff = r.actual - r.predicted
              return (
                <div key={r.dateKey} className="reco-residual-row">
                  <span className="reco-residual-date">{d}/{m}</span>
                  <span className="reco-residual-actual">Réel : <strong>{r.actual.toFixed(1)}</strong></span>
                  <span className="reco-residual-pred">Prédit : <strong>{r.predicted.toFixed(1)}</strong></span>
                  <span className={'reco-residual-diff ' + (diff >= 0 ? 'reco-diff-pos' : 'reco-diff-neg')}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="reco-disclaimer">
        Le modèle est entraîné uniquement sur vos données locales et ne partage aucune information.
        Ces résultats ne constituent pas un avis médical.
      </p>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic', label: 'Recommandations basiques', minDays: MIN_DAYS_BASIC },
  { id: 'advanced', label: 'Recommandations avancées', minDays: MIN_DAYS_ADVANCED },
]

export default function Recommendations() {
  useAutoSync()

  const [tab, setTab] = useState('basic')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      // Load all entries — we need cross-type correlations
      const data = await listEntries({ limit: 10000 })
      setEntries(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])

  return (
    <section className="reco-page">
      <h2 className="page-title">Recommandations</h2>
      <p className="reco-intro">
        Analyse locale de vos données de santé pour identifier les facteurs qui influencent
        le plus votre <strong>bien-être</strong>. Tout est calculé directement sur votre appareil.
      </p>

      <nav className="reco-tabs" aria-label="Onglets recommandations">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'reco-tab-btn' + (tab === t.id ? ' reco-tab-btn-active' : '')}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
          >
            {t.label}
            <span className="reco-tab-min">≥ {t.minDays}j</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Calcul des analyses…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          {tab === 'basic' && <BasicTab entries={entries} />}
          {tab === 'advanced' && <AdvancedTab entries={entries} />}
        </>
      )}
    </section>
  )
}
