import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SNAPSHOT_DIR } from './snapshot.js'

// Version iOS (HealthTrack-iOS) : la page écrit la copie de secours dans le dossier que l'app marque « exclu de la
// sauvegarde iCloud » au lancement (directive 5.1.3 (ii), décision du 1/11). Les deux noms doivent rester identiques :
// sinon la copie partirait, en silence, dans un dossier sauvegardé. Projet iOS copié dans upstream/app/ios.
const swift = (path) => readFileSync(resolve(process.cwd(), 'ios', path), 'utf8')

describe('dossier de la copie de secours, hors de la sauvegarde iCloud', () => {
  it('même nom côté page (snapshot.js) et côté app (SnapshotFolder.swift)', () => {
    const name = swift('HalcyaRules/Sources/HalcyaRules/SnapshotFolder.swift').match(/static let name = "([^"]+)"/)?.[1]
    expect(name).toBe(SNAPSHOT_DIR)
  })

  it('le dossier est marqué exclu de la sauvegarde, et l’app le prépare au lancement et à chaque changement d’état', () => {
    expect(swift('HalcyaRules/Sources/HalcyaRules/SnapshotFolder.swift')).toMatch(/isExcludedFromBackup = true/)
    const delegate = swift('App/App/AppDelegate.swift')
    expect(delegate.match(/prepareSnapshotFolder\(\)/g)?.length).toBeGreaterThanOrEqual(4) // définition + 3 appels
    expect(delegate).toMatch(/didFinishLaunchingWithOptions[\s\S]*?Self\.prepareSnapshotFolder\(\)[\s\S]*?return true/)
  })
})
