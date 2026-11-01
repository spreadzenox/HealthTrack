import { useState, useEffect, useMemo, useCallback } from 'react'
import JournalTabs from '../components/JournalTabs'
import { loadNutritionEntries } from '../services/nutritionData'
import { getBodyProfile, getLatestBodyComposition } from '../services/bodyProfile'
import { compareRecentIntake, formatNutrientAmount } from '../services/nutritionIntakeCompare'
import BodyProfileCard from '../components/BodyProfileCard'
import PastelTiles from '../components/PastelTiles'
import ciqualMeta from '../data/ciqualMeta.json'
import './Nutrition.css'

// POL-PLAY-49 : semaine sans repas → tuile pêche (repas), comme le Journal vierge.
const EMPTY_TILES = [{ to: '/food', theme: 'peach', icon: 'camera', label: 'Photographier un repas' }]

const STATUS_TEXT = {
  ok: 'atteint',
  partial: 'proche',
  low: 'bas',
  over: 'dépassé',
  uncertain: 'incertain',
}

// Légende : seulement les statuts présents (POL-PLAY-75), dans cet ordre
const LEGEND = [
  ['ok', 'atteint'],
  ['partial', 'proche (≥ 70 %)'],
  ['low', 'bas'],
  ['uncertain', 'incertain : repas manquants'],
  ['over', 'limite dépassée'],
]

function NutrientBar({ row }) {
  const barClass = `nutrition-bar-${row.status}`
  // Teneur non mesurée pour une partie des aliments : la valeur est un minimum (N2b).
  const amount = `${row.partial ? '≥\u00a0' : ''}${formatNutrientAmount(row.perDay)} ${row.unit}/j`
  const reference = row.limit
    ? `max ${formatNutrientAmount(row.target)} ${row.unit}`
    : `obj. ${formatNutrientAmount(row.target)} ${row.unit}`

  return (
    <div className="nutrition-bar-row">
      <div className="nutrition-bar-head">
        <span className="nutrition-bar-label">
          {row.label}
          {row.partial && <span className="nutrition-partial-tag">partiel</span>}
        </span>
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
          aria-label={`${row.label} : ${row.partial ? 'au moins ' : ''}${row.pct} % ${row.limit ? 'de la limite' : 'de l’objectif'}, ${STATUS_TEXT[row.status]}`}
        />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [entries, setEntries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // « Chargement… » seulement au premier affichage : une mise à jour (profil, repas) ne fait pas clignoter la page.
  const load = useCallback(async () => {
    try {
      const data = await loadNutritionEntries()
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

  const profileComplete = profile != null
    && ['weight', 'height', 'sex', 'age'].every((k) => profile.origins[k] !== 'default')
  const bodyComp = useMemo(() => getLatestBodyComposition(entries), [entries])

  if (loading) {
    return (
      <section className="food-page nutrition-page">
        <JournalTabs />
        <h2 className="page-title">Vos apports</h2>
        <p>Chargement…</p>
      </section>
    )
  }

  return (
    <section className="food-page nutrition-page">
      <JournalTabs />
      <h2 className="page-title">Vos apports</h2>

      <BodyProfileCard profile={profile} composition={bodyComp} onSaved={load} />

      {comparison && comparison.mealCount === 0 ? (
        <div className="nutrition-empty">
          <p className="journal-empty-title">Aucun repas ces 7 derniers jours</p>
          <p className="journal-empty-text">Vos apports s’afficheront ici dès votre premier repas.</p>
          <PastelTiles tiles={EMPTY_TILES} />
        </div>
      ) : comparison ? (
        <>
          <p className="nutrition-intro">
            Moyenne <strong>par jour saisi</strong>{'\u00a0· '}{comparison.periodLabel}{'\u00a0· '}
            {comparison.mealCount}{'\u00a0'}repas{'\u00a0· '}{comparison.loggedDays}{'\u00a0'}jour
            {comparison.loggedDays > 1 ? 's' : ''}
          </p>
          {/* Jours incomplets : le compte de repères atteints serait trompeur, l'avertissement le remplace */}
          {comparison.likelyIncomplete ? (
            <p className="nutrition-warning">
              ≈{'\u00a0'}{formatNutrientAmount(comparison.energyPerDay)} kcal/j en moyenne : des repas manquent sans doute,
              apports sous-estimés.
            </p>
          ) : (
            <p className="nutrition-summary">
              <strong>{comparison.reachedCount}</strong> repère{comparison.reachedCount > 1 ? 's' : ''} atteint
              {comparison.reachedCount > 1 ? 's' : ''} sur {comparison.targetCount}
            </p>
          )}
          <div className="nutrition-legend" aria-hidden="true">
            {LEGEND.filter(([status]) => comparison.statuses.includes(status)).map(([status, text]) => (
              <span key={status}><i className={`nutrition-dot nutrition-bar-${status}`} /> {text}</span>
            ))}
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
            Objectifs : repères de l’ANSES pour un adulte{profileComplete ? ', ajustés à votre profil' : ''}. Les apports
            sont calculés d’après vos repas et leurs portions : ce sont des ordres de grandeur.
            Un doute sur une carence : parlez-en à un médecin ou à un·e diététicien·ne.
          </p>
          <p className="nutrition-footnote nutrition-source">
            Composition des aliments : {ciqualMeta.attribution}
            {comparison.partialCount > 0
              ? ' «\u00a0partiel\u00a0» : Ciqual n’a pas mesuré cette teneur pour une partie de vos aliments ; l’apport réel est sans doute plus élevé.'
              : ' Une teneur que Ciqual n’a pas mesurée n’est pas comptée.'}
          </p>
        </>
      ) : null}
    </section>
  )
}
