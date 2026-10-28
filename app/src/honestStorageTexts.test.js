import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { DISCLOSURES } from './config/permissionDisclosures'

const SRC = join(process.cwd(), 'src') + '/'

const visibleSources = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name)
  if (statSync(full).isDirectory()) return visibleSources(full)
  return /\.(jsx|js)$/.test(name) && !/\.test\./.test(name) ? [full] : []
})

// Retire les commentaires : seuls les textes affichés comptent.
const withoutComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

// Décision du 24/10 (sauvegarde Android conservée) : les données sont sur le téléphone ET dans la sauvegarde du
// téléphone si elle est activée. « Tout reste sur cet appareil » ou « rien ne quitte le téléphone » est donc faux
// pour les mesures gardées ; on dit ce que fait l'app (« rangées sur ce téléphone », « Halcya n'envoie rien »).
describe('textes honnêtes sur le stockage (POL-PLAY-25)', () => {
  it('aucun texte visible ne promet que tout reste sur l’appareil', () => {
    const offenders = visibleSources(SRC).filter((file) =>
      /Tout reste (<strong>)?sur cet appareil|restent sur votre téléphone|Rien ne quitte le téléphone|rien ne quitte le téléphone|ne quitte l’appareil/
        .test(withoutComments(readFileSync(file, 'utf8'))))
    expect(offenders.map((f) => f.slice(SRC.length))).toEqual([])
  })

  it('les divulgations des accès qui gardent des mesures parlent de la sauvegarde du téléphone', () => {
    for (const key of ['camera', 'camera_app_open', 'camera_unlock', 'health_connect', 'usage']) {
      expect(DISCLOSURES[key].leaves, key).toMatch(/sauvegarde du téléphone/)
      expect(DISCLOSURES[key].leaves, key).not.toMatch(/sauvegarde Google/)
    }
  })
})
