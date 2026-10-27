import { useState, useRef } from 'react'
import { exportToJson, importFromJson, parseBackup, countAllEntries } from '../storage/localHealthStorage'
import { compactWatchSpo2Once } from '../services/spo2Slots'
import { fixWatchKcalOnce } from '../services/watchKcalFix'
import { deleteAllMyData } from '../services/deleteAllData'
import { activityLevel } from '../services/nutrientReferenceIntakes'
import { APP_NAME } from '../config/brand'
import DoctorReportCard from '../components/DoctorReportCard'
import '../Food.css'
import { appLocale } from '../i18n/locale.js'

async function isAndroidNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

function formatCount(n) {
  return n.toLocaleString(appLocale())
}

function plural(n, singular, pluralForm = `${singular}s`) {
  return `${formatCount(n)} ${n > 1 ? pluralForm : singular}`
}

function formatDay(at) {
  return new Date(at).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** « 12 repas · 30 notes de bien-être · 2 cigarettes · 1 200 mesures (montre, balance…) » */
function describeBackupContent(byType) {
  const { food = 0, wellbeing = 0, cigarette = 0, face_burst: face = 0, ...rest } = byType
  const measures = Object.values(rest).reduce((a, b) => a + b, 0)
  const parts = []
  if (food) parts.push(plural(food, 'repas', 'repas'))
  if (wellbeing) parts.push(plural(wellbeing, 'note de bien-être', 'notes de bien-être'))
  if (cigarette) parts.push(plural(cigarette, 'cigarette'))
  if (measures) parts.push(`${plural(measures, 'mesure')} (montre, balance…)`)
  if (face) parts.push(plural(face, 'lecture du visage', 'lectures du visage'))
  return parts.join(' · ')
}

/** « Profil : femme · née en 1990 · 163 cm · actif » */
function describeProfile(profile) {
  const parts = []
  if (profile.sex) parts.push(profile.sex === 'F' ? 'femme' : 'homme')
  if (profile.birthYear) parts.push(`${profile.sex === 'F' ? 'née' : profile.sex === 'M' ? 'né' : 'naissance'} en ${profile.birthYear}`)
  if (profile.heightCm) parts.push(`${profile.heightCm} cm`)
  if (profile.activity) parts.push(activityLevel(profile.activity).label.toLowerCase())
  return `Profil : ${parts.join(' · ')}`
}

function importResultMessage({ imported, skipped = 0, invalid = 0, profileRestored = false }, merge) {
  let msg
  if (imported === 0) msg = 'Aucune nouvelle entrée'
  else if (merge) msg = plural(imported, 'entrée ajoutée', 'entrées ajoutées')
  else msg = plural(imported, 'entrée importée', 'entrées importées')
  if (skipped) msg += ` (${plural(skipped, 'déjà présente', 'déjà présentes')}, non dupliquée${skipped > 1 ? 's' : ''})`
  if (invalid) msg += ` · ${plural(invalid, 'entrée illisible ignorée', 'entrées illisibles ignorées')}`
  if (profileRestored) msg += '. Profil (sexe, âge, taille, activité) restauré'
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
        setExportStatus(`${filename} enregistré dans Documents (app Fichiers > Téléphone > Documents).`)
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
      // Un ancien fichier peut ramener des SpO₂ « minute » de la montre : regroupées par 10 min (I82)
      await compactWatchSpo2Once({ force: true })
      await fixWatchKcalOnce({ force: true })
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

  // Supprimer toutes mes données : confirmation avec le nombre d'entrées, export proposé juste avant (VC-10).
  const [wipe, setWipe] = useState(null)
  const [wipeStatus, setWipeStatus] = useState(null)

  const askWipe = async () => {
    setWipeStatus(null)
    setWipe({ count: null, running: false })
    const count = await countAllEntries().catch(() => null)
    setWipe((w) => (w ? { ...w, count } : w))
  }

  const runWipe = async () => {
    setWipe((w) => ({ ...w, running: true }))
    try {
      const { entries } = await deleteAllMyData()
      setWipe(null)
      setExportStatus(null)
      setWipeStatus(
        `${entries ? plural(entries, 'entrée supprimée', 'entrées supprimées') : 'Aucune entrée à supprimer'}, profil effacé. ` +
          'Vos réglages et connexions restent : seules les nouvelles mesures arriveront.'
      )
    } catch (err) {
      setWipe((w) => ({ ...w, running: false }))
      setWipeStatus('Erreur : ' + (err.message || 'suppression impossible') + '. Rien n’a été supprimé.')
    }
  }

  return (
    <section className="food-page">
      <h2 className="page-title">Vos données</h2>
      <p className="page-intro">
        Vos données restent <strong>sur cet appareil</strong> et survivent aux mises à jour. Si la sauvegarde
        Google du téléphone est activée, elles y sont incluses (chiffrées, gérées par Android,
        jamais lues par {APP_NAME}). Avant de réinstaller ou de changer de téléphone, exportez-les aussi.
      </p>

      <div className="data-actions">
        <div className="data-block">
          <h3 className="section-title">Exporter (sauvegarde)</h3>
          <p className="data-hint">
            Un fichier avec toutes vos entrées et votre profil, rangé dans <strong>Documents</strong>.
          </p>
          <button type="button" className="btn" onClick={handleExport}>
            Télécharger la sauvegarde
          </button>
          {exportStatus && <p className="data-status">{exportStatus}</p>}
        </div>

        <DoctorReportCard />

        <div className="data-block">
          <h3 className="section-title">Importer (restaurer)</h3>
          <p className="data-hint">
            Vous verrez son contenu avant de choisir : <strong>ajouter</strong> (sans doublons) ou <strong>remplacer</strong>.
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
              {pending.summary.profile && (
                <p className="import-preview-line">{describeProfile(pending.summary.profile)}</p>
              )}
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

        <div className="data-block">
          <h3 className="section-title">Supprimer</h3>
          <p className="data-hint">
            Efface de ce téléphone vos repas, notes, mesures, lectures du visage et votre profil. Nos serveurs
            ne gardent rien : il n’y a rien d’autre à effacer.
          </p>
          {!wipe ? (
            <button type="button" className="btn btn-secondary" onClick={askWipe}>
              Supprimer toutes mes données
            </button>
          ) : (
            <div className="import-preview-confirm" role="alert">
              <p className="import-preview-warning">
                {wipe.count
                  ? `Vos ${plural(wipe.count, 'entrée sera supprimée', 'entrées seront supprimées')}, avec votre profil.`
                  : 'Toutes vos données seront supprimées, avec votre profil.'}{' '}
                C’est définitif : exportez-les d’abord si vous voulez les garder.
              </p>
              <p className="data-hint">
                Restent : vos réglages, vos connexions (montre, Health Connect), votre abonnement et vos crédits IA.
              </p>
              <div className="import-preview-actions">
                <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={wipe.running}>
                  Exporter d’abord
                </button>
                <button type="button" className="btn btn-danger" onClick={runWipe} disabled={wipe.running}>
                  {wipe.running ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setWipe(null)} disabled={wipe.running}>
                  Garder mes données
                </button>
              </div>
              {exportStatus && <p className="data-status">{exportStatus}</p>}
            </div>
          )}
          {wipeStatus && <p className="data-status">{wipeStatus}</p>}
        </div>
      </div>
    </section>
  )
}
