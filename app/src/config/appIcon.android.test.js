// Garde-fou de l'icône « H nuit » (journal/DESIGN.md, jalon 2 bis ii) : couleurs de référence, zone sûre de
// l'icône adaptative, couche monochrome, écran de démarrage et icône de notification de l'app partout.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const app = resolve(import.meta.dirname, '../..')
const res = resolve(app, 'android/app/src/main/res')
const read = (p) => readFileSync(resolve(res, p), 'utf-8')

// Coins des barres du glyphe (grille 108) une fois réduit de `scale` autour du centre (54, 54).
function farthestCorner(scale) {
  const corners = [
    [30, 28],
    [78, 28],
    [30, 80],
    [78, 80],
  ]
  return Math.max(...corners.map(([x, y]) => Math.hypot((x - 54) * scale, (y - 54) * scale)))
}

describe('icône « H nuit »', () => {
  it('arrière-plan encre et couleurs du glyphe (blanc, menthe vive, ambre)', () => {
    expect(read('values/ic_launcher_background.xml')).toMatch(/#10231D/)
    const fg = read('drawable/ic_launcher_foreground.xml')
    expect(fg).toMatch(/fillColor="#FFFFFF"/)
    expect(fg).toMatch(/strokeColor="#5EE0B5"/)
    expect(fg).toMatch(/fillColor="#FFB84D"/)
    expect(fg).toMatch(/M36,64C46,64 46,50 54,50C62,50 62,42 72,42/)
  })

  it('le glyphe tient dans la zone sûre de 66 dp (rayon 33)', () => {
    const scale = Number(read('drawable/ic_launcher_foreground.xml').match(/android:scaleX="([\d.]+)"/)[1])
    expect(farthestCorner(scale)).toBeLessThanOrEqual(33)
  })

  it('icônes adaptatives avec couche monochrome d’une seule couleur', () => {
    for (const f of ['ic_launcher', 'ic_launcher_round']) {
      const xml = read(`mipmap-anydpi-v26/${f}.xml`)
      expect(xml).toMatch(/<monochrome android:drawable="@drawable\/ic_launcher_monochrome"/)
      expect(xml).toMatch(/<foreground android:drawable="@drawable\/ic_launcher_foreground"/)
    }
    const colors = new Set(read('drawable/ic_launcher_monochrome.xml').match(/#[0-9A-F]{6}/gi))
    expect([...colors]).toEqual(['#FFFFFF'])
  })

  it('écran de démarrage : fond encre et glyphe, puis thème de l’app', () => {
    const styles = read('values/styles.xml')
    expect(styles).toMatch(/windowSplashScreenBackground">@color\/ic_launcher_background/)
    expect(styles).toMatch(/windowSplashScreenAnimatedIcon">@drawable\/ic_launcher_foreground/)
    expect(styles).toMatch(/postSplashScreenTheme">@style\/AppTheme\.NoActionBar/)
    expect(read('drawable/launch_screen.xml')).toMatch(/@drawable\/ic_launcher_foreground/)
  })

  it('toutes les notifications portent l’icône de l’app, en silhouette blanche', () => {
    const javaDir = resolve(app, 'android/app/src/main/java/com/healthtrack/app')
    const icons = readdirSync(javaDir)
      .filter((f) => f.endsWith('.java'))
      .flatMap((f) => [...readFileSync(resolve(javaDir, f), 'utf-8').matchAll(/setSmallIcon\(([^)]+)\)/g)])
      .map((m) => m[1])
    expect(icons.length).toBeGreaterThan(0)
    expect(new Set(icons)).toEqual(new Set(['R.drawable.ic_stat_healthtrack']))
    const colors = new Set(read('drawable/ic_stat_healthtrack.xml').match(/#[0-9A-F]{6}/gi))
    expect([...colors]).toEqual(['#FFFFFF'])
  })

  it('le logo de l’en-tête est le même glyphe', () => {
    const svg = readFileSync(resolve(app, 'public/favicon.svg'), 'utf-8')
    expect(svg).toMatch(/fill="#10231D"/)
    expect(svg).toMatch(/M36 64 C46 64 46 50 54 50 C62 50 62 42 72 42/)
  })
})
