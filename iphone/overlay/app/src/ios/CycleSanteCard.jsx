/**
 * Version iOS (HealthTrack-iOS), CYCLE-iOS-3 (décision du propriétaire du 10/11 vers 18:50, « Ok cycle » ; maquette
 * `journal/maquettes/cycle-sante/`) : dans Sources, « Suivi du cycle (Santé) » propose une fois la lecture du cycle à
 * qui a « Mon cycle » et a autorisé Santé avant que le cycle y soit (la demande de l'accueil l'inclut désormais).
 * Une fois demandé, la carte disparaît ; les données reçues apparaissent dans « Mes appareils » (« cycle »).
 */
import { useState } from 'react'
import { goalsOf } from '../settings/onboarding'
import { askCycleAfterOnboarding, shouldOfferCycleSante } from './cycleSante'

export default function CycleSanteCard() {
  const [offered] = useState(() => shouldOfferCycleSante({ goals: goalsOf() }))
  const [state, setState] = useState({ busy: false, count: null })
  if (!offered) return null
  const ask = async () => {
    setState({ busy: true, count: null })
    const count = await askCycleAfterOnboarding().catch(() => 0)
    setState({ busy: false, count })
  }
  return (
    <section className="weather-card" aria-labelledby="cycle-sante-title">
      <div className="my-device-head">
        <h3 id="cycle-sante-title" className="my-devices-title">Suivi du cycle (Santé)</h3>
      </div>
      <p className="my-devices-intro">
        Vos règles et vos symptômes notés dans l’app Santé, ou dans une app de cycle qui y écrit, peuvent rejoindre votre
        journal. Lus sur ce téléphone, jamais envoyés.
      </p>
      {state.count === null ? (
        <div className="my-device-actions">
          <button type="button" className="btn btn-primary connector-btn" onClick={ask} disabled={state.busy}>
            Lire mon cycle dans Santé
          </button>
        </div>
      ) : (
        <p className="my-device-message" role="status">
          {state.count > 1 && `${state.count} notes de cycle ajoutées à votre journal.`}
          {state.count === 1 && '1 note de cycle ajoutée à votre journal.'}
          {state.count === 0 && 'Rien de noté dans Santé pour l’instant : vos prochaines règles y apparaîtront.'}
        </p>
      )}
    </section>
  )
}
