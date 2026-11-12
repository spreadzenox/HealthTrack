import { useState } from 'react'
import PastelTiles from './PastelTiles'
import WellbeingPrompt from './WellbeingPrompt'
import { gutCardMode } from '../settings/onboarding'

/**
 * Journal vierge (POL-PLAY-46) : trois tuiles pastel (repas, ventre ou bien-être, source) au lieu d'une phrase grise
 * (« un peu triste », retour 6 du 24/10). Le ventre n'est proposé que si sa carte est sur l'Accueil (gutCardMode) ;
 * sinon, la note de bien-être, ouverte sur place (POL-PLAY-87). La tuile digestion ouvre la fenêtre « Ma digestion »
 * d'Aujourd'hui, le même geste et le même libellé que « Noter ma digestion » du bloc digestif (POLISH-JOURNAL-VIDE).
 */
export default function JournalEmpty() {
  const [noteOpen, setNoteOpen] = useState(false)
  const gut = gutCardMode() === 'show'
  const tiles = [
    { mealPhoto: true, theme: 'peach', icon: 'camera', label: 'Photographier un repas' },
    gut
      ? { to: '/', state: { open: 'digestion' }, theme: 'peach', icon: 'pen', label: 'Noter ma digestion' }
      : { onClick: () => setNoteOpen(true), theme: 'mint', icon: 'pen', label: 'Noter mon bien-être' },
    { to: '/connectors', theme: 'stone', icon: 'plus', label: 'Ajouter une source' },
  ]
  return (
    <div className="journal-empty">
      <p className="journal-empty-title">Rien de noté pour l’instant</p>
      <p className="journal-empty-text">Vos jours s’afficheront ici, en couleur.</p>
      <PastelTiles tiles={tiles} />
      <WellbeingPrompt open={noteOpen} onClose={() => setNoteOpen(false)} />
    </div>
  )
}
