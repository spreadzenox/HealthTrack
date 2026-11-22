import { useState } from 'react'
import { exportToJson } from '../storage/localHealthStorage'
import { saveTextFile } from '../services/saveTextFile'
import { csvFileName, entriesToCsv } from '../services/csvExport'
import { APP_NAME } from '../config/brand'

/** Données › Sauvegarde : toutes les saisies en CSV, pour un tableur (EXPORT-CSV, décision du 20/10). */
export default function CsvExportCard({ disabled = false }) {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setStatus(null)
    setBusy(true)
    try {
      // Même lecture que la sauvegarde : aucune limite par type, rien d'oublié
      const { entries = [] } = JSON.parse(await exportToJson())
      const fileName = csvFileName()
      const { saved, platform } = await saveTextFile({ fileName, text: entriesToCsv(entries), mime: 'text/csv', shareTitle: 'Vos données en CSV' })
      if (saved === 'download') setStatus(`${fileName} téléchargé.`)
      else if (platform === 'ios') setStatus(`${fileName} est aussi dans l’app Fichiers › Sur mon iPhone › ${APP_NAME}.`)
      else setStatus(`${fileName} est dans Documents (app Fichiers › Documents).`)
    } catch (e) {
      setStatus('Erreur : ' + (e?.message || 'export impossible'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="data-block" data-testid="csv-export">
      <h3 className="section-title">Exporter pour un tableur</h3>
      <p className="data-hint">
        Un fichier CSV, une ligne par saisie : repas, digestion, bien-être, mesures. Pour restaurer vos données, gardez
        la sauvegarde JSON.
      </p>
      <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={disabled || busy}>
        Télécharger en CSV
      </button>
      {status && <p className="data-status">{status}</p>}
    </div>
  )
}
