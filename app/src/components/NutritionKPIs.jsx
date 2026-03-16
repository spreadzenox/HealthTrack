import { useState, useEffect } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { aggregateNutrition } from '../services/nutritionKPIs'
import './NutritionKPIs.css'

/** Cibles indicatives pour la digestion / éviter l'intestin irritable (recommandations courantes) */
const TARGETS = {
  fiber_g: { min: 25, max: 35, label: 'Fibres (g)', tip: 'Favorise le transit et le microbiote. Progressif pour éviter ballonnements.' },
  fat_g: { max: 70, label: 'Lipides (g)', tip: 'Modération : les repas très gras ralentissent la digestion.' },
  carbohydrates_g: { max: 300, label: 'Glucides (g)', tip: 'Répartis sur la journée pour limiter les pics.' },
  energy_kcal: { max: 2500, label: 'Énergie (kcal)', tip: 'Éviter les repas trop copieux en une fois.' },
}

export default function NutritionKPIs() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await listEntries({ type: 'food', limit: 200 })
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    window.addEventListener('focus', onUpdate)
    return () => {
      window.removeEventListener('health-entries-updated', onUpdate)
      window.removeEventListener('focus', onUpdate)
    }
  }, [])

  const { totals, mealCount } = aggregateNutrition(entries, { onlyToday: true })

  if (loading) {
    return (
      <div className="nutrition-kpis">
        <p className="nutrition-kpis-loading">Chargement des indicateurs…</p>
      </div>
    )
  }

  return (
    <section className="nutrition-kpis" aria-labelledby="kpis-title">
      <h2 id="kpis-title" className="nutrition-kpis-title">
        Indicateurs du jour (digestion & confort intestinal)
      </h2>
      <p className="nutrition-kpis-subtitle">Aujourd’hui — mis à jour en temps réel</p>

      <div className="nutrition-kpis-grid">
        <div className="kpi-card">
          <span className="kpi-value">{totals.fiber_g}</span>
          <span className="kpi-unit">g</span>
          <span className="kpi-label">{TARGETS.fiber_g.label}</span>
          <span className="kpi-target">cible 25–35 g</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{totals.fat_g}</span>
          <span className="kpi-unit">g</span>
          <span className="kpi-label">{TARGETS.fat_g.label}</span>
          <span className="kpi-target">modération &lt; 70 g</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{totals.carbohydrates_g}</span>
          <span className="kpi-unit">g</span>
          <span className="kpi-label">{TARGETS.carbohydrates_g.label}</span>
          <span className="kpi-target">répartis sur la journée</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-value">{totals.energy_kcal}</span>
          <span className="kpi-unit">kcal</span>
          <span className="kpi-label">{TARGETS.energy_kcal.label}</span>
          <span className="kpi-target">éviter les excès en un repas</span>
        </div>
        <div className="kpi-card kpi-meals">
          <span className="kpi-value">{mealCount}</span>
          <span className="kpi-unit"></span>
          <span className="kpi-label">Repas enregistrés</span>
          <span className="kpi-target">régularité recommandée</span>
        </div>
      </div>
    </section>
  )
}
