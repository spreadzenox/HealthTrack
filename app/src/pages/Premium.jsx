import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURES } from '../config/distribution'
import { getEntitlement, describeEntitlement, manageSubscriptionUrl } from '../services/entitlement'
import { loadPlans, purchasePlan, restorePurchases, monthlyEquivalent, annualSavingPercent } from '../services/playBilling'
import { PRIVACY_URL } from '../config/brand'
import './Premium.css'

const BENEFITS = [
  'Vos pistes personnelles, avec des délais de 2 à 48 h entre repas et ventre',
  'La réintroduction FODMAP guidée, groupe par groupe',
  'Un rapport PDF pour votre médecin ou votre diététicienne',
  'L’analyse IA des repas sans compter',
]

const PER = { year: 'an', month: 'mois' }

/** Frise de l'essai, seulement quand Google Play propose un essai à cette personne. */
function TrialTimeline({ days }) {
  return (
    <ol className="paywall-timeline" aria-label="Déroulé de l’essai">
      <li>
        <span className="paywall-timeline-day">aujourd’hui</span>
        <span>Tout est débloqué</span>
      </li>
      <li>
        <span className="paywall-timeline-day">jour {days}</span>
        <span>1er paiement, sauf si vous annulez avant</span>
      </li>
    </ol>
  )
}

/**
 * Paywall « soft » de la variante play (jalon 6c-3, maquette de journal/DESIGN.md) : toujours passable, prix et essai
 * lus dans Google Play (jamais codés en dur), achat revérifié par le relais. Les fonctions locales restent gratuites.
 */
export default function Premium() {
  const navigate = useNavigate()
  const [ent, setEnt] = useState(() => getEntitlement())
  const [plans, setPlans] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!FEATURES.billing) return undefined
    let alive = true
    loadPlans().then((list) => {
      if (!alive) return
      setPlans(list)
      setSelected((list.find((p) => p.period === 'year') ?? list[0])?.basePlanId ?? null)
    })
    return () => {
      alive = false
    }
  }, [])

  const close = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))
  const plan = plans?.find((p) => p.basePlanId === selected) ?? null
  const saving = plans ? annualSavingPercent(plans) : null

  const buy = async () => {
    if (!plan) return
    setBusy(true)
    setMessage('')
    try {
      const result = await purchasePlan(plan)
      if (result.status === 'purchased') {
        setEnt(result.entitlement)
        if (!result.entitlement?.premium) setMessage('Achat reçu : la vérification prend un instant. Revenez dans les Paramètres → Abonnement.')
      } else if (result.status !== 'cancelled') {
        setMessage(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const restore = async () => {
    setBusy(true)
    setMessage('')
    try {
      const { found, entitlement } = await restorePurchases()
      setEnt(entitlement)
      if (entitlement.offline) setMessage('Pas de connexion : réessayez dans un instant.')
      else if (!found) setMessage('Aucun abonnement trouvé sur ce compte Google Play.')
    } catch {
      setMessage('Google Play ne répond pas : réessayez dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="paywall">
      <div className="paywall-top">
        <span className="paywall-tag">premium</span>
        <button type="button" className="paywall-close" onClick={close} aria-label="Fermer">
          ×
        </button>
      </div>

      <h2 className="paywall-title">Passez de « je note » à « je comprends »</h2>
      <p className="paywall-lead">
        Vos données restent sur votre téléphone. Le premium vous aide à voir ce qui va avec vos bons et mauvais jours.
      </p>

      <ul className="paywall-benefits">
        {BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <p className="paywall-free">
        <strong>Toujours gratuit :</strong> journal, imports des montres, bien-être estimé, graphiques et export de vos
        données.
      </p>

      {ent.premium ? (
        <div className="paywall-active" role="status">
          <p>{describeEntitlement(ent)}</p>
          {ent.source === 'play' && (
            <a className="btn btn-secondary settings-link-btn" href={manageSubscriptionUrl(ent.productId)} target="_blank" rel="noopener noreferrer">
              Gérer mon abonnement dans Google Play
            </a>
          )}
        </div>
      ) : !FEATURES.billing ? (
        <p className="hint">L’abonnement se prend depuis la version Google Play de l’app.</p>
      ) : plans === null ? (
        <p className="hint">Lecture des formules auprès de Google Play…</p>
      ) : plans.length === 0 ? (
        <p className="hint" role="status">
          Google Play ne propose pas encore de formule pour cette app. Réessayez un peu plus tard ; tout le reste de
          l’app fonctionne sans abonnement.
        </p>
      ) : (
        <>
          <div className="paywall-plans" role="radiogroup" aria-label="Formules">
            {plans.map((p) => {
              const monthly = monthlyEquivalent(p)
              return (
                <label key={p.basePlanId} className={`paywall-plan${selected === p.basePlanId ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="plan"
                    value={p.basePlanId}
                    checked={selected === p.basePlanId}
                    onChange={() => setSelected(p.basePlanId)}
                  />
                  <span className="paywall-plan-text">
                    <span className="paywall-plan-name">{p.period === 'year' ? 'Annuel' : 'Mensuel'}</span>
                    <span className="paywall-plan-price">
                      {p.price} / {PER[p.period]}
                    </span>
                    {monthly && <span className="paywall-plan-note">soit {monthly} par mois</span>}
                  </span>
                  {p.period === 'year' && saving && <span className="paywall-badge">−{saving} %</span>}
                </label>
              )
            })}
          </div>

          {plan?.trialDays && <TrialTimeline days={plan.trialDays} />}

          <button type="button" className="btn paywall-cta" onClick={buy} disabled={!plan || busy}>
            {busy
              ? 'Google Play…'
              : plan?.trialDays
                ? `Essayer ${plan.trialDays} jours gratuitement`
                : `S’abonner · ${plan?.price} / ${PER[plan?.period]}`}
          </button>
          {plan && (
            <p className="paywall-fine">
              {plan.trialDays ? `Puis ${plan.price} par ${PER[plan.period]}. ` : `${plan.price} par ${PER[plan.period]}. `}
              Annulable à tout moment dans Google Play.
            </p>
          )}
        </>
      )}

      {message && (
        <p className="hint" role="alert">
          {message}
        </p>
      )}

      <p className="paywall-links">
        {FEATURES.billing && !ent.premium && (
          <>
            <button type="button" className="paywall-link" onClick={restore} disabled={busy}>
              Restaurer un achat
            </button>
            {' · '}
          </>
        )}
        <a className="paywall-link" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Confidentialité
        </a>
      </p>

      <button type="button" className="btn btn-secondary paywall-later" onClick={close}>
        Plus tard
      </button>
    </section>
  )
}
