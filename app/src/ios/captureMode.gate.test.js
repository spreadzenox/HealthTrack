import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// FUSION-3 (correctif 02) : le mode « captures » du simulateur iPhone vit dans le code commun, mais `main.jsx` ne le
// charge que dans la build de captures (VITE_IOS_CAPTURE=1, ios-build.yml) : jamais Android, jamais TestFlight
const MAIN = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'main.jsx'), 'utf8')

describe('mode captures de l’iPhone dans main.jsx', () => {
  it('est chargé par un import dynamique sous VITE_IOS_CAPTURE === "1", et seulement là', () => {
    const lines = MAIN.split('\n').filter((l) => l.includes('ios/captureMode'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^if \(import\.meta\.env\.VITE_IOS_CAPTURE === '1'\) import\('\.\/ios\/captureMode\.js'\)\.then\(\(m\) => m\.installCaptureMode\(\)\)/)
  })

  it('n’est importé statiquement nulle part dans main.jsx', () => {
    expect(MAIN).not.toMatch(/^import .*captureMode/m)
  })
})
