import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURES, STORE, storeOfPurchase } from '../config/distribution'
import { describeEntitlement, lastLaunchDay, manageSubscriptionUrl, tierName } from '../services/entitlement'
import { loadPlans, purchasePlan, restorePurchases, monthlyEquivalent, annualSavingPercent } from '../services/playBilling'
import { APP_NAME, PRIVACY_URL, TERMS_URL } from '../config/brand'
import { benefitsFor, upcomingBenefits, PREMIUM_AI_DAILY, GOLD_AI_DAILY } from '../config/premiumBenefits'
import DetailsToggle from '../components/DetailsToggle'
import './Premium.css'
import { useEntitlement } from '../hooks/useEntitlement'
import { REMINDER_DAYS_BEFORE, trialReminderAvailable } from '../services/trialReminder'


const PER = { year: 'an', month: 'mois' }

/** Les deux niveaux (GOLD-b4) : seul le plafond quotidien de l'analyse IA des repas les distingue aujourd'hui. */
const TIERS = [
  { id: 'silver', name: 'Silver', daily: PREMIUM_AI_DAILY },
  { id: 'gold', name: 'Gold', daily: GOLD_AI_DAILY },
]
const tierOf = (plan) => plan?.tier ?? 'silver'
const defaultPlan = (list, tier) => {
  const own = list.filter((p) => tierOf(p) === tier)
  return (own.find((p) => p.period === 'year') ?? own[0])?.basePlanId ?? null
}

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
  const [tier, setTier] = useState('silver')
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
      setSelected(defaultPlan(list, 'silver') ?? defaultPlan(list, 'gold'))
      if (!list.some((p) => tierOf(p) === 'silver') && list.length) setTier('gold')
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
  const tierPlans = plans?.filter((p) => tierOf(p) === tier) ?? null
  const offeredTiers = TIERS.filter((t) => plans?.some((p) => tierOf(p) === t.id))
  const plan = tierPlans?.find((p) => p.basePlanId === selected) ?? null
  const saving = tierPlans ? annualSavingPercent(tierPlans) : null
  // Avantages du niveau dont la personne profite, sinon de celui qu'elle regarde
  const shownTier = (tierName(ent) ?? '').toLowerCase() || tier
  // Abonné Silver (GOLD-b2) : Gold remplace Silver chez Google Play, sans second abonnement
  const goldUpgrade = ent.premium && (ent.source === 'play' || ent.source === 'appstore') && tierName(ent) === 'Silver' ? (plans?.find((p) => tierOf(p) === 'gold') ?? null) : null
  const chooseTier = (id) => {
    setTier(id)
    setSelected(defaultPlan(plans ?? [], id))
  }

  const buy = async (chosen = plan) => {
    if (!chosen) return
    setBusy(true)
    setMessage('')
    try {
      const result = await purchasePlan(chosen)
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
      else if (!found) setMessage(`Aucun abonnement trouvé sur ${STORE.account}.`)
    } catch {
      setMessage(`${STORE.Name} ne répond pas : réessayez dans un instant.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="paywall">
      <div className="paywall-top">
        <span className="paywall-tag">{launch ? 'gold' : 'premium'}</span>
        <button type="button" className="paywall-close" onClick={close} aria-label="Fermer">
          ×
        </button>
      </div>

      <h2 className="paywall-title">{launch ? 'Gold offert pendant le test' : 'Comprendre vos bons et mauvais jours'}</h2>
      <p className="paywall-lead">
        {launch
          ? `Merci de tester l’app ! ${ent.launchUntil ? `Jusqu’au ${lastLaunchDay(ent.launchUntil)}, tout` : 'Tout'} ce qui suit est débloqué : vous n’avez rien à payer, aucune carte bancaire n’est demandée.`
          : onboarding
          ? 'Vos pistes arriveront vers le 21ᵉ jour de suivi. Le premium les débloque dès qu’elles sont prêtes ; rien ne presse, vous pouvez décider plus tard.'
          : offeredTiers.length > 1
          ? 'Silver ou Gold : seul le nombre d’analyses IA par jour change.'
          : 'Voici ce que l’abonnement ajoute.'}
      </p>

      {/* Seulement ce qui marche aujourd'hui (VC-17) ; le reste dans « détails » */}
      <div className="paywall-benefits-box">
        <ul className="paywall-benefits">
          {benefitsFor(shownTier).map((b) => (
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

      {/* Période de lancement : tout est dit dans le titre et la phrase d'accueil, rien à répéter (POL-PLAY-39) */}
      {launch ? null : ent.premium ? (
        <div className="paywall-active" role="status">
          <p>{describeEntitlement(ent)}</p>
          {(ent.source === 'play' || ent.source === 'appstore') && (
            <a className="btn btn-secondary settings-link-btn" href={manageSubscriptionUrl(ent.productId, ent.source)} target="_blank" rel="noopener noreferrer">
              Gérer mon abonnement {storeOfPurchase(ent.source).inStore}
            </a>
          )}
          {goldUpgrade && (
            <div className="paywall-upgrade">
              <p className="paywall-upgrade-title">Passer à Gold : {GOLD_AI_DAILY} analyses IA par jour au lieu de {PREMIUM_AI_DAILY}.</p>
              <button type="button" className="btn paywall-cta" onClick={() => buy(goldUpgrade)} disabled={busy}>
                {busy ? `${STORE.Name}…` : `Passer à Gold · ${goldUpgrade.price} / ${PER[goldUpgrade.period]}`}
              </button>
              <p className="paywall-fine">
                Gold remplace Silver : vous n’aurez qu’un abonnement. Le temps déjà payé de Silver devient du temps de
                Gold. {STORE.Name} affiche le détail avant de valider.
              </p>
            </div>
          )}
        </div>
      ) : !FEATURES.billing ? (
        <p className="hint">L’abonnement se prend depuis la version Google Play de l’app.</p>
      ) : plans === null ? (
        <p className="hint">Lecture des formules {STORE.fromStore}…</p>
      ) : plans.length === 0 ? (
        <p className="hint" role="status">
          {STORE.Name} ne propose pas encore de formule pour cette app. Réessayez un peu plus tard ; tout le reste de
          l’app fonctionne sans abonnement.
        </p>
      ) : (
        <>
          {offeredTiers.length > 1 && (
            <div className="paywall-tiers" role="radiogroup" aria-label="Niveaux">
              {offeredTiers.map((t) => (
                <label key={t.id} className={`paywall-tier paywall-tier-${t.id}${tier === t.id ? ' is-selected' : ''}`}>
                  <input type="radio" name="tier" value={t.id} checked={tier === t.id} onChange={() => chooseTier(t.id)} />
                  <span className="paywall-tier-name">{t.name}</span>
                  <span className="paywall-tier-note"><span className="paywall-tier-count">{t.daily}</span> analyses IA par jour</span>
                </label>
              ))}
            </div>
          )}

          <div className="paywall-plans" role="radiogroup" aria-label="Formules">
            {tierPlans.map((p) => {
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

          <button type="button" className="btn paywall-cta" onClick={() => buy()} disabled={!plan || busy}>
            {busy
              ? `${STORE.Name}…`
              : plan?.trialDays
                ? `Essayer ${plan.trialDays} jours gratuitement`
                : `S’abonner · ${plan?.price} / ${PER[plan?.period]}`}
          </button>
          {plan && (
            <p className="paywall-fine">
              {/* Sans essai, le prix est déjà sur la formule et sur le bouton (POL-PLAY-96) */}
              {plan.trialDays ? `Puis ${plan.price} par ${PER[plan.period]}. ` : null}
              {plan.trialDays && reminder && plan.trialDays > REMINDER_DAYS_BEFORE && `Rappel ${REMINDER_DAYS_BEFORE} jours avant la fin de l’essai. `}
              Annulable à tout moment {STORE.inStore}.
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
