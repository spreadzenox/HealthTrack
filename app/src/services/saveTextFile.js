/**
 * Enregistre un fichier texte (EXPORT-CSV) : sur le téléphone, dans Documents puis la feuille de partage (Android
 * et iPhone, où un lien de téléchargement ne fait rien) ; dans un navigateur, un téléchargement.
 * @returns {Promise<{ saved: 'documents'|'download', platform: string, shared: boolean }>}
 */
function currentPlatform() {
  try {
    const p = typeof window !== 'undefined' ? window?.Capacitor?.getPlatform?.() : undefined
    return typeof p === 'string' && p ? p : 'web'
  } catch {
    return 'web'
  }
}

export async function saveTextFile({ fileName, text, mime, shareTitle = fileName }, { platform = currentPlatform } = {}) {
  const p = platform()
  if (p === 'android' || p === 'ios') {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: btoa(unescape(encodeURIComponent(text))),
      directory: Directory.Documents,
      recursive: true,
    })
    let shared = false
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: shareTitle, files: [uri], dialogTitle: shareTitle })
      shared = true
    } catch {
      // Partage annulé ou indisponible : le fichier reste dans Documents
    }
    return { saved: 'documents', platform: p, shared }
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { saved: 'download', platform: p, shared: false }
}
