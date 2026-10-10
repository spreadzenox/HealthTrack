import { useState, useRef } from 'react'
import { exportToJson, importFromJson, parseBackup, countAllEntries } from '../storage/localHealthStorage'
import '../Food.css'

async function isAndroidNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

function formatCount(n) {
  return n.toLocaleString('fr-FR')
}

function plural(n, singular, pluralForm = `${singular}s`) {
  return `${formatCount(n)} ${n > 1 ? pluralForm : singular}`
}

function formatDay(at) {
  return new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** « 12 repas · 30 notes de bien-être · 2 cigarettes · 1 200 mesures (montre, balance…) » */
function describeBackupContent(byType) {
  const { food = 0, wellbeing = 0, cigarette = 0, ...rest } = byType
  const measures = Object.values(rest).reduce((a, b) => a + b, 0)
  const parts = []
  if (food) parts.push(plural(food, 'repas', 'repas'))
  if (wellbeing) parts.push(plural(wellbeing, 'note de bien-être', 'notes de bien-être'))
  if (cigarette) parts.push(plural(cigarette, 'cigarette'))
  if (measures) parts.push(`${plural(measures, 'mesure')} (montre, balance…)`)
  return parts.join(' · ')
}

function importResultMessage({ imported, skipped = 0, invalid = 0 }, merge) {
  let msg
  if (imported === 0) msg = 'Aucune nouvelle entrée'
  else if (merge) msg = plural(imported, 'entrée ajoutée', 'entrées ajoutées')
  else msg = plural(imported, 'entrée importée', 'entrées importées')
  if (skipped) msg += ` (${plural(skipped, 'déjà présente', 'déjà présentes')}, non dupliquée${skipped > 1 ? 's' : ''})`
  if (invalid) msg += ` · ${plural(invalid, 'entrée illisible ignorée', 'entrées illisibles ignorées')}`
  return `${msg}. Le tableau de bord se met à jour.`
}

export default function Data() {
  const [exportStatus, setExportStatus] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = async () => {
    setExportStatus(null)
    try {
      const json = await exportToJson()
      const filename = `healthtrack-export-${new Date().toISOString().slice(0, 10)}.json`

      if (await isAndroidNative()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        // Convert JSON string to base64 for Filesystem.writeFile
        const base64 = btoa(unescape(encodeURIComponent(json)))
        await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
        })
        setExportStatus('Fichier enregistré dans le dossier Documents de votre appareil.')
      } else {
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setExportStatus('Téléchargement démarré. Enregistrez le fichier sur votre appareil (ex. Dossier Documents).')
      }
    } catch (e) {
      setExportStatus('Erreur : ' + (e.message || 'export impossible'))
    }
  }

  const [pending, setPending] = useState(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Étape 1 : lire et vérifier le fichier, sans rien écrire.
  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus(null)
    setPending(null)
    setConfirmReplace(false)
    try {
      const text = await file.text()
      const summary = parseBackup(text)
      if (summary.entries.length === 0) {
        setImportStatus('Cette sauvegarde est vide : rien à importer.')
        resetFileInput()
        return
      }
      const currentCount = await countAllEntries().catch(() => null)
      setPending({ text, summary, fileName: file.name, currentCount })
    } catch (err) {
      setImportStatus('Erreur : ' + (err.message || 'fichier illisible'))
      resetFileInput()
    }
  }

  // Étape 2 : ajouter (sans doublons) ou remplacer, sur choix explicite.
  const runImport = async (merge) => {
    if (!pending) return
    setImporting(true)
    setImportStatus(null)
    try {
      const result = await importFromJson(pending.text, { merge })
      setImportStatus(importResultMessage(result, merge))
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      setPending(null)
      setConfirmReplace(false)
      resetFileInput()
    } catch (err) {
      setImportStatus('Erreur : ' + (err.message || 'import impossible'))
    } finally {
      setImporting(false)
    }
  }

  const cancelImport = () => {
    setPending(null)
    setConfirmReplace(false)
    resetFileInput()
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Vos données</h2>
      <p className="page-intro">
        Toutes vos données (repas, bien-être, mesures de la montre et de la balance) sont stockées <strong>uniquement sur cet appareil</strong>.
        Elles survivent aux mises à jour de l’app. Pour les conserver après une réinstallation, exportez un fichier puis réimportez-le.
      </p>

      <div className="data-actions">
        <div className="data-block">
          <h3 className="section-title">Exporter (sauvegarde)</h3>
          <p className="data-hint">
            Téléchargez un fichier JSON contenant toutes vos entrées.
            Sur Android, le fichier est enregistré dans le dossier <strong>Documents</strong> de votre appareil
            (application Fichiers &gt; Téléphone &gt; Documents).
            Sur navigateur, le fichier est téléchargé via votre navigateur — enregistrez-le dans un dossier persistant.
          </p>
          <button type="button" className="btn" onClick={handleExport}>
            Télécharger la sauvegarde
          </button>
          {exportStatus && <p className="data-status">{exportStatus}</p>}
        </div>

        <div className="data-block">
          <h3 className="section-title">Importer (restaurer)</h3>
          <p className="data-hint">
            Après une réinstallation ou un changement de téléphone, choisissez un fichier exporté précédemment.
            Vous verrez son contenu avant de choisir : <strong>ajouter</strong> à vos données actuelles (sans doublons)
            ou les <strong>remplacer</strong>.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChosen}
            disabled={importing}
            aria-label="Choisir un fichier de sauvegarde"
            className="data-file-input"
          />
          {!pending && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              Choisir un fichier à importer
            </button>
          )}
          {pending && (
            <div className="import-preview" aria-live="polite">
              <p className="import-preview-title">
                {pending.summary.exportedAt
                  ? `Sauvegarde du ${formatDay(pending.summary.exportedAt)}`
                  : pending.fileName}
              </p>
              <p className="import-preview-line">
                <strong>{plural(pending.summary.entries.length, 'entrée')}</strong>
                {pending.summary.firstAt && (
                  <> du {formatDay(pending.summary.firstAt)} au {formatDay(pending.summary.lastAt)}</>
                )}
              </p>
              <p className="import-preview-line">{describeBackupContent(pending.summary.byType)}</p>
              {pending.summary.invalid > 0 && (
                <p className="import-preview-warning">
                  {plural(pending.summary.invalid, 'entrée illisible sera ignorée', 'entrées illisibles seront ignorées')}.
                </p>
              )}
              {!confirmReplace ? (
                <div className="import-preview-actions">
                  <button type="button" className="btn" onClick={() => runImport(true)} disabled={importing}>
                    {importing ? 'Import en cours…' : 'Ajouter à mes données'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirmReplace(true)}
                    disabled={importing}
                  >
                    Remplacer mes données
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelImport} disabled={importing}>
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="import-preview-confirm" role="alert">
                  <p className="import-preview-warning">
                    {pending.currentCount
                      ? `Vos ${plural(pending.currentCount, 'entrée actuelle sera supprimée', 'entrées actuelles seront supprimées')}`
                      : 'Toutes vos données actuelles seront supprimées'}{' '}
                    et remplacées par cette sauvegarde. Ce qui a été saisi depuis sera perdu.
                  </p>
                  <div className="import-preview-actions">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => runImport(false)}
                      disabled={importing}
                    >
                      {importing ? 'Import en cours…' : 'Confirmer le remplacement'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmReplace(false)}
                      disabled={importing}
                    >
                      Retour
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {importStatus && <p className="data-status">{importStatus}</p>}
        </div>
      </div>
    </section>
  )
}
