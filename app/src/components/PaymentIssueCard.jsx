import { FEATURES } from '../config/distribution'
import { paymentIssue } from '../services/entitlement'
import { useEntitlement } from '../hooks/useEntitlement'
import './TodayCards.css'

/**
 * Carte de l'Accueil quand un paiement Google Play est à régulariser (période de grâce ou suspension, jalon 6e).
 * Variante play seulement ; l'état vient du relais (relu au démarrage et au retour dans l'app).
 */
export default function PaymentIssueCard() {
  const [ent] = useEntitlement()
  const issue = FEATURES.billing ? paymentIssue(ent) : null
  if (!issue) return null
  return (
    <section className="today-card payment-issue-card" role="status" aria-labelledby="payment-issue-title">
      <h3 id="payment-issue-title" className="today-card-title">{issue.title}</h3>
      <p className="today-card-text">{issue.text}</p>
      <a className="btn btn-secondary payment-issue-btn" href={issue.url} target="_blank" rel="noopener noreferrer">
        Mettre à jour mon paiement
      </a>
    </section>
  )
}
