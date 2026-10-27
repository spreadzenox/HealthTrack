import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FEATURES } from '../config/distribution'
import { useEntitlement } from '../hooks/useEntitlement'
import { REPORT_DEFAULT_WEEKS, REPORT_PERIODS } from '../services/report/buildReport'
import { createReportPdf, saveAndShareReport } from '../services/report/createReportPdf'

/**
 * « Rapport PDF pour mon médecin » (N6b), en bas d'Analyses et dans Données : période de 2, 4 ou 12 semaines, bien-être
 * estimé exclu sauf case cochée (donnée sensible et estimation), puis fichier dans Documents et feuille de partage.
 * Premium sur la version Play (offert pendant le lancement) ; libre en sideload.
 */
export default function DoctorReportCard({ create = createReportPdf, save = saveAndShareReport }) {
  const [ent] = useEntitlement()
  const premium = !FEATURES.billing || ent.premium
  const [open, setOpen] = useState(false)
  const [weeks, setWeeks] = useState(REPORT_DEFAULT_WEEKS)
  const [wellbeing, setWellbeing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

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
    <article className="today-card fodmap-card report-card" data-testid="doctor-report">
      <span className="today-card-title">Rapport PDF pour mon médecin</span>
      <p className="today-card-text">
        Votre ventre semaine par semaine, vos repas et vos pistes, sur 2 pages. Créé sur votre téléphone : vous
        choisissez à qui l’envoyer.
      </p>
      {!premium && (
        <>
          <span className="fodmap-tag mono">premium</span>
          <Link to="/premium" className="btn fodmap-cta">Débloquer</Link>
        </>
      )}
      {premium && !open && (
        <button type="button" className="btn btn-secondary fodmap-cta" onClick={() => setOpen(true)}>
          Préparer le rapport
        </button>
      )}
      {premium && open && (
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
                  onChange={() => setWeeks(w)}
                />
                <span className="mono">{w} sem.</span>
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
