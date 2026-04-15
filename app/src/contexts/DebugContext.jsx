import { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react'
import { isDebugModeEnabled } from '../settings/debugMode'
import { getDebugEntries, clearDebugLog, subscribeDebugLog } from '../utils/debugLog'

const DebugContext = createContext({
  debugMode: false,
  entries: [],
  clearLog: () => {},
  refreshDebugMode: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useDebug() {
  return useContext(DebugContext)
}

/**
 * useSyncExternalStore requires getSnapshot to return a STABLE reference (===)
 * between calls when the store has not changed, otherwise React warns and
 * infinite-loops.
 *
 * We keep a module-level reference to the current entries array. The subscriber
 * replaces it with a fresh array only when the log buffer actually mutates, so
 * consecutive getSnapshot() calls return the same reference until a new log
 * entry arrives.
 */
let _snapshot = []

function getLogSnapshot() {
  return _snapshot
}

function subscribeToLog(onStoreChange) {
  return subscribeDebugLog(() => {
    _snapshot = getDebugEntries()
    onStoreChange()
  })
}

// Stable no-op subscription and empty-array snapshot for when debug is off.
const EMPTY_SNAPSHOT = Object.freeze([])

function subscribeNoop() {
  return () => {}
}

function getEmptySnapshot() {
  return EMPTY_SNAPSHOT
}

export function DebugProvider({ children }) {
  const [debugMode, setDebugMode] = useState(() => isDebugModeEnabled())

  const refreshDebugMode = useCallback(() => {
    setDebugMode(isDebugModeEnabled())
  }, [])

  const entries = useSyncExternalStore(
    debugMode ? subscribeToLog : subscribeNoop,
    debugMode ? getLogSnapshot : getEmptySnapshot,
  )

  const clearLog = useCallback(() => {
    clearDebugLog()
  }, [])

  return (
    <DebugContext.Provider value={{ debugMode, entries, clearLog, refreshDebugMode }}>
      {children}
    </DebugContext.Provider>
  )
}
