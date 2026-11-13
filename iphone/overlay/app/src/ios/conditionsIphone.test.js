import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

// Version iOS (HealthTrack-iOS) : Réglages → Conditions ouvre sur iPhone sa propre page
// (public/conditions-iphone.html, correctif 26), réécrite d'après celle d'Android, qui parle de Google Play. Celle
// d'Android évolue avec l'app : quand elle change, ce test échoue pour que la page iPhone soit relue.
// Vitest tourne depuis upstream/app, où scripts/upstream.sh a copié overlay/
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')
const iphone = read('public/conditions-iphone.html')
const text = iphone.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')

// Empreinte de app/public/conditions.html d'Android lue en dernier (version du 1er novembre 2026, relue sur v671 ;
// AUJ-7, 07/11 : « ventre » devient « digestion », mêmes remplacements sur la page iPhone)
const ANDROID_CONDITIONS_RELUES = '43c547736c621a8a21ca2e7b2829a3389eeccf76af5083718086ef9975a80aa9'

describe("conditions d'utilisation sur iPhone", () => {
  it("suivent la dernière version relue de la page d'Android", () => {
    const sha = createHash('sha256').update(readFileSync(join(process.cwd(), 'public/conditions.html'))).digest('hex')
    expect(sha, "la page d'Android a changé : relire conditions-iphone.html, puis mettre à jour l'empreinte").toBe(ANDROID_CONDITIONS_RELUES)
  })

  it("ne parlent d'aucun service absent de l'iPhone, ni d'un prix écrit en dur (celui de l'App Store fait foi)", () => {
    for (const absent of [/Android/i, /Google/i, /Health Connect/i, /Huawei/i, /Withings/i, /sideload|hors App Store/i, /\d+ ?€/]) {
      expect(text, String(absent)).not.toMatch(absent)
    }
  })

  it("décrivent les abonnements Silver et Gold de l'App Store comme Apple l'exige (I6, achat ouvert)", () => {
    expect(text).toMatch(/Abonnements Silver et Gold \(achats intégrés de l'App Store\)/)
    expect(text).toMatch(/10 analyses par jour/)
    expect(text).toMatch(/20 analyses par jour/)
    expect(text).toMatch(/Essai gratuit.*une fois par\s+compte Apple/s)
    expect(text).toMatch(/Renouvellement automatique.*au moins 24 heures avant la fin de la période/s)
    expect(text).toMatch(/débité dans les 24 heures/)
    expect(text).toMatch(/Réglages → votre nom → Abonnements → Halcya/)
    expect(text).toMatch(/Restaurer un achat/)
    expect(text).toMatch(/traités par Apple/)
    expect(text).not.toMatch(/moins d'erreurs|plus précis/) // promesse de Gold non confirmée par le banc (GOLD-b6)
  })

  it("gardent ce que l'app n'est pas, et ce que l'iPhone fait vraiment", () => {
    expect(text).toMatch(/n'est pas un dispositif médical/)
    expect(text).toMatch(/appelez le 15 ou le 112/)
    expect(text).toMatch(/piste à vérifier : il ne prouve pas que l'un entraîne l'autre/)
    expect(text).toMatch(/ne pose pas de diagnostic/)
    expect(text).not.toMatch(/pas des causes|estimation, pas un diagnostic/)
    expect(text).toMatch(/18 ans et plus/)
    expect(text).toMatch(/achats intégrés de l'App Store/)
    expect(text).toMatch(/app Santé/)
    expect(text).toMatch(/sauvegarde iCloud/)
    expect(text).toMatch(/elle n'est pas incluse dans la sauvegarde iCloud/) // 1/11, directive 5.1.3 (ii)
    expect(text).toMatch(/droit français/)
  })

  it("renvoient à la politique de confidentialité de l'iPhone et ramènent à l'app", () => {
    expect(iphone).toContain('href="/confidentialite-iphone.html"')
    expect(iphone).not.toContain('href="/privacypolicy.html"')
    expect(iphone).toMatch(/<a class="back" href="\/plus">‹ Revenir à Halcya<\/a>/)
  })

  it('se lisent hors ligne : aucune ressource externe', () => {
    expect(iphone).not.toMatch(/<script|<link|<img|<iframe|@import|url\(/i)
  })
})
