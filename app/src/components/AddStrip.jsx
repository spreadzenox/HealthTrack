/**
 * Bandeau d'ajout de l'Accueil (nouvel écran Aujourd'hui, revue design du propriétaire du 07/11, AUJ-1) : le seul
 * vrai endroit pour ajouter, juste sous la date. Repas en photo (ouvre l'appareil photo), bien-être (note de 1 à 5),
 * digestion (note digestive dans une fenêtre), cigarette si le compteur est actif, et « Autre chose » pour le reste.
 * Chaque bouton garde la couleur de son thème (leçon 12) : vert = bien-être, orange = digestion, neutre = le reste.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import MealPhotoButton from './MealPhotoButton'
import LineIcon from './LineIcon'
import './AddStrip.css'

function Sheet({ title, onClose, children }) {
  const id = `add-sheet-${title.replace(/\W+/g, '-')}`
  return (
    <div className="wellbeing-modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wellbeing-modal add-sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="add-sheet-head">
          <h2 id={id} className="wellbeing-modal-title">{title}</h2>
          <button type="button" className="add-sheet-close" aria-label="Fermer" onClick={onClose}>
            <LineIcon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * @param {{
 *   onWellbeing: () => void,
 *   digestion?: import('react').ReactNode,
 *   stool?: import('react').ReactNode,
 *   cigarette?: import('react').ReactNode,
 *   cigaretteInStrip?: boolean,
 *   open?: null | 'digestion' | 'stool' | 'other',
 *   onOpenChange?: (open: null | 'digestion' | 'stool' | 'other') => void,
 * }} props
 *   `open` / `onOpenChange` : fenêtre ouverte, pilotable de l'extérieur (« Noter ma digestion » du bloc digestif,
 *   AUJ-4 : le même geste que le bouton du bandeau).
 */
export default function AddStrip({
  onWellbeing, digestion = null, stool = null, cigarette = null, cigaretteInStrip = false, open: openProp, onOpenChange,
}) {
  const [innerOpen, setInnerOpen] = useState(null)
  const open = openProp !== undefined ? openProp : innerOpen
  const setOpen = onOpenChange ?? setInnerOpen
  const close = () => setOpen(null)
  return (
    <section id="today-add" className="add-strip" aria-label="Ajouter">
      <div className="add-strip-row">
        <MealPhotoButton className="add-chip is-meal">
          <LineIcon name="camera" size={22} />
          <span>Repas</span>
        </MealPhotoButton>
        <button type="button" className="add-chip is-wellbeing" onClick={onWellbeing}>
          <LineIcon name="smile" size={22} />
          <span>Bien-être</span>
        </button>
        {digestion && (
          <button type="button" className="add-chip is-digestion" onClick={() => setOpen('digestion')}>
            <LineIcon name="digestion" size={22} />
            <span>Digestion</span>
          </button>
        )}
        {/* AUJ-1b : la photo des selles, geste explicite ; la fenêtre dit ce qui part avant d'ouvrir l'appareil photo */}
        {stool && (
          <button type="button" className="add-chip is-digestion" onClick={() => setOpen('stool')}>
            <LineIcon name="camera" size={22} />
            <span>Selles</span>
          </button>
        )}
        {cigarette && cigaretteInStrip && <div className="add-chip-slot">{cigarette}</div>}
        <button type="button" className="add-chip" onClick={() => setOpen('other')}>
          <LineIcon name="dots" size={22} />
          <span>Autre chose</span>
        </button>
      </div>

      {open === 'digestion' && <Sheet title="Ma digestion" onClose={close}>{digestion}</Sheet>}
      {open === 'stool' && <Sheet title="Photo des selles" onClose={close}>{stool}</Sheet>}
      {open === 'other' && (
        <Sheet title="Autre chose" onClose={close}>
          <div className="add-sheet-list">
            <Link to="/food" state={{ describeMeal: true }} className="add-sheet-item">
              <LineIcon name="pen" size={20} />
              Décrire un repas
            </Link>
            {cigarette && !cigaretteInStrip && cigarette}
          </div>
        </Sheet>
      )}
    </section>
  )
}
