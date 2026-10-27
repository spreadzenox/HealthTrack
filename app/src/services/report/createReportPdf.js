/**
 * Rapport pour le médecin (N6b) : du journal au fichier PDF, puis au partage.
 *
 * Le rendu (`renderPdf.js`, pdf-lib + polices) est chargé à la demande : il ne pèse rien tant qu'on ne crée pas de
 * rapport. Rien ne quitte le téléphone sans un geste : le fichier est rangé dans Documents, puis Android propose
 * l'envoi (e-mail, messagerie…) ; c'est la personne qui choisit à qui l'envoyer, ou qui annule.
 */
import { listEntriesForAnalysis } from '../../storage/localHealthStorage'
import { CURRENT_VERSION } from '../updateCheck'
import { APP_NAME } from '../../config/brand'
import { buildReport, reportFileName } from './buildReport'

/**
 * @param {{ weeks?: number, includeWellbeing?: boolean, now?: Date, read?: () => Promise<object[]>,
 *   render?: (report: object) => Promise<Uint8Array> }} [opts]
 * @returns {Promise<{ bytes: Uint8Array, fileName: string, report: object }>}
 */
export async function createReportPdf({
  weeks,
  includeWellbeing = false,
  now = new Date(),
  read = listEntriesForAnalysis,
  render = defaultRender,
} = {}) {
  const entries = await read()
  const report = buildReport(entries, { now, weeks, includeWellbeing, appVersion: CURRENT_VERSION })
  const bytes = await render(report)
  return { bytes, fileName: reportFileName(now), report }
}

async function defaultRender(report) {
  const { loadReportFonts, renderReportPdf } = await import('./renderPdf')
  return renderReportPdf(report, { fonts: await loadReportFonts() })
}

/** Uint8Array → base64, par tranches (un PDF de 30 Ko dépasse la taille d'arguments de `String.fromCharCode`). */
export function bytesToBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function isAndroidNative() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

/**
 * Android : écrit le PDF dans Documents puis ouvre la feuille de partage ; ailleurs : téléchargement.
 * @returns {Promise<{ saved: 'documents'|'download', shared: boolean }>}
 */
export async function saveAndShareReport({ bytes, fileName }, { native = isAndroidNative } = {}) {
  if (await native()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: bytesToBase64(bytes),
      directory: Directory.Documents,
      recursive: true,
    })
    let shared = false
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: `Rapport ${APP_NAME}`, files: [uri], dialogTitle: 'Envoyer le rapport' })
      shared = true
    } catch {
      // Partage annulé ou indisponible : le fichier reste dans Documents
    }
    return { saved: 'documents', shared }
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { saved: 'download', shared: false }
}
