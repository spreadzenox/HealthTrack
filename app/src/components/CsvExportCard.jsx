import { useState } from 'react'
import { exportToJson } from '../storage/localHealthStorage'
import { saveTextFile } from '../services/saveTextFile'
import { csvContents, csvFileName, entriesToCsv } from '../services/csvExport'
import { APP_NAME } from '../config/brand'

const frDay = (iso) => iso.split('-').reverse().join('/')

/** « 3 lignes, du 20/11/2026 au 22/11/2026 : Cœur 2 · Oxygène du sang 1 » (POLISH-SIM-163 ; « · » jamais en début de ligne) */
function contentsText({ rows, from, to, kinds }) {
  if (!rows) return 'Aucune saisie : le fichier n’a que la ligne des titres.'
  const n = `${rows.toLocaleString('fr-FR')} ligne${rows > 1 ? 's' : ''}`
  const period = from === to ? `le ${frDay(from)}` : `du ${frDay(from)} au ${frDay(to)}`
  return `${n}, ${period} : ${kinds.map((k) => `${k.label} ${k.count.toLocaleString('fr-FR')}`).join('\u00a0· ')}`
}

/** Données › Sauvegarde : toutes les saisies en CSV, pour un tableur (EXPORT-CSV, décision du 20/10). */
export default function CsvExportCard({ disabled = false }) {
  const [status, setStatus] = useState(null)
  const [contents, setContents] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setStatus(null)
    setContents(null)
    setBusy(true)
    try {
      // Même lecture que la sauvegarde : aucune limite par type, rien d'oublié
      const { entries = [] } = JSON.parse(await exportToJson())
      const fileName = csvFileName()
      const { saved, platform } = await saveTextFile({ fileName, text: entriesToCsv(entries), mime: 'text/csv', shareTitle: 'Vos données en CSV' })
      setContents(contentsText(csvContents(entries)))
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
        Un fichier CSV, une ligne par saisie : repas, digestion, bien-être et mesures de vos montres. Pour restaurer vos
        données, gardez la sauvegarde JSON.
      </p>
      <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={disabled || busy}>
        Télécharger en CSV
      </button>
      {status && <p className="data-status">{status}</p>}
      {contents && <p className="data-hint" data-testid="csv-contents">{contents}</p>}
    </div>
  )
}
