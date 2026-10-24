/**
 * Politique de confidentialité (app/public/privacypolicy.html) : embarquée dans l'app (Health Connect, Réglages) et
 * publiée par GitHub Pages. Elle doit décrire fidèlement ce que fait la variante play (journal/PRODUIT.md, test
 * fermé) et respecter le vocabulaire produit (jamais « 100 % privé », jamais d'affirmation médicale).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { APP_NAME } from '../config/brand.js'
import { buildSite, PRIVACY_PATH } from '../../scripts/site/build-site.mjs'

const html = fs.readFileSync(path.resolve('public/privacypolicy.html'), 'utf8')
const text = html
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')

describe('politique de confidentialité', () => {
  it('porte le nom affiché de l’app et pas l’ancien', () => {
    expect(text).toContain(APP_NAME)
    expect(text.replace(/\S*spreadzenox\S*/g, '')).not.toMatch(/HealthTrack/) // seules les adresses gardent l'ancien nom
  })

  it.each([
    ['le stockage local', /uniquement sur votre téléphone/],
    ['Health Connect en lecture seule', /Health Connect[\s\S]*lit[\s\S]*sans jamais y écrire/],
    ['l’utilisation limitée Health Connect', /utilisation limitée/],
    ['la position arrondie envoyée à Open-Meteo', /Open-Meteo[\s\S]*arrondie à environ 10 km/],
    ['le temps d’écran', /Temps d'écran/],
    ['la lecture du visage sans image gardée', /aucune image n'est gardée/i],
    ['l’IA de reconnaissance des émotions (AI Act)', /reconnaissance des émotions/],
    ['la montre en Bluetooth', /Bluetooth/],
    ['l’analyse IA seulement à la demande', /seulement si vous la lancez/],
    ['l’export', /Exporter/],
    ['la suppression', /Supprimer toutes mes données/],
    ['le contact', /Contact/],
    ['l’âge minimum', /18 ans et plus/],
    ['l’adresse publique', /spreadzenox\.github\.io\/HealthTrack\/confidentialite/],
  ])('décrit %s', (_, re) => {
    expect(text).toMatch(re)
  })

  it('ne promet pas un « 100 % privé » et ne fait aucune affirmation médicale', () => {
    expect(text).not.toMatch(/100\s*%\s*(privé|confidentiel|local)/i)
    expect(text).not.toMatch(/diagnostiqu|prédi(re|t) (une|vos) crise/i)
    expect(text).toMatch(/pas un diagnostic|ne pose pas de diagnostic/)
  })

  it('ne charge rien depuis Internet (page lue hors ligne par Health Connect)', () => {
    expect(html).not.toMatch(/<(script|link)\b/i)
    expect(html).not.toMatch(/fonts\.googleapis/)
  })
})

describe('site GitHub Pages', () => {
  it('publie la politique à /confidentialite/ et /privacypolicy.html, et une page d’accueil qui y mène', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'halcya-site-'))
    buildSite(out)
    expect(fs.readFileSync(path.join(out, PRIVACY_PATH, 'index.html'), 'utf8')).toBe(html)
    expect(fs.readFileSync(path.join(out, 'privacypolicy.html'), 'utf8')).toBe(html)
    const landing = fs.readFileSync(path.join(out, 'index.html'), 'utf8')
    expect(landing).toContain(`href="${PRIVACY_PATH}"`)
    expect(landing).toContain(APP_NAME)
    expect(landing).not.toMatch(/<script\b|fonts\.googleapis/)
    expect(fs.existsSync(path.join(out, '.nojekyll'))).toBe(true)
  })
})
