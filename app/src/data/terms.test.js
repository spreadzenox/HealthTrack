// @vitest-environment node
/**
 * Conditions d'utilisation et de vente (app/public/conditions.html, VC-18) : embarquées dans l'app (Réglages,
 * paywall) et publiées par GitHub Pages. Brouillon « à faire valider par un juriste » (P5). Elles doivent coller à ce
 * que fait réellement l'app (abonnement Google Play, crédits IA, fonctions gratuites) et au vocabulaire produit.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { APP_NAME, TERMS_URL } from '../config/brand.js'
import { loadConfig } from '../../../relay/src/config.js'
import { buildSite, TERMS_PATH } from '../../scripts/site/build-site.mjs'

const relay = loadConfig({}) // compteurs réels du relais : le texte ne peut pas s'en écarter
const html = fs.readFileSync(path.resolve('public/conditions.html'), 'utf8')
const text = html
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')

describe('conditions d’utilisation et de vente', () => {
  it('portent le nom affiché de l’app et pas l’ancien', () => {
    expect(text).toContain(APP_NAME)
    expect(text.replace(/\S*spreadzenox\S*/g, '')).not.toMatch(/HealthTrack/)
  })

  it.each([
    ['l’âge minimum', /18 ans et plus/],
    ['l’absence de diagnostic', /pas un diagnostic|ne pose pas de diagnostic/],
    ['les fonctions toujours gratuites', /Toujours gratuit/],
    ['le paiement par Google Play', /Google Play[\s\S]*paiement/],
    ['le renouvellement automatique', /renouvel\w* automatiquement/],
    ['l’essai seulement s’il est proposé', /essai gratuit[\s\S]*si Google Play vous le propose/i],
    ['l’annulation dans Google Play', /Abonnements/],
    ['les remboursements', /rembours/],
    ['la période de grâce et la pause', /période de grâce[\s\S]*pause/],
    ['les crédits d’analyse IA', new RegExp(`${relay.creditsWelcome} analyses offertes[\\s\\S]*${relay.creditsMonthly} par mois`)],
    ['le plafond premium', new RegExp(`${relay.premiumDaily} analyses par jour`)],
    ['la politique de confidentialité et l’export', /politique de confidentialité[\s\S]*Réglages → Données/],
    ['le droit applicable', /droit français/],
    ['l’adresse publique', /spreadzenox\.github\.io\/HealthTrack\/conditions/],
  ])('décrivent %s', (_, re) => {
    expect(text).toMatch(re)
  })

  it('ne promettent ni « 100 % privé », ni prix codé en dur, ni affirmation médicale', () => {
    expect(text).not.toMatch(/100\s*%\s*(privé|confidentiel|local)/i)
    expect(text).not.toMatch(/\d+,\d\d\s*€/) // les prix viennent de Google Play, jamais du texte
    expect(text).not.toMatch(/diagnostiqu|prédi(re|t) (une|vos) crise|traiter/i)
  })

  it('restent marquées comme brouillon à faire valider par un juriste (commentaire de la source, P5)', () => {
    expect(html).toMatch(/<!--[\s\S]*juriste[\s\S]*-->/)
  })

  it('renvoient à la politique de confidentialité publiée', () => {
    expect(html).toContain('href="https://spreadzenox.github.io/HealthTrack/confidentialite/"')
  })

  it('ne chargent rien depuis Internet', () => {
    expect(html).not.toMatch(/<(script|link)\b/i)
  })

  it('l’adresse publiée correspond à TERMS_URL', () => {
    expect(TERMS_URL).toBe(`https://spreadzenox.github.io/HealthTrack/${TERMS_PATH}`)
  })

  it('sont publiées par le site GitHub Pages à /conditions/, et la page d’accueil y mène', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'halcya-site-'))
    buildSite(out)
    expect(fs.readFileSync(path.join(out, TERMS_PATH, 'index.html'), 'utf8')).toBe(html)
    expect(fs.readFileSync(path.join(out, 'index.html'), 'utf8')).toContain(`href="${TERMS_PATH}"`)
  })
})
