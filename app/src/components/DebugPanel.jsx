import { useDebug } from '../contexts/DebugContext'
import './DebugPanel.css'

const LEVEL_EMOJI = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  debug: '🔍',
}

function formatTs(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

/**
 * In-app debug panel.
 * Rendered only when debugMode is active (checked by the parent).
 */
export default function DebugPanel({ filter }) {
  const { entries, clearLog } = useDebug()

  const filtered = filter
    ? entries.filter(
        (e) =>
          e.tag.toLowerCase().includes(filter.toLowerCase()) ||
          e.message.toLowerCase().includes(filter.toLowerCase()),
      )
    : entries

  const exportLog = () => {
    const text = filtered
      .map((e) => {
        const data = e.data !== undefined ? '\n  ' + JSON.stringify(e.data, null, 2).replace(/\n/g, '\n  ') : ''
        return `[${e.ts}] [${e.level.toUpperCase()}] [${e.tag}] ${e.message}${data}`
      })
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `healthtrack-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="debug-panel" data-testid="debug-panel">
      <div className="debug-panel-header">
        <span className="debug-panel-title">🐛 Journal de debug ({filtered.length} entrées)</span>
        <div className="debug-panel-actions">
          <button type="button" className="debug-btn" onClick={exportLog} disabled={filtered.length === 0}>
            Exporter
          </button>
          <button type="button" className="debug-btn debug-btn-danger" onClick={clearLog}>
            Effacer
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="debug-empty">Aucun log pour le moment. Effectuez une action (ex: vérifier la disponibilité).</p>
      ) : (
        <div className="debug-entries" role="log" aria-live="polite">
          {[...filtered].reverse().map((entry) => (
            <div key={entry.id} className={`debug-entry debug-entry-${entry.level}`}>
              <span className="debug-entry-ts">{formatTs(entry.ts)}</span>
              <span className="debug-entry-level">{LEVEL_EMOJI[entry.level] || entry.level}</span>
              <span className="debug-entry-tag">[{entry.tag}]</span>
              <span className="debug-entry-msg">{entry.message}</span>
              {entry.data !== undefined && (
                <pre className="debug-entry-data">{JSON.stringify(entry.data, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
