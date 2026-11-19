/**
 * La cérémonie du jour 7 (lot VIE, étape 12 ; specs/comprendre.SPEC.md § 5) : une seule fois dans la vie de l'app,
 * quand le bien-être a son premier score. Le grand arc-en-ciel se trace derrière Pilou (pêche, menthe, lilas, bleu
 * nuit), il saute de joie ; « Vos premiers résultats sont prêts ». Avec l'objectif digestion, la carte dit son propre
 * délai. Mouvements réduits : tout en fondu, sans saut ni confettis.
 */
import PilouFigure from './PilouFigure'
import './Ceremony7.css'

/**
 * @param {{ name: string, gutDaysLeft?: number|null, onSee: () => void, onClose: () => void }} props
 */
export default function Ceremony7({ name, gutDaysLeft = null, onSee, onClose }) {
  return (
    <div className="ceremony7" role="dialog" aria-modal="true" aria-labelledby="ceremony7-title" data-testid="ceremony7">
      <div className="ceremony7-stage" aria-hidden="true">
        <svg className="ceremony7-rainbow" viewBox="0 0 240 130" width="240" height="130" focusable="false">
          {['--peach-track', '--mint-track', '--lilac-track', '--night-track'].map((c, i) => (
            <path key={c} d={`M ${20 + i * 14} 126 A ${100 - i * 14} ${100 - i * 14} 0 0 1 ${220 - i * 14} 126`}
              fill="none" stroke={`var(${c})`} strokeWidth="13" strokeLinecap="round" pathLength="100"
              style={{ animationDelay: `${100 + i * 260}ms` }} />
          ))}
        </svg>
        <div className="ceremony7-pilou">
          <PilouFigure size={112} expr="fier" move="party" />
        </div>
      </div>
      <span className="ceremony7-tag" data-tone="mint">Bien-être</span>
      <h2 id="ceremony7-title" className="ceremony7-title">Vos premiers résultats sont prêts</h2>
      <p className="ceremony7-text">Sept jours notés : {name} vous montre ce qui va avec votre bien-être, dans Objectifs.</p>
      {gutDaysLeft != null && (
        <p className="ceremony7-text">
          Pour le confort digestif, encore {gutDaysLeft} jour{gutDaysLeft > 1 ? 's' : ''} : la digestion demande un peu plus de recul.
        </p>
      )}
      <button type="button" className="btn ceremony7-action" onClick={onSee}>Voir mes objectifs</button>
      <button type="button" className="ceremony7-later" onClick={onClose}>Plus tard</button>
    </div>
  )
}
