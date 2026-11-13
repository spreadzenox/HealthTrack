import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

// Version iOS (HealthTrack-iOS) : Réglages → Confidentialité ouvre sur iPhone sa propre page
// (public/confidentialite-iphone.html, correctif 26), réécrite d'après celle d'Android. Celle d'Android évolue avec
// l'app : quand elle change, ce test échoue pour que la page iPhone soit relue avant de suivre la nouvelle version.
// Vitest tourne depuis upstream/app, où scripts/upstream.sh a copié overlay/
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8')
const iphone = read('public/confidentialite-iphone.html')
const text = iphone.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')

// Empreinte de app/public/privacypolicy.html d'Android lue en dernier (v833, 6 novembre 2026 : adresse IP comparée en
// mémoire aux appareils de test de Google, jamais gardée ; le relais le fait aussi pour l'iPhone, phrase reprise sans
// Google Play ; avant : mise à jour du 5 novembre 2026, v809 : section
// « Forme des selles estimée par photo », reprise sur iPhone avec App Attest au lieu de Play Integrity (décision du
// propriétaire du 05/11 vers 20:15) ;
// v782 : « Votre avis », reprise avec App Attest au lieu de Play Integrity ;
// AUJ-7 (07/11) : « ventre » devient « digestion », mêmes remplacements sur la page iPhone ;
// v980 (CYCLE-2) : « règles et symptômes du cycle si vous les notez » parmi les données gardées, repris sur iPhone)
const ANDROID_POLICY_RELUE = '4bcd3f03a8dc3721370f0912be63a1e6bdfe5defc96547dd091bcb80eeb7b5dc'

describe('politique de confidentialité sur iPhone', () => {
  it("suit la dernière version relue de la page d'Android", () => {
    const sha = createHash('sha256').update(readFileSync(join(process.cwd(), 'public/privacypolicy.html'))).digest('hex')
    expect(sha, "la page d'Android a changé : relire confidentialite-iphone.html, puis mettre à jour l'empreinte").toBe(ANDROID_POLICY_RELUE)
  })

  it("ne parle d'aucune fonction ni d'aucun service absents de l'iPhone", () => {
    for (const absent of [/Android/i, /Google Play/i, /Health Connect/i, /sauvegarde Google/i, /Huawei/i, /Withings/i,
      /données d'utilisation/i, /Play Integrity/i, /clé Gemini/i]) {
      expect(text, String(absent)).not.toMatch(absent)
    }
  })

  it("dit que l'adresse IP n'est que comparée en mémoire, jamais gardée (relais, Android v833)", () => {
    expect(text).toMatch(/adresse IP de la requête/)
    expect(text).toMatch(/en mémoire, aux adresses que Google publie pour ses appareils de test/)
    expect(text).toMatch(/elle n'est ni enregistrée ni conservée/)
  })

  it("dit ce que l'iPhone fait vraiment", () => {
    expect(text).toMatch(/lit \(sans jamais y écrire\) dans l'app Santé/)
    for (const type of ['pas', 'sommeil', 'fréquence cardiaque au repos', 'variabilité de la fréquence cardiaque',
      'saturation en oxygène', 'tension artérielle', 'glycémie', 'masse grasse']) expect(text).toContain(type)
    expect(text).toMatch(/copie de secours/)
    // CYCLE-iOS-2 : le cycle de Santé, seulement avec « Mon cycle », jamais envoyé
    expect(text).toMatch(/Si vous suivez votre cycle \(« Mon cycle »\)/)
    expect(text).toMatch(/Le cycle reste sur votre téléphone et n'est jamais envoyé/)
    // I6, achat ouvert : la transaction signée par Apple est vérifiée par le relais, sans rien qui identifie
    expect(text).toMatch(/Abonnement \(achats intégrés de l'App Store\)/)
    expect(text).toMatch(/transaction signée par Apple/)
    expect(text).toMatch(/empreinte de son numéro, sans rien qui vous identifie/)
    expect(text).not.toMatch(/ne propose pour l'instant aucun achat/)
    expect(text).toMatch(/sauvegarde iCloud/)
    // 1/11 : copie de secours hors de la sauvegarde iCloud (directive 5.1.3 (ii) d'Apple)
    expect(text).toMatch(/n'est pas incluse dans la sauvegarde iCloud/)
    expect(text).toMatch(/l'exclut de la sauvegarde iCloud/)
    expect(text).not.toMatch(/iOS y inclut/)
    expect(text).toMatch(/arrondie à environ 10 km/)
    expect(text).toMatch(/système d'intelligence artificielle de reconnaissance des émotions/)
    expect(text).toMatch(/18 ans et plus/)
    expect(text).toMatch(/Supprimer toutes mes données/)
    expect(text).toMatch(/CNIL/)
    expect(text).toMatch(/13 mois/)
    // Temps d'écran (31/10) : autorisation Temps d'écran d'Apple, sur l'iPhone seulement
    expect(text).toMatch(/Temps d'écran \(facultatif\)/)
    expect(text).toMatch(/autorisation Temps d'écran/)
    expect(text).toMatch(/par application/)
    // « Votre avis » (Android v782, AVIS-RELAIS-2) : le texte part seulement sur « Envoyer », effacé après 90 jours
    expect(text).toMatch(/Votre avis \(seulement si vous l'envoyez\)/)
    expect(text).toMatch(/un avis que vous nous envoyez/)
    expect(text).toMatch(/App Attest/)
    expect(text).toMatch(/90 jours au plus/)
    expect(text).toMatch(/un avis envoyé s'efface seul au bout de 90 jours/)
    // Selles en photo (Android v809, décision du 05/11) : sur geste, accord d'abord, photo effacée, pas de diagnostic
    expect(text).toMatch(/Forme des selles estimée par photo \(seulement si vous la lancez\)/)
    expect(text).toMatch(/échelle de Bristol/)
    expect(text).toMatch(/n'est gardée ni sur l'iPhone ni sur le serveur/)
    expect(text).toMatch(/ne juge ni la couleur, ni la présence de sang, ni votre santé/)
  })

  it("ramène à l'app, faute de bouton retour sur iPhone", () => {
    expect(iphone).toMatch(/<a class="back" href="\/plus">‹ Revenir à Halcya<\/a>/)
  })

  it('se lit hors ligne : aucune ressource externe', () => {
    expect(iphone).not.toMatch(/<script|<link|<img|<iframe|@import|url\(/i)
  })
})
