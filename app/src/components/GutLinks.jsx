import { useState } from 'react'
import { Link } from 'react-router-dom'
import DetailsToggle from './DetailsToggle'
import { FEATURES } from '../config/distribution'
import { useEntitlement } from '../hooks/useEntitlement'
import { FODMAP_FACTOR_LABELS, comparableLabel } from '../services/gutLinks'
import { fodmapGroupOf } from '../services/gutWindows'
import { challengePath } from '../services/fodmapChallenge'
import './GutLinks.css'
import { appLocale } from '../i18n/locale.js'

const fr = (v, digits = 1) => v.toLocaleString(appLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits })
const times = (k, n) => `${k} fois sur ${n}`

/** La piste en une phrase, avec les deux comptes (avec / sans l'aliment). */
function linkSentence(link) {
  const { exposed: ex, unexposed: un } = link
  // N5 : piste d'un sous-groupe FODMAP seul (pas regroupée avec un aliment)
  const group = link.together.length ? null : fodmapGroupOf(link.factor)
  const rich = group && `un repas riche en ${FODMAP_FACTOR_LABELS[group] ?? group}`
  if (link.kind === 'day') {
    let withText = link.when === 'veille' ? 'Les lendemains des jours où vous en avez mangé' : 'Les jours où vous en avez mangé'
    if (rich) withText = link.when === 'veille' ? `Les lendemains d’${rich}` : `Les jours avec ${rich}`
    return `${withText}, gêne ou douleur ${times(ex.symptoms, ex.n)}. Les autres jours, ${times(un.symptoms, un.n)}.`
  }
  const after = rich ? `après ${rich}` : 'après en avoir mangé'
  return `Dans les ${link.whenLabel.replace(' après', '')} ${after}, gêne ou douleur ${times(ex.symptoms, ex.n)}. Le reste du temps, ${times(un.symptoms, un.n)}.`
}

function GutLinkCard({ link }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="gut-link-card">
      <div className="gut-link-content">
        <p className="gut-link-title">
          {link.label} → ventre <span className="gut-link-when">{link.whenLabel}</span>
        </p>
        <p className="gut-link-text">{linkSentence(link)}</p>
        {link.together.length > 1 && (
          <p className="gut-link-text">Toujours mangés ensemble dans vos repas : vos données ne les départagent pas.</p>
        )}
        <span className="reco-evidence reco-evidence-tentative">À confirmer</span>
        <Link to={challengePath(link.together.length > 1 ? link.together : link.factor)} className="gut-link-check">Vérifier avec une réintroduction guidée ›</Link>
        {open && (
          <>
            <p className="gut-link-stats">
              RR = {fr(link.rr)} · q = {fr(link.q, 3)} · comparé dans des blocs de jours voisins
              {link.comparable?.length > 0 && <> · {comparableLabel(link.comparable)}</>}
              {link.also.length > 0 && <> · aussi : {link.also.join(', ')}</>}
            </p>
            {link.oftenWith?.length > 0 && (
              <p className="gut-link-text">
                Souvent mangé avec : {link.oftenWith.join(', ')}.{' '}
                {link.oftenWith.length > 1 ? 'Comparés à part, ils ne ressortent pas à eux seuls.' : 'Comparé à part, il ne ressort pas à lui seul.'}
              </p>
            )}
            {link.nearMeal != null && link.nearMeal > 0 && (
              <p className="gut-link-stats">
                {Math.round(link.nearMeal * 100)} % de ces notes ont été prises dans les 2 h après ce repas.
              </p>
            )}
            {(fodmapGroupOf(link.factor) || link.together.some(fodmapGroupOf)) && (
              <p className="gut-link-text">
                « Riche » : au-dessus d’un repère général par portion (une hypothèse de départ). Vos données priment.
              </p>
            )}
            <p className="gut-link-text">L’attente joue aussi : une réintroduction guidée aide à trancher.</p>
          </>
        )}
      </div>
      <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
    </li>
  )
}

/**
 * Paywall au moment de la valeur (version Play sans premium) : combien de pistes ressortent, un aperçu flouté fait de
 * barres neutres — aucun aliment dans la page, un flou CSS se retire — et « Débloquer ». Le calcul reste local.
 */
function LockedGutLinks({ count }) {
  return (
    <div className="gut-links-locked">
      <p className="gut-links-locked-title">
        {count} {count > 1 ? 'pistes repérées' : 'piste repérée'} entre vos repas et votre ventre
      </p>
      <div className="gut-links-preview" aria-hidden="true" data-testid="gut-links-preview">
        {Array.from({ length: Math.min(count, 3) }, (_, i) => (
          <div key={i}>
            <span className="gut-links-preview-bar" style={{ width: `${70 - i * 12}%` }} />
            <span className="gut-links-preview-bar is-thin" />
          </div>
        ))}
      </div>
      <p className="gut-link-text">Quel aliment, et combien de temps après le repas.</p>
      <span className="fodmap-tag mono">premium</span>
      <Link to="/premium" className="btn fodmap-cta">Débloquer</Link>
    </div>
  )
}

/**
 * « Votre ventre et vos repas » dans Analyses : seulement les pistes gardées par les deux moteurs (BH + TTS), ou une
 * phrase honnête quand rien ne ressort. Le « trop tôt » passe par la ligne « Bientôt » de la page. Premium sur la
 * version Play (offert pendant le lancement) ; libre en sideload.
 */
export default function GutLinks({ gut }) {
  const [ent] = useEntitlement()
  if (!gut || (gut.status !== 'links' && gut.status !== 'none')) return null
  const locked = gut.status === 'links' && FEATURES.billing && !ent.premium
  return (
    <section className="reco-section gut-links" data-testid="gut-links">
      <h3 className="reco-section-title">Votre ventre et vos repas</h3>
      <p className="gut-links-meta">
        {gut.noteDays} jours de notes du ventre · {gut.tested} comparaisons · délais 0–48 h
      </p>
      {locked ? (
        <LockedGutLinks count={gut.links.length} />
      ) : gut.status === 'links' ? (
        <ul className="gut-link-list">
          {gut.links.map((l) => <GutLinkCard key={`${l.factor}:${l.when}`} link={l} />)}
        </ul>
      ) : (
        <p className="gut-links-empty">
          Aucun aliment ne ressort nettement pour l’instant.
        </p>
      )}
    </section>
  )
}
