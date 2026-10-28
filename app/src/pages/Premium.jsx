import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURES } from '../config/distribution'
import { describeEntitlement, manageSubscriptionUrl } from '../services/entitlement'
import { loadPlans, purchasePlan, restorePurchases, monthlyEquivalent, annualSavingPercent } from '../services/playBilling'
import { APP_NAME, PRIVACY_URL, TERMS_URL } from '../config/brand'
import { deliveredBenefits, upcomingBenefits } from '../config/premiumBenefits'
import DetailsToggle from '../components/DetailsToggle'
import './Premium.css'
import { useEntitlement } from '../hooks/useEntitlement'
import { REMINDER_DAYS_BEFORE, trialReminderAvailable } from '../services/trialReminder'


const PER = { year: 'an', month: 'mois' }

/** Frise de l'essai, seulement quand Google Play propose un essai à cette personne. */
function TrialTimeline({ days, reminder }) {
  return (
    <ol className="paywall-timeline" aria-label="Déroulé de l’essai">
      <li>
        <span className="paywall-timeline-day">aujourd’hui</span>
        <span>Tout est débloqué</span>
      </li>
      {reminder && days > REMINDER_DAYS_BEFORE && (
        <li>
          <span className="paywall-timeline-day">jour {days - REMINDER_DAYS_BEFORE}</span>
          <span>On vous prévient par une notification</span>
        </li>
      )}
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
 *
 * `context="onboarding"` (jalon 4c, dernier écran de l'onboarding) : phrase sur l'arrivée des pistes et
 * « Continuer gratuitement » à la place de « Plus tard » ; `onClose` remplace le retour en arrière.
 */
export default function Premium({ context = null, onClose = null }) {
  const navigate = useNavigate()
  const [ent, setEnt] = useEntitlement()
  const [plans, setPlans] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState(false)
  const [reminder] = useState(() => trialReminderAvailable())

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

  // Achat confirmé plus tard (paiement en attente, retour dans l'app) : le message d'attente n'a plus lieu d'être
  useEffect(() => {
    if (ent.premium) setMessage('')
  }, [ent.premium])

  const onboarding = context === 'onboarding'
  // Période de lancement (P23 ②) : premium offert par le relais ; aucun achat proposé tant qu'elle court
  const launch = ent.premium && ent.source === 'launch'
  const close = onClose ?? (() => (window.history.length > 1 ? navigate(-1) : navigate('/')))
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
        if (!result.entitlement?.premium) setMessage('Achat reçu : la vérification prend un instant, cette page se mettra à jour toute seule.')
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

      <h2 className="paywall-title">{launch ? 'Premium offert pendant le test' : 'Passez de « je note » à « je comprends »'}</h2>
      <p className="paywall-lead">
        {launch
          ? 'Merci de tester l’app ! Tout ce qui suit est débloqué, sans achat ni carte bancaire.'
          : onboarding
          ? 'Vos pistes arriveront vers le 21ᵉ jour de suivi. Le premium les débloque dès qu’elles sont prêtes ; rien ne presse, vous pouvez décider plus tard.'
          : `Vos données sont rangées sur votre téléphone, jamais chez ${APP_NAME}. Le premium vous aide à voir ce qui va avec vos bons et mauvais jours.`}
      </p>

      {/* Seulement ce qui marche aujourd'hui (VC-17) ; le reste dans « détails » */}
      <div className="paywall-benefits-box">
        <ul className="paywall-benefits">
          {deliveredBenefits().map((b) => (
            <li key={b.id}>{b.label}</li>
          ))}
        </ul>
        {upcomingBenefits().length > 0 && (
          <div className="paywall-upcoming">
            <div className="paywall-upcoming-head">
              <span>En préparation, inclus sans supplément</span>
              <DetailsToggle on={details} onToggle={() => setDetails((v) => !v)} />
            </div>
            {details && (
              <ul className="paywall-upcoming-list" aria-label="En préparation">
                {upcomingBenefits().map((b) => (
                  <li key={b.id}>{b.label}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

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

          {plan?.trialDays && <TrialTimeline days={plan.trialDays} reminder={reminder} />}

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
              {plan.trialDays && reminder && plan.trialDays > REMINDER_DAYS_BEFORE && `Rappel ${REMINDER_DAYS_BEFORE} jours avant la fin de l’essai. `}
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
        <a className="paywall-link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
          Conditions
        </a>
        {' · '}
        <a className="paywall-link" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Confidentialité
        </a>
      </p>

      <button type="button" className="btn btn-secondary paywall-later" onClick={close}>
        {launch ? 'Continuer' : onboarding ? 'Continuer gratuitement' : 'Plus tard'}
      </button>
    </section>
  )
}
