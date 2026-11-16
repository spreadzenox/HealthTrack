/**
 * Studio Pilou (refonte « Compagnon », étape 14 ; specs/double.SPEC.md § 9) : Pilou porte vos traits, réglés à la
 * main. Onglets Cheveux · Visage · Yeux · Lunettes · Accessoires, aperçu en direct, « Surprenez-moi », « Valider »,
 * « Revenir au Pilou d'origine ». Les champs « À vérifier » (fiche venue d'une photo) ont un point ambre et un bandeau ;
 * toucher la valeur la confirme. La fiche reste sur le téléphone (fiche.js). Aucun texte ne commente l'apparence :
 * les libellés décrivent des réglages.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SCHEMA, COUVRE_CHEFS, PAL_CHEVEUX, PAL_YEUX, PAL_MONTURE, PAL_COUVRE, NOMS_CHAMPS,
  normaliser, changer, incompatibilite, tirer, libelle, decrire, APPARITION, familleDe,
} from './traits'
import { isReducedMotion } from '../motion'
import { loadFiche, saveFiche, resetFiche } from './fiche'
import { dessinerPilou } from './apercu2d'
import { nomDePilou } from './nom'

const ONGLETS = [
  { id: 'cheveux', label: 'Cheveux', icone: '〰', champs: ['cheveux.longueur', 'cheveux.texture', 'cheveux.coiffure', 'cheveux.couleur', 'cheveux.meches', 'cheveux.volume'] },
  { id: 'visage', label: 'Visage', icone: '◡', champs: ['sourcils.epaisseur', 'sourcils.forme', 'barbe.type', 'barbe.couleur', 'peau.taches_de_rousseur', 'peau.grain_de_beaute'] },
  { id: 'yeux', label: 'Yeux', icone: '◉', champs: ['yeux.couleur', 'yeux.forme'] },
  { id: 'lunettes', label: 'Lunettes', icone: '◎', champs: ['lunettes.type', 'lunettes.couleur'] },
  { id: 'accessoires', label: 'Accessoires', icone: '✦', champs: ['couvre_chef', 'oreilles.boucles', 'oreilles.piercing_nez'] },
]

const TITRES = {
  'cheveux.longueur': 'Longueur', 'cheveux.texture': 'Texture', 'cheveux.coiffure': 'Coiffure', 'cheveux.couleur': 'Couleur',
  'cheveux.meches': 'Mèches', 'cheveux.volume': 'Volume', 'sourcils.epaisseur': 'Sourcils', 'sourcils.forme': 'Forme des sourcils',
  'barbe.type': 'Barbe', 'barbe.couleur': 'Couleur de la barbe', 'peau.taches_de_rousseur': 'Taches de rousseur',
  'peau.grain_de_beaute': 'Grain de beauté', 'yeux.couleur': 'Couleur', 'yeux.forme': 'Forme', 'lunettes.type': 'Monture',
  'lunettes.couleur': 'Couleur', couvre_chef: 'Couvre-chef', 'oreilles.boucles': "Boucles d'oreilles", 'oreilles.piercing_nez': 'Piercing du nez',
}
const AIDES = { couvre_chef: 'Choisi par vous seulement.' }

function valeursDe(chemin) {
  if (chemin === 'couvre_chef') return COUVRE_CHEFS
  const [fam, k] = chemin.split('.')
  return SCHEMA[fam][k]
}
function valeurDans(fiche, chemin) {
  if (!fiche) return undefined
  if (chemin === 'couvre_chef') return fiche.couvre_chef
  const [fam, k] = chemin.split('.')
  return fiche[fam]?.[k]
}
/** Pastille de couleur (cheveux, yeux, montures, couvre-chefs) ; null : choix en texte. */
function pastille(chemin, v) {
  if (chemin === 'cheveux.couleur') return PAL_CHEVEUX[v][0]
  if (chemin === 'yeux.couleur') return PAL_YEUX[v][1]
  if (chemin === 'lunettes.couleur') return PAL_MONTURE[v][0]
  return null
}
/** Un champ n'a de sens qu'avec certains choix (pas de couleur sans lunettes ni barbe). */
function visible(fiche, chemin) {
  if (chemin === 'lunettes.couleur') return fiche?.lunettes?.type && fiche.lunettes.type !== 'aucune'
  if (chemin === 'barbe.couleur') return fiche?.barbe?.type && fiche.barbe.type !== 'aucune'
  return true
}

function Apercu({ fiche, description, anim }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c?.getContext?.('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth || 300, h = c.clientHeight || 240
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const reduit = isReducedMotion()
    const cles = anim ? (anim.cle === 'tout' ? Object.keys(APPARITION) : [anim.cle]) : []
    const duree = reduit ? 200 : anim?.cle === 'tout' ? 700 : APPARITION[anim?.cle] || 500
    if (!cles.length || typeof requestAnimationFrame !== 'function') {
      dessinerPilou(ctx, w, h, fiche)
      return
    }
    let id = 0
    const t0 = performance.now()
    const image = (now) => {
      const p = Math.min(1, (now - t0) / duree)
      const rv = Object.fromEntries(cles.map((k) => [k, p]))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dessinerPilou(ctx, w, h, fiche, { rv, reduit })
      if (p < 1) id = requestAnimationFrame(image)
    }
    id = requestAnimationFrame(image)
    return () => cancelAnimationFrame(id)
  }, [fiche, anim])
  return (
    <div className="studio-apercu">
      <canvas ref={ref} className="studio-apercu-canvas" aria-hidden="true" />
      <p className="studio-apercu-texte" aria-live="polite">{description}</p>
    </div>
  )
}

export default function Studio() {
  const nom = nomDePilou()
  const [pret, setPret] = useState(false)
  const [brouillon, setBrouillon] = useState(null)
  const [onglet, setOnglet] = useState('cheveux')
  const [merci, setMerci] = useState('')
  const [message, setMessage] = useState('')
  const [anim, setAnim] = useState(null)
  const tours = useRef(0)
  const graine = useRef(0)

  useEffect(() => {
    let vivant = true
    loadFiche().then((f) => {
      if (!vivant) return
      setBrouillon(f)
      const premier = f?.incertains?.[0]
      if (premier) setOnglet(ONGLETS.find((o) => o.champs.includes(premier))?.id || 'cheveux')
      setPret(true)
    })
    return () => { vivant = false }
  }, [])

  const incertains = useMemo(() => brouillon?.incertains || [], [brouillon])
  const ongletCourant = ONGLETS.find((o) => o.id === onglet)

  function choisir(chemin, v) {
    const etait = incertains.includes(chemin)
    const base = brouillon || normaliser({}).fiche
    setBrouillon(changer(base, chemin, v))
    setAnim({ cle: brouillon ? familleDe(chemin) : 'tout', n: (tours.current += 1) })
    setMessage('')
    if (etait) {
      const n = NOMS_CHAMPS[chemin] || 'ce réglage'
      setMerci(`${n.charAt(0).toUpperCase()}${n.slice(1)} : vérifié, merci !`)
    }
  }
  function surprendre() {
    // la graine change à chaque toucher (SPEC § 9) ; elle part de l'heure pour ne pas toujours tirer le même Pilou
    graine.current = graine.current ? graine.current + 1 : Date.now() % 100000
    setBrouillon(tirer(graine.current))
    setAnim({ cle: 'tout', n: graine.current })
    setMerci('')
    setMessage('')
  }
  async function valider() {
    try {
      await saveFiche(brouillon)
      setMessage(`${nom} est prêt. Fiche gardée sur ce téléphone.`)
    } catch {
      setMessage("La fiche n'a pas pu être gardée. Réessayez.")
    }
  }
  async function origine() {
    try {
      await resetFiche()
    } catch { /* rien de gardé : déjà le Pilou d'origine */ }
    setBrouillon(null)
    setMerci('')
    setMessage(`${nom} est revenu à son apparence d'origine.`)
  }

  if (!pret) return <section className="food-page studio-page"><h2 className="page-title">Studio {nom}</h2></section>

  return (
    <section className="food-page studio-page">
      <h2 className="page-title">Studio {nom}</h2>
      <p className="page-intro">{nom} garde son corps, son antenne et sa montre. Vous choisissez ses traits.</p>

      <Apercu fiche={brouillon} description={decrire(brouillon, nom)} anim={anim} />

      {incertains.length > 0 && (
        <div className="studio-bandeaux">
          {incertains.map((c) => (
            <p key={c} className="studio-bandeau">À vérifier : {NOMS_CHAMPS[c]}</p>
          ))}
        </div>
      )}
      {merci && <p className="studio-merci" role="status">{merci}</p>}

      <div className="studio-onglets" role="tablist" aria-label="Traits">
        {ONGLETS.map((o) => {
          const aVerifier = o.champs.some((c) => incertains.includes(c))
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              id={`studio-onglet-${o.id}`}
              aria-selected={onglet === o.id}
              aria-controls="studio-panneau"
              className={`studio-onglet${onglet === o.id ? ' is-active' : ''}`}
              onClick={() => { setOnglet(o.id); setMerci('') }}
            >
              <span className="studio-onglet-icone" aria-hidden="true">{o.icone}</span>
              <span>{o.label}</span>
              {aVerifier && <span className="studio-point" aria-label="à vérifier" />}
            </button>
          )
        })}
      </div>

      <div className="studio-panneau" id="studio-panneau" role="tabpanel" aria-labelledby={`studio-onglet-${onglet}`}>
        {!brouillon && <p className="studio-aide">Touchez un réglage pour commencer.</p>}
        {ongletCourant.champs.filter((c) => visible(brouillon, c)).map((chemin) => {
          const actuelle = valeurDans(brouillon, chemin)
          const raisons = new Set()
          const titreId = `studio-${chemin.replace('.', '-')}`
          return (
            <fieldset key={chemin} className="studio-champ">
              <legend id={titreId} className="studio-champ-titre">
                {TITRES[chemin]}
                {incertains.includes(chemin) && <span className="studio-a-verifier"> · à vérifier</span>}
              </legend>
              {AIDES[chemin] && <p className="studio-aide">{AIDES[chemin]}</p>}
              <div className="studio-choix" role="radiogroup" aria-labelledby={titreId}>
                {valeursDe(chemin).map((v) => {
                  const raison = brouillon && chemin !== 'couvre_chef' ? incompatibilite(brouillon, chemin, v) : null
                  if (raison) raisons.add(raison)
                  const sel = actuelle === v
                  const couleur = pastille(chemin, v) || (chemin === 'couvre_chef' && v !== 'aucun' ? PAL_COUVRE[v] : null)
                  const lib = libelle(v, chemin)
                  const lu = `${lib}${sel ? ', sélectionné' : ''}${sel && incertains.includes(chemin) ? ', à vérifier' : ''}${raison ? `, indisponible : ${raison}` : ''}`
                  return (
                    <button
                      key={String(v)}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      aria-label={lu}
                      disabled={!!raison}
                      title={raison || undefined}
                      className={`studio-option${couleur ? ' has-pastille' : ''}${sel ? ' is-selected' : ''}`}
                      onClick={() => choisir(chemin, v)}
                    >
                      {couleur && <span className="studio-pastille" style={{ background: couleur }} aria-hidden="true" />}
                      <span className="studio-option-texte">{lib}</span>
                    </button>
                  )
                })}
              </div>
              {raisons.size > 0 && <p className="studio-raison">Grisé : {[...raisons].join(' · ')}</p>}
            </fieldset>
          )
        })}
      </div>

      <div className="studio-actions">
        <button type="button" className="btn btn-secondary" onClick={surprendre}>Surprenez-moi</button>
        <button type="button" className="btn" onClick={valider} disabled={!brouillon}>Valider</button>
      </div>
      <button type="button" className="studio-lien" onClick={origine}>Revenir au {nom} d'origine</button>
      {message && <p className="studio-message" role="status">{message}</p>}
    </section>
  )
}
