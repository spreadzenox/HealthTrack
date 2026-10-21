// Garde-fou des variantes Android (jalon 3) : la permission d'installer des APK ne vit que dans la sideload,
// et l'identifiant play, définitif une fois publié, ne change pas par accident.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const android = resolve(import.meta.dirname, '../../android/app')
const read = (p) => readFileSync(resolve(android, p), 'utf-8')

describe('variantes Android play / sideload', () => {
  it('REQUEST_INSTALL_PACKAGES seulement dans le manifeste sideload', () => {
    expect(read('src/main/AndroidManifest.xml')).not.toMatch(/REQUEST_INSTALL_PACKAGES/)
    expect(read('src/sideload/AndroidManifest.xml')).toMatch(/android\.permission\.REQUEST_INSTALL_PACKAGES/)
  })

  it('identifiants : historique pour la sideload, neutre et distinct pour play', () => {
    const gradle = read('build.gradle')
    expect(gradle).toMatch(/sideload \{[^}]*applicationId 'com\.healthtrack\.app'/)
    expect(gradle).toMatch(/play \{[^}]*applicationId 'fr\.jpesquet\.sante'/)
    expect(gradle).toMatch(/play \{[^}]*SELF_UPDATE', 'false'/)
  })

  it("le plugin de mise à jour n'est enregistré que si SELF_UPDATE", () => {
    expect(read('src/main/java/com/healthtrack/app/MainActivity.java')).toMatch(
      /if \(BuildConfig\.SELF_UPDATE\) registerPlugin\(AppUpdatePlugin\.class\)/,
    )
  })
})
