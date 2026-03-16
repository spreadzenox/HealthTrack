import { useState, useRef } from 'react'
import { exportToJson, importFromJson } from '../storage/localHealthStorage'
import '../Food.css'

export default function Data() {
  const [exportStatus, setExportStatus] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = async () => {
    setExportStatus(null)
    try {
      const json = await exportToJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `healthtrack-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('Téléchargement démarré. Enregistrez le fichier sur votre appareil (ex. Dossier Documents).')
    } catch (e) {
      setExportStatus('Erreur : ' + (e.message || 'export impossible'))
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportStatus(null)
    try {
      const text = await file.text()
      const { imported } = await importFromJson(text, { merge: false })
      setImportStatus(`${imported} entrée(s) importée(s). Le tableau de bord se met à jour.`)
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setImportStatus('Erreur : ' + (err.message || 'import impossible'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Vos données</h2>
      <p className="page-intro">
        Toutes vos données (repas, et plus tard montre, balance) sont stockées <strong>uniquement sur cet appareil</strong>, dans le navigateur.
        Elles survivent aux mises à jour de l’app. Pour les conserver après une réinstallation, exportez un fichier puis réimportez-le.
      </p>

      <div className="data-actions">
        <div className="data-block">
          <h3 className="section-title">Exporter (sauvegarde)</h3>
          <p className="data-hint">Téléchargez un fichier JSON contenant toutes vos entrées. Enregistrez-le dans un dossier persistant (ex. Documents).</p>
          <button type="button" className="btn" onClick={handleExport}>
            Télécharger la sauvegarde
          </button>
          {exportStatus && <p className="data-status">{exportStatus}</p>}
        </div>

        <div className="data-block">
          <h3 className="section-title">Importer (restaurer)</h3>
          <p className="data-hint">Après une réinstallation, choisissez un fichier exporté précédemment pour restaurer vos données (remplace les données actuelles).</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            disabled={importing}
            aria-label="Choisir un fichier de sauvegarde"
            className="data-file-input"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Import en cours…' : 'Choisir un fichier à importer'}
          </button>
          {importStatus && <p className="data-status">{importStatus}</p>}
        </div>
      </div>
    </section>
  )
}
