import { useEffect, useState } from 'react'
import { formatAgo } from '../utils/timeAgo'
import { SNAPSHOT_FILE, readDeviceSnapshot } from './snapshot.js'

/**
 * Version iOS (dépôt HealthTrack-iOS) : bouton « Restaurer la copie de secours » de la page Vos données. La copie
 * (overlay/app/src/ios/snapshot.js) est passée à l'import comme un fichier choisi : même aperçu, puis ajouter ou
 * remplacer.
 * @param {{ onChoose: (file: { name: string, text: () => Promise<string> }) => void, read?: Function, now?: Date }} props
 */
export default function SnapshotRestore({ onChoose, read = readDeviceSnapshot, now }) {
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    let alive = true
    read().then((s) => alive && setSnapshot(s))
    return () => {
      alive = false
    }
  }, [read])

  if (!snapshot) return null
  // `.actions` (App.css d'Android) : l'écart sous « Choisir un fichier à importer », sans feuille de style en plus
  return (
    <div className="actions">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onChoose({ name: SNAPSHOT_FILE, text: async () => snapshot.text })}
      >
        {`Restaurer la copie de secours (${formatAgo(snapshot.savedAt, now || new Date())})`}
      </button>
    </div>
  )
}
