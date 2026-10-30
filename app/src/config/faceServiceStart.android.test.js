import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Plantage du 30/10 (Galaxy A56, « activer la lecture du visage ») : un service lancé par startForegroundService doit
// appeler startForeground ; s'il s'arrête avant (stopSelf faute de caméra, ou startForeground refusé par Android 14+),
// le système tue l'app. FaceSenseService s'arrête de lui-même dans ces cas : il ne doit donc jamais être lancé avec
// la promesse de premier plan (l'app est toujours à l'écran quand on le démarre, startService suffit).
const DIR = join(import.meta.dirname, '../../android/app/src/main/java/com/healthtrack/app')
const java = Object.fromEntries(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.java'))
    .map((f) => [f, readFileSync(join(DIR, f), 'utf8')]),
)

describe('lecture du visage : aucun échec ne ferme l’app', () => {
  it('FaceSenseService n’est jamais démarré par startForegroundService', () => {
    const offenders = Object.entries(java)
      .filter(([, src]) => /startForegroundService\s*\([^;]*FaceSenseService/s.test(src))
      .map(([f]) => f)
    expect(offenders).toEqual([])
    expect(java['FaceSensePlugin.java']).toMatch(/getContext\(\)\.startService\(intent\)/)
  })

  it('les lectures hors du fil principal rattrapent aussi les erreurs natives (LinkageError, mémoire)', () => {
    expect(java['FaceOneShot.java']).toMatch(/\.burst\([^)]*\);\s*\}\s*catch \(RuntimeException \| LinkageError \| OutOfMemoryError e\)/)
    expect(java['FaceSenseService.java']).toMatch(/pipeline\.burst\([^)]*\);\s*\}\s*catch \(RuntimeException \| LinkageError \| OutOfMemoryError e\)/)
    expect(java['FaceSensePlugin.java']).toMatch(/FaceOneShot\.run\([^)]*\)\);\s*\}\s*catch \(Exception \| LinkageError \| OutOfMemoryError e\)/)
  })
})
