// Sauvegarde Android conservée (décision du 24/10, SAUV) : règles explicites qui excluent les secrets propres au
// téléphone, dans les deux formats (Android 12+ et avant), et repère hors sauvegarde pour le localStorage.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const android = resolve(import.meta.dirname, '../../android/app/src/main')
const read = (p) => readFileSync(resolve(android, p), 'utf-8')
const prefsOf = (file) => read(`java/com/healthtrack/app/${file}`).match(/PREFS = "([^"]+)"/)[1]

// Coffre de la montre (clé du Keystore, qui ne voyage pas), association compagnon et adresse de la montre,
// téléchargement de mise à jour en cours : tous propres à ce téléphone.
const DEVICE_PREFS = ['WatchVaultPlugin.java', 'CompanionPlugin.java', 'BackgroundWatchSync.java', 'AppUpdatePlugin.java'].map(prefsOf)

const excludes = (xml) => [...xml.matchAll(/<exclude domain="sharedpref" path="([^"]+)\.xml"/g)].map((m) => m[1])

describe('règles de sauvegarde Android', () => {
  it('le manifeste garde la sauvegarde et déclare les deux fichiers de règles', () => {
    const manifest = read('AndroidManifest.xml')
    expect(manifest).toMatch(/android:allowBackup="true"/)
    expect(manifest).toMatch(/android:dataExtractionRules="@xml\/data_extraction_rules"/)
    expect(manifest).toMatch(/android:fullBackupContent="@xml\/backup_rules"/)
  })

  it('Android 12+ : secrets exclus de la sauvegarde Google et du transfert entre téléphones', () => {
    const xml = read('res/xml/data_extraction_rules.xml')
    for (const section of ['cloud-backup', 'device-transfer']) {
      const body = xml.match(new RegExp(`<${section}>([\\s\\S]*?)</${section}>`))[1]
      expect(excludes(body).sort()).toEqual([...DEVICE_PREFS].sort())
      expect(body).not.toMatch(/<include/) // tout le reste (données de santé, réglages) reste sauvegardé
    }
  })

  it('Android 11 et avant : mêmes exclusions', () => {
    const xml = read('res/xml/backup_rules.xml')
    expect(excludes(xml).sort()).toEqual([...DEVICE_PREFS].sort())
    expect(xml).not.toMatch(/<include/)
  })

  it('le repère de restauration vit hors sauvegarde et son plugin est enregistré', () => {
    expect(read('java/com/healthtrack/app/BackupMarkerPlugin.java')).toMatch(/getNoBackupFilesDir\(\)/)
    expect(read('java/com/healthtrack/app/MainActivity.java')).toMatch(/registerPlugin\(BackupMarkerPlugin\.class\)/)
  })
})
