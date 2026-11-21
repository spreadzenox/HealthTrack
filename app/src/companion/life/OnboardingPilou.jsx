/**
 * Pilou pendant les 4 temps de l'onboarding (lot VIE, étape 12 ; specs/comprendre.SPEC.md § 4) : un bandeau-ciel avec
 * Pilou à gauche et sa bulle à droite. « Confort digestif » coché : il se tapote le ventre (« Le ventre aussi : c'est
 * noté. ») ; « Oui » à la montre : il enfile la sienne (« Une montre ? Moi aussi ! ») ; « Non » : il n'en porte pas.
 * Au temps 3 il se détend ; au temps 4 il pose la main sur le cœur. Décoratif : la bulle est lue, pas le dessin.
 */
import { useEffect } from 'react'
import PilouFigure from './PilouFigure'
import { setWatch } from './companionState'
import './OnboardingPilou.css'

/** Ce que fait et dit Pilou à chaque temps. */
function onboardingPilouLine(step, { gut = false, watch = null, quiet = false } = {}) {
  if (step === 'goal') return gut ? { expr: 'content', move: 'hop', text: 'La digestion aussi : c’est noté.' } : { expr: 'curieux', move: 'none', text: null }
  if (step === 'watch') {
    if (watch === 'yes') return { expr: 'rayonnant', move: 'hop', text: 'Une montre ? Moi aussi !', watch: true }
    if (watch === 'no') return { expr: 'content', move: 'none', text: 'D’accord, votre téléphone suffit.', watch: false }
    return { expr: 'curieux', move: 'none', text: null, watch: false }
  }
  // POLISH-SIM-133 : rien de suivi seul (sans montre, ni Health Connect, ni météo), il ne promet rien
  if (step === 'auto') return { expr: 'content', move: 'none', text: quiet ? 'Pour l’instant, c’est vous qui notez. Je garde tout.' : 'Tout ça, je m’en occupe. Vous n’avez rien à faire.' }
  if (step === 'notes') return { expr: 'reconfortant', move: 'none', text: null }
  return null
}

export default function OnboardingPilou({ step, gut, watch, quiet = false }) {
  // Le choix de la montre habille Pilou pour de bon (il la garde sur l'Accueil)
  useEffect(() => {
    if (watch === 'yes' || watch === 'no') setWatch(watch === 'yes')
  }, [watch])
  const line = onboardingPilouLine(step, { gut, watch, quiet })
  if (!line) return null
  return (
    <div className="onb-pilou" data-testid="onboarding-pilou">
      <PilouFigure key={`${step}-${line.expr}-${line.text}`} size={76} expr={line.expr} move={line.move}
        watch={line.watch ?? undefined} />
      {line.text && <p className="onb-pilou-bubble" role="status">{line.text}</p>}
    </div>
  )
}
