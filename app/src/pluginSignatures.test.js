/**
 * Plugins Capacitor et vieux Android (PLUGIN-API, 04/11) : au démarrage, Capacitor lit toutes les méthodes de chaque
 * plugin (`Class.getDeclaredMethods`, privées comprises), ce qui charge les types de leurs paramètres et de leur
 * retour. Un type qui n'existe pas sur le téléphone (ex. `android.companion.AssociationInfo`, Android 13) fait planter
 * l'app à l'ouverture sur tout Android plus ancien (trouvé par le job émulateur API 28 : NoClassDefFoundError dans
 * `Plugin.initializeActivityLaunchers`). Ces types restent permis dans le corps des méthodes, derrière un test de
 * version, et dans les classes internes (non lues par Capacitor).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Types Android apparus après minSdk 26 (Android 8), version d'apparition. À compléter si un plugin en utilise un autre.
const NEWER_TYPES = {
  AssociationInfo: 33,
  OnBackInvokedCallback: 33,
  ForegroundServiceStartNotAllowedException: 31,
  BluetoothLeAudio: 33,
  ObservingDevicePresenceRequest: 36,
  DevicePresenceEvent: 36,
  WindowMetrics: 30,
  HealthConnectManager: 34,
}

function javaFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return javaFiles(p)
    return d.name.endsWith('.java') ? [p] : []
  })
}

/** Signatures des méthodes déclarées au premier niveau de la classe (profondeur d'accolades 1). */
export function topLevelSignatures(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/"(?:\\.|[^"\\])*"/g, '""')
  const out = []
  let depth = 0
  let chunk = ''
  for (const ch of code) {
    if (ch === '{') {
      if (depth === 1 && /\)\s*(throws[\w\s,.]*)?$/.test(chunk.trim())) out.push(chunk.trim().split(/[;}]/).pop().trim())
      depth++
      chunk = ''
    } else if (ch === '}') {
      depth--
      chunk = ''
    } else if (ch === ';') {
      chunk = ''
    } else if (depth === 1) {
      chunk += ch
    }
  }
  return out
}

const ROOT = path.resolve('android/app/src')
const plugins = javaFiles(ROOT).filter((f) => /@CapacitorPlugin/.test(fs.readFileSync(f, 'utf8')))

describe('plugins Capacitor lisibles sous Android 8 (PLUGIN-API)', () => {
  it('le détecteur voit une méthode privée avec un type récent', () => {
    const sample = 'class P extends Plugin {\n  private void finish(PluginCall call, AssociationInfo info) {\n    if (x) { y(); }\n  }\n}'
    expect(topLevelSignatures(sample)).toEqual(['private void finish(PluginCall call, AssociationInfo info)'])
  })

  it('trouve les plugins', () => {
    expect(plugins.length).toBeGreaterThan(10)
  })

  it('aucune méthode de plugin ne prend ni ne rend un type absent d’Android 8', () => {
    const offenders = []
    for (const file of plugins) {
      for (const sig of topLevelSignatures(fs.readFileSync(file, 'utf8'))) {
        for (const [type, api] of Object.entries(NEWER_TYPES)) {
          if (new RegExp(`\\b${type}\\b`).test(sig)) offenders.push(`${path.relative(ROOT, file)} : ${sig} (${type}, API ${api})`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
