import { describe, it, expect } from 'vitest'
import { ALL_CHANGELOG, APPSTORE_CHANGELOG_SINCE, APPSTORE_HIDDEN, changelogFor } from './changelog'

// Version iOS (HealthTrack-iOS) : les Nouveautés de l'iPhone partent de la version iPhone (correctif 28) ; avant,
// l'historique parle de « HealthTrack », de la clé Gemini, de la mise à jour par APK, de la montre en Bluetooth…
describe('Nouveautés sur iPhone (variante appstore)', () => {
  const LOG = [
    { id: '2026-10-31-0100-ios', variants: ['appstore'] },
    { id: '2026-10-30-2233-commune' },
    { id: '2026-10-30-2133-android', variants: ['play', 'sideload'] },
    { id: '2026-10-30-0433-avant-iphone' },
    { id: '2026-10-20-0100-ancienne' },
  ]

  it('ne montre que les notes communes ou propres à l’iPhone, depuis la version iPhone', () => {
    expect(changelogFor(LOG, 'appstore').map((e) => e.id)).toEqual(['2026-10-31-0100-ios', '2026-10-30-2233-commune'])
  })

  it('ne change rien pour Google Play ni pour la version hors store', () => {
    expect(changelogFor(LOG, 'play').map((e) => e.id)).toEqual(['2026-10-30-2233-commune', '2026-10-30-2133-android', '2026-10-30-0433-avant-iphone'])
    expect(changelogFor(LOG, 'sideload')).toHaveLength(4)
  })

  it('cache les notes d’Android fausses sur iPhone, en attendant leurs variants', () => {
    // v578 : « l'écran Premium dit jusqu'à quand tout est débloqué » : sur iPhone, pas de période de lancement
    expect(APPSTORE_HIDDEN.has('2026-10-29-0533-paywall-lancement')).toBe(true)
    // v607 : « votre montre et Health Connect (Samsung Health, Health Sync…) » : la correction vaut sur iPhone (deux
    // apps qui écrivent la même nuit dans l'app Santé), mais pas ces noms
    expect(APPSTORE_HIDDEN.has('2026-10-30-0933-sommeil-une-source')).toBe(true)
    const ids = changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)
    for (const id of APPSTORE_HIDDEN) expect(ids).not.toContain(id)
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-10-29-0533-paywall-lancement')
  })

  it('notes reprises par Android (v755, #671) : sorties de la liste, toujours absentes sur iPhone', () => {
    // `variants: ["play", "sideload"]` posés par Android (VFC nuit, page de la montre en direct, Sources en couleur) ;
    // « phrases d'aide » et « compteur d'écrans » reformulées, mais d'avant la version iPhone (30/10, 21:00)
    // v774 (#690) : « Sources : ce que lit Halcya » marquée Google Play ; « Repas : des cartes plus légères » scindée
    // (le stress de la montre dans une note Google Play), toutes deux d'avant la version iPhone
    const repris = ['2026-10-30-0233-phrases-aide', '2026-10-30-1133-onboarding-compteur', '2026-10-30-1433-vfc-nuit',
      '2026-10-31-1033-montre-compacte', '2026-10-31-1833-sources-couleur', '2026-10-29-1737-sources-titre',
      '2026-10-29-2333-repas-actions']
    const ios = changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)
    const all = ALL_CHANGELOG.map((e) => e.id)
    for (const id of repris) {
      expect(all, id).toContain(id)
      expect(APPSTORE_HIDDEN.has(id), id).toBe(false)
      expect(ios, id).not.toContain(id)
    }
    for (const id of ['2026-10-30-1433-vfc-nuit', '2026-10-31-1033-montre-compacte', '2026-10-31-1833-sources-couleur',
      '2026-10-29-1737-sources-titre', '2026-10-29-2334-stress-montre']) {
      expect(ALL_CHANGELOG.find((e) => e.id === id).variants, id).toEqual(['play', 'sideload'])
    }
    // L'iPhone garde sa propre note « Sources en couleur »
    expect(ios).toContain('2026-10-31-1834-sources-couleur-iphone')
  })

  it('v771 : « si vous avez agrandi le texte dans les réglages du téléphone » cachée : l’app iPhone ne suit pas encore la taille du texte d’iOS', () => {
    // Android (WebView) suit la taille de police du système ; la WebView de l'iPhone non (ni Dynamic Type ni TextZoom) :
    // sur iPhone, ce réglage ne change rien dans Halcya, la note n'y décrirait rien (PARITE, BACKLOG)
    expect(ALL_CHANGELOG.map((e) => e.id)).toContain('2026-11-04-1435-grande-police')
    expect(APPSTORE_HIDDEN.has('2026-11-04-1435-grande-police')).toBe(true)
    expect(changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)).not.toContain('2026-11-04-1435-grande-police')
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-11-04-1435-grande-police')
  })

  it('v838 : « Mieux en grande taille de police » cachée aussi, pour la même raison', () => {
    expect(ALL_CHANGELOG.map((e) => e.id)).toContain('2026-11-06-1335-grande-police')
    expect(APPSTORE_HIDDEN.has('2026-11-06-1335-grande-police')).toBe(true)
    expect(changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)).not.toContain('2026-11-06-1335-grande-police')
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-11-06-1335-grande-police')
  })

  it('v844 : « Carte « Votre ventre » lisible en très grande police » cachée aussi, pour la même raison', () => {
    expect(ALL_CHANGELOG.map((e) => e.id)).toContain('2026-11-06-1935-ventre-grande-police')
    expect(APPSTORE_HIDDEN.has('2026-11-06-1935-ventre-grande-police')).toBe(true)
    expect(changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)).not.toContain('2026-11-06-1935-ventre-grande-police')
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-11-06-1935-ventre-grande-police')
  })

  it('v846 : « Premier écran lisible en très grande police » cachée aussi, pour la même raison', () => {
    expect(ALL_CHANGELOG.map((e) => e.id)).toContain('2026-11-06-2135-onboarding-reperes')
    expect(APPSTORE_HIDDEN.has('2026-11-06-2135-onboarding-reperes')).toBe(true)
    expect(changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)).not.toContain('2026-11-06-2135-onboarding-reperes')
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-11-06-2135-onboarding-reperes')
  })

  it('v809 et v810 : les notes de la photo des selles valent sur iPhone (décision du propriétaire du 05/11 vers 20:15)', () => {
    const ios = changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)
    for (const id of ['2026-11-05-1535-selles-photo', '2026-11-05-1635-selles-photo-fiabilite']) {
      expect(APPSTORE_HIDDEN.has(id), id).toBe(false)
      expect(ios, id).toContain(id)
    }
  })

  it('v755 : « le bouton « Autoriser » ne remplit plus tout l’écran » cachée, l’iPhone l’avait dès sa première version', () => {
    // Correctif 29 de l'iPhone (29/10, avant le premier TestFlight du 30/10), repris par Android en v755 (#671)
    expect(ALL_CHANGELOG.map((e) => e.id)).toContain('2026-11-04-0235-bouton-bienvenue')
    expect(APPSTORE_HIDDEN.has('2026-11-04-0235-bouton-bienvenue')).toBe(true)
    expect(changelogFor(ALL_CHANGELOG, 'appstore').map((e) => e.id)).not.toContain('2026-11-04-0235-bouton-bienvenue')
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).toContain('2026-11-04-0235-bouton-bienvenue')
  })

  it('les notes de l’iPhone commencent au premier TestFlight (30/10) et aucune ne parle de Google Play ni d’Android', () => {
    expect(APPSTORE_CHANGELOG_SINCE).toBe('2026-10-30-2100')
    const notes = changelogFor(ALL_CHANGELOG, 'appstore')
    expect(notes.length).toBeGreaterThan(0)
    for (const n of notes) expect(JSON.stringify(n), n.id).not.toMatch(/Google Play|Android|Health Connect|Huawei/)
  })

  it('la première note de l’iPhone présente la version de test, et seulement sur iPhone', () => {
    const notes = changelogFor(ALL_CHANGELOG, 'appstore')
    expect(notes.at(-1)).toMatchObject({ id: '2026-10-30-2130-premiere-version-iphone', title: 'Halcya arrive sur iPhone' })
    expect(changelogFor(ALL_CHANGELOG, 'play').map((e) => e.id)).not.toContain('2026-10-30-2130-premiere-version-iphone')
  })
})
