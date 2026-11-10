import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FEATURES } from '../config/distribution'
import { useEntitlement } from '../hooks/useEntitlement'
import { REPORT_DEFAULT_WEEKS, REPORT_PERIODS, defaultReportWeeks } from '../services/report/buildReport'
import { createReportPdf, saveAndShareReport } from '../services/report/createReportPdf'
import { countEntries, getFirstEntryAt } from '../storage/localHealthStorage'
import { GUT_TYPE } from '../services/today'

/** Notes du ventre et repas enregistrés : sans aucun des deux, le rapport serait vide. */
async function countReportEntries() {
  const [gut, food] = await Promise.all([countEntries({ type: GUT_TYPE }), countEntries({ type: 'food' })])
  return gut + food
}

/** Première note du ventre ou premier repas : la période proposée ne dépasse pas les jours d'usage. */
async function firstReportEntryAt() {
  const dates = (await Promise.all([getFirstEntryAt(GUT_TYPE), getFirstEntryAt('food')])).filter(Boolean)
  return dates.length ? dates.sort()[0] : null
}

/**
 * « Rapport PDF pour mon médecin » (N6b), en bas d'Analyses et dans Données : période de 2, 4 ou 12 semaines, bien-être
 * estimé exclu sauf case cochée (donnée sensible et estimation), puis fichier dans Documents et feuille de partage.
 * Premium sur la version Play (offert pendant le lancement) ; libre en sideload. Sans aucune note du ventre ni aucun
 * repas, pas de rapport vide : une phrase dit quand il se remplit (un comptage en échec laisse le bouton), et pas de
 * « Débloquer » sur la version Play tant qu'il n'y a rien à mettre dedans (POL-PLAY-79). La période proposée est la
 * plus courte qui couvre les jours d'usage (POLISH-SIM-12), sauf si la personne en a déjà choisi une.
 */
export default function DoctorReportCard({
  create = createReportPdf,
  save = saveAndShareReport,
  count = countReportEntries,
  firstAt = firstReportEntryAt,
}) {
  const [ent] = useEntitlement()
  const premium = !FEATURES.billing || ent.premium
  const [open, setOpen] = useState(false)
  const [weeks, setWeeks] = useState(REPORT_DEFAULT_WEEKS)
  const [wellbeing, setWellbeing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [empty, setEmpty] = useState(false)
  const chosen = useRef(false)
  const card = useRef(null)
  const { hash } = useLocation()

  // Depuis Agir (« votre rapport médecin ») : la carte vient à l'écran.
  useEffect(() => {
    if (hash === '#rapport-medecin') card.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [hash])

  useEffect(() => {
    let alive = true
    firstAt().then((at) => { if (alive && !chosen.current) setWeeks(defaultReportWeeks(at)) }, () => {})
    return () => { alive = false }
  }, [firstAt])

  useEffect(() => {
    let alive = true
    count().then((n) => { if (alive) setEmpty(n === 0) }, () => {})
    return () => { alive = false }
  }, [count])

  const run = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const pdf = await create({ weeks, includeWellbeing: wellbeing })
      const { saved } = await save(pdf)
      setStatus(saved === 'documents'
        ? `${pdf.fileName} est dans Documents (app Fichiers › Documents).`
        : `${pdf.fileName} téléchargé.`)
    } catch (e) {
      setStatus('Le rapport n’a pas pu être créé : ' + (e?.message || 'erreur inconnue') + '.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article id="rapport-medecin" ref={card} className="today-card fodmap-card report-card" data-testid="doctor-report">
      <span className="today-card-title">Rapport PDF pour mon médecin</span>
      <p className="today-card-text">
        Deux pages à montrer à votre médecin ou à votre diététicienne. Le fichier est créé sur le téléphone, et
        c’est vous qui l’envoyez.
      </p>
      {!premium && <span className="fodmap-tag">premium</span>}
      {!premium && !empty && <Link to="/premium" className="btn fodmap-cta">Débloquer</Link>}
      {empty && (
        <p className="fodmap-note">Le rapport se remplit dès votre première note digestive ou votre premier repas.</p>
      )}
      {premium && !empty && !open && (
        <button type="button" className="btn btn-secondary fodmap-cta" onClick={() => setOpen(true)}>
          Préparer le rapport
        </button>
      )}
      {premium && !empty && open && (
        <>
          <fieldset className="report-periods">
            <legend>Période</legend>
            {REPORT_PERIODS.map((w) => (
              <label key={w} className={`report-period${w === weeks ? ' is-on' : ''}`}>
                <input
                  type="radio"
                  name="report-weeks"
                  value={w}
                  checked={w === weeks}
                  onChange={() => { chosen.current = true; setWeeks(w) }}
                />
                <span><span className="mono">{w}</span> sem.</span>
              </label>
            ))}
          </fieldset>
          <label className="fodmap-reminder-row">
            <input type="checkbox" checked={wellbeing} onChange={(e) => setWellbeing(e.target.checked)} />
            Inclure mon bien-être estimé (caméra)
          </label>
          <button type="button" className="btn fodmap-cta" onClick={run} disabled={busy}>
            {busy ? 'Création…' : 'Créer le PDF'}
          </button>
          {status && <p className="fodmap-note" role="status">{status}</p>}
        </>
      )}
    </article>
  )
}
