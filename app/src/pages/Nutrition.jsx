import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listEntriesForAnalysis } from '../storage/localHealthStorage'
import { getBodyProfile, getLatestBodyComposition, computeBmi } from '../services/bodyProfile'
import { compareRecentIntake, formatNutrientAmount } from '../services/nutritionIntakeCompare'
import { computeDailyEnergyKcal } from '../services/nutrientReferenceIntakes'
import './Nutrition.css'

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v)

const STATUS_TEXT = {
  ok: 'atteint',
  partial: 'proche',
  low: 'bas',
  over: 'dépassé',
}

function NutrientBar({ row }) {
  const barClass = `nutrition-bar-${row.status}`
  const amount = `${formatNutrientAmount(row.perDay)} ${row.unit}/j`
  const reference = row.limit
    ? `max ${formatNutrientAmount(row.target)} ${row.unit}`
    : `obj. ${formatNutrientAmount(row.target)} ${row.unit}`

  return (
    <div className="nutrition-bar-row">
      <div className="nutrition-bar-head">
        <span className="nutrition-bar-label">{row.label}</span>
        <span className="nutrition-bar-value">
          <strong>{amount}</strong> · {reference}
        </span>
      </div>
      <div className="nutrition-bar-wrap">
        <div
          className={`nutrition-bar-fill ${barClass}`}
          style={{ width: `${row.barPct}%` }}
          role="progressbar"
          aria-valuenow={row.barPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${row.label} : ${row.pct} % ${row.limit ? 'de la limite' : 'de l’objectif'}, ${STATUS_TEXT[row.status]}`}
        />
      </div>
    </div>
  )
}

const BODY_LABELS = {
  fatRatioPct: 'Masse grasse',
  fatMassKg: 'Graisse (kg)',
  muscleMassKg: 'Masse musculaire',
  boneMassKg: 'Masse osseuse',
  hydrationPct: 'Hydratation',
  bmrKcal: 'Métabolisme basal',
  visceralFatIndex: 'Graisse viscérale',
  vascularAgeYears: 'Âge vasculaire',
  standingHrBpm: 'FC debout',
  pwvMps: 'Vitesse d’onde de pouls',
}

function BodyCompositionCard({ payload }) {
  if (!payload) return null
  const items = Object.entries(BODY_LABELS)
    .filter(([key]) => payload[key] != null)
    .map(([key, label]) => ({ key, label, value: payload[key] }))

  if (items.length === 0) return null

  return (
    <div>
      <h3 className="nutrition-section-title">Dernière mesure Withings</h3>
      <div className="nutrition-body-grid">
        {items.map(({ key, label, value }) => (
          <div key={key} className="nutrition-body-item">
            <span>{label}</span>
            <strong>
              {typeof value === 'number' ? formatNumber(value) : value}
              {key.includes('Pct') ? ' %' : key.includes('Kcal') ? ' kcal' : key.includes('Years') ? ' ans' : key.includes('Bpm') ? ' bpm' : key.includes('Mps') ? ' m/s' : key.includes('Kg') ? ' kg' : ''}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [entries, setEntries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listEntriesForAnalysis()
      setEntries(data)
      setProfile(await getBodyProfile(data))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [load])

  const comparison = useMemo(() => {
    if (!profile) return null
    return compareRecentIntake(entries, profile)
  }, [entries, profile])

  const bodyComp = useMemo(() => getLatestBodyComposition(entries), [entries])
  const bmi = profile ? computeBmi(profile.weightKg, profile.heightCm) : null
  const dailyKcal = profile ? computeDailyEnergyKcal(profile) : null

  if (loading) {
    return (
      <section className="food-page nutrition-page">
        <h2 className="page-title">Nutrition</h2>
        <p>Chargement…</p>
      </section>
    )
  }

  return (
    <section className="food-page nutrition-page">
      <h2 className="page-title">Nutrition</h2>
      <p className="nutrition-intro">
        Vos apports moyens <strong>par jour saisi</strong> sur les 7 derniers jours, comparés aux
        repères officiels (ANSES) personnalisés selon votre poids et votre taille.
      </p>

      <div className="nutrition-profile-card">
        <div>
          <strong>Poids :</strong> {formatNumber(profile.weightKg)} kg
          {profile.weightAt && (
            <span className="nutrition-profile-hint">
              {' '}(Withings, {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(profile.weightAt))})
            </span>
          )}
        </div>
        <div>
          <strong>Taille :</strong> {profile.heightCm} cm
          {profile.heightAt && (
            <span className="nutrition-profile-hint">
              {' '}(Withings)
            </span>
          )}
        </div>
        {bmi != null && <div><strong>IMC :</strong> {formatNumber(bmi)}</div>}
        {dailyKcal != null && <div><strong>Énergie recommandée :</strong> ~{formatNumber(dailyKcal)} kcal/jour</div>}
        {profile.source === 'default' && (
          <p className="nutrition-profile-hint">
            Connectez votre balance{' '}
            <Link to="/connectors">Withings Body Scan</Link> pour personnaliser les objectifs.
          </p>
        )}
      </div>

      {comparison && comparison.mealCount === 0 ? (
        <div className="nutrition-empty">
          <p>Aucun repas enregistré ces 7 derniers jours.</p>
          <p>
            <Link to="/food" className="btn">Ajouter un repas</Link>
          </p>
        </div>
      ) : comparison ? (
        <>
          <p className="nutrition-intro">
            {comparison.periodLabel} · {comparison.mealCount} repas · {comparison.loggedDays} jour
            {comparison.loggedDays > 1 ? 's' : ''} saisi{comparison.loggedDays > 1 ? 's' : ''}
          </p>
          <p className="nutrition-summary">
            <strong>{comparison.reachedCount}</strong> repère{comparison.reachedCount > 1 ? 's' : ''} atteint
            {comparison.reachedCount > 1 ? 's' : ''} sur {comparison.targetCount}
          </p>
          {comparison.likelyIncomplete && (
            <p className="nutrition-warning">
              Vos jours saisis comptent en moyenne {formatNutrientAmount(comparison.energyPerDay)} kcal,
              moins de la moitié de vos besoins : des repas manquent sans doute, les apports
              ci-dessous sont donc sous-estimés.
            </p>
          )}
          <div className="nutrition-legend" aria-hidden="true">
            <span><i className="nutrition-dot nutrition-bar-ok" /> atteint</span>
            <span><i className="nutrition-dot nutrition-bar-partial" /> proche (≥ 70 %)</span>
            <span><i className="nutrition-dot nutrition-bar-low" /> bas</span>
            <span><i className="nutrition-dot nutrition-bar-over" /> limite dépassée</span>
          </div>
          {comparison.groups.map((group) => (
            <div key={group.title}>
              <h3 className="nutrition-section-title">{group.title}</h3>
              {group.rows.map((row) => (
                <NutrientBar key={row.key} row={row} />
              ))}
            </div>
          ))}
          <p className="nutrition-footnote">
            Repères indicatifs pour un adulte, calculés à partir d’estimations (photos, portions).
            Ce n’est pas un diagnostic de carence : en cas de doute, parlez-en à un médecin ou à
            un·e diététicien·ne.
          </p>
        </>
      ) : null}

      <BodyCompositionCard payload={bodyComp} />
    </section>
  )
}
