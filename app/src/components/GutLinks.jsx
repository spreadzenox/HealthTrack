import { useState } from 'react'
import DetailsToggle from './DetailsToggle'
import './GutLinks.css'

const fr = (v, digits = 1) => v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const times = (k, n) => `${k} fois sur ${n}`

/** La piste en une phrase, avec les deux comptes (avec / sans l'aliment). */
function linkSentence(link) {
  const { exposed: ex, unexposed: un } = link
  if (link.kind === 'day') {
    const withText = link.when === 'veille' ? 'Les lendemains des jours où vous en avez mangé' : 'Les jours où vous en avez mangé'
    return `${withText}, gêne ou douleur ${times(ex.symptoms, ex.n)}. Les autres jours, ${times(un.symptoms, un.n)}.`
  }
  return `Dans les ${link.whenLabel.replace(' après', '')} après en avoir mangé, gêne ou douleur ${times(ex.symptoms, ex.n)}. Le reste du temps, ${times(un.symptoms, un.n)}.`
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
        {open && (
          <>
            <p className="gut-link-stats">
              RR = {fr(link.rr)} · q = {fr(link.q, 3)} · comparé dans des blocs de jours voisins
              {link.also.length > 0 && <> · aussi : {link.also.join(', ')}</>}
            </p>
            {link.nearMeal != null && link.nearMeal > 0 && (
              <p className="gut-link-stats">
                {Math.round(link.nearMeal * 100)} % de ces notes ont été prises dans les 2 h après ce repas.
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
 * « Votre ventre et vos repas » dans Analyses : seulement les pistes gardées par les deux moteurs (BH + TTS), ou une
 * phrase honnête quand rien ne ressort. Le « trop tôt » passe par la ligne « Bientôt » de la page.
 */
export default function GutLinks({ gut }) {
  if (!gut || (gut.status !== 'links' && gut.status !== 'none')) return null
  return (
    <section className="reco-section gut-links" data-testid="gut-links">
      <h3 className="reco-section-title">Votre ventre et vos repas</h3>
      <p className="gut-links-meta">
        {gut.noteDays} jours de notes du ventre · {gut.tested} comparaisons · délais 0–48 h
      </p>
      {gut.status === 'links' ? (
        <ul className="gut-link-list">
          {gut.links.map((l) => <GutLinkCard key={`${l.factor}:${l.when}`} link={l} />)}
        </ul>
      ) : (
        <p className="gut-links-empty">
          Aucun aliment ne ressort nettement pour l’instant. On préfère attendre plutôt que de vous montrer de faux
          suspects.
        </p>
      )}
    </section>
  )
}
