import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { pilouPhotoEnabled, PILOU_PHOTO } from './flag.js'
import { DEFAULTS, FIELDS, PATHS, checksToShow, normalizeStyle, traitsToShow } from './style.js'
import { CAP_MESSAGE, PHOTO_TIMEOUT_MS, PILOU_STYLE_PATH, analyzeSelfie, photoAnalysesLeft } from './client.js'
import { SELFIE_MAX_SIDE, captureSelfie, openFrontCamera, stopCamera } from './selfie.js'
import { FORBIDDEN_WORDING, SLOP_WORDING, stripComments } from '../../data/wordingRules.js'

// La fiche de Léa du kit (personnage fictif)
const LEA = {
  cheveux: { longueur: 'mi_longs', texture: 'ondules', coiffure: 'raie_cote', couleur: 'chatain', meches: 'aucune', volume: 'moyen' },
  sourcils: { epaisseur: 'moyens', forme: 'arques' },
  yeux: { couleur: 'noisette', forme: 'amande' },
  lunettes: { type: 'rondes', couleur: 'ecaille' },
  barbe: { type: 'aucune' },
  peau: { taches_de_rousseur: 'legeres', grain_de_beaute: 'aucun' },
  oreilles: { boucles: 'puces', piercing_nez: false },
  incertains: ['yeux.couleur'],
}

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

const ROOT = path.resolve()
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

describe('interrupteur de build (garde-fou du propriétaire)', () => {
  it('éteint par défaut ; seul VITE_PILOU_PHOTO=on l’allume', () => {
    expect(PILOU_PHOTO).toBe(false)
    for (const v of [undefined, null, '', '0', '1', 'true', 'off', 'yes']) expect(pilouPhotoEnabled(v)).toBe(false)
    expect(pilouPhotoEnabled('on')).toBe(true)
    expect(pilouPhotoEnabled(' ON ')).toBe(true)
  })

  it('aucune configuration de build ne l’allume (Android, iPhone, CI)', () => {
    const files = ['.env', '.env.production', '.env.play', '.env.appstore'].filter((f) => fs.existsSync(path.join(ROOT, f)))
    const workflows = path.resolve(ROOT, '../.github/workflows')
    for (const f of fs.readdirSync(workflows)) files.push(`../.github/workflows/${f}`)
    for (const f of files) expect(read(f), f).not.toMatch(/VITE_PILOU_PHOTO\s*[:=]\s*['"]?on/i)
  })

  it('éteint : pas de route, donc aucun écran, aucune autorisation caméra, aucun appel', () => {
    const app = read('src/App.jsx')
    expect(app).toMatch(/\{PILOU_PHOTO && <Route path="pilou\/photo"/)
    // Le parcours n'est atteint que par cette route (import paresseux) ; la caméra et le réseau seulement par lui
    const srcFiles = []
    const walk = (dir) => {
      for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, d.name)
        if (d.isDirectory()) walk(p)
        else if (/\.(jsx?)$/.test(d.name) && !/\.test\./.test(d.name)) srcFiles.push(p)
      }
    }
    walk(path.join(ROOT, 'src'))
    const importers = srcFiles.filter((f) => /companion\/photo\/(PilouPhoto(Page|Flow)|client|selfie)\b/.test(fs.readFileSync(f, 'utf8')) && !f.includes(`companion${path.sep}photo`))
    expect(importers.map((f) => path.relative(ROOT, f))).toEqual(['src/App.jsx'])
    expect(read('src/companion/photo/client.js')).toContain("'/v1/pilou/style'")
  })
})

describe('fiche de style', () => {
  it('la fiche de Léa passe telle quelle', () => {
    expect(normalizeStyle(LEA)).toEqual(LEA)
  })

  it('jette tout champ inattendu, jamais de couvre-chef ; valeur inconnue → défaut « À vérifier »', () => {
    const out = normalizeStyle({ ...LEA, age: 30, genre: 'f', couvre_chef: 'foulard', yeux: { couleur: 'violet', forme: 'amande' }, incertains: ['humeur'] })
    expect(out.age).toBeUndefined()
    expect(out.genre).toBeUndefined()
    expect(out.couvre_chef).toBeUndefined()
    expect(out.yeux.couleur).toBe(DEFAULTS.yeux.couleur)
    expect(out.incertains).toEqual(['yeux.couleur'])
  })

  it('réponse vide → Pilou d’origine, champs obligatoires à vérifier', () => {
    const out = normalizeStyle(null)
    for (const fam of Object.keys(FIELDS)) expect(out[fam]).toEqual(DEFAULTS[fam])
    expect(out.incertains.length).toBeGreaterThan(5)
    expect(out.incertains.every((p) => PATHS.includes(p))).toBe(true)
  })

  it('nomme chaque trait, dans l’ordre d’apparition, avec « À vérifier »', () => {
    const items = traitsToShow(normalizeStyle(LEA))
    expect(items.map((t) => t.label)).toEqual([
      'Cheveux mi-longs, ondulés, châtains, raie sur le côté',
      'Sourcils moyens',
      'Yeux noisette',
      'Lunettes rondes',
      'Taches de rousseur',
      'Boucles d’oreilles en puces',
    ])
    expect(items.find((t) => t.id === 'yeux').unsure).toBe(true)
    expect(items.filter((t) => t.unsure)).toHaveLength(1)
    expect(checksToShow(normalizeStyle(LEA))).toEqual(['Vérifiez la couleur des yeux'])
  })

  it('décrit des réglages, jamais la personne (aucun mot sur l’âge, le genre, la beauté)', () => {
    const many = [LEA, null, { ...LEA, barbe: { type: 'longue', couleur: 'grise' }, cheveux: { ...LEA.cheveux, longueur: 'aucun' }, oreilles: { boucles: 'pendantes', piercing_nez: true } }]
    const text = many.flatMap((f) => traitsToShow(normalizeStyle(f)).map((t) => t.label)).join(' ')
    expect(text).not.toMatch(/\b(âge|jeune|vieux|vieille|homme|femme|joli|jolie|beau|belle|origine|peau)\b/i)
  })
})

describe('envoi au relais', () => {
  const photo = () => ({ mimeType: 'image/jpeg', data: 'AAAA' })

  it('un seul envoi, au bon chemin, 30 s au plus ; la photo est vidée', async () => {
    const storage = memoryStorage()
    const post = vi.fn(async () => ({ parsed: LEA, month: { remaining: 2, resetAt: '2026-12-01T00:00:00Z' } }))
    const p = photo()
    const out = await analyzeSelfie(p, { post, storage, now: Date.parse('2026-11-16T21:00:00Z') })
    expect(post).toHaveBeenCalledTimes(1)
    const [body, opts] = post.mock.calls[0]
    expect(opts).toEqual({ path: PILOU_STYLE_PATH, timeoutMs: PHOTO_TIMEOUT_MS })
    expect(PHOTO_TIMEOUT_MS).toBe(30_000)
    expect(Object.keys(body)).toEqual(['image'])
    expect(p.data).toBeNull()
    expect(out.style).toEqual(LEA)
    expect(out.remaining).toBe(2)
  })

  it('la photo est vidée aussi quand l’envoi échoue', async () => {
    const p = photo()
    await expect(analyzeSelfie(p, { post: async () => { throw new Error('Pas de connexion') }, storage: memoryStorage() })).rejects.toThrow('Pas de connexion')
    expect(p.data).toBeNull()
  })

  it('3 analyses par mois : la 4e n’envoie rien ; le compteur repart le mois suivant', async () => {
    const storage = memoryStorage()
    const now = Date.parse('2026-11-30T10:00:00Z')
    let remaining = 3
    const post = vi.fn(async () => ({ parsed: LEA, month: { remaining: --remaining } }))
    for (let i = 0; i < 3; i += 1) await analyzeSelfie(photo(), { post, storage, now })
    expect(photoAnalysesLeft({ storage, now })).toBe(0)
    await expect(analyzeSelfie(photo(), { post, storage, now })).rejects.toThrow(CAP_MESSAGE)
    expect(post).toHaveBeenCalledTimes(3)
    expect(photoAnalysesLeft({ storage, now: Date.parse('2026-12-01T00:00:01Z') })).toBe(3)
  })
})

describe('selfie en mémoire', () => {
  it('caméra avant sans micro ; refus → message qui renvoie au Studio', async () => {
    const getUserMedia = vi.fn(async () => 'flux')
    expect(await openFrontCamera({ mediaDevices: { getUserMedia } })).toBe('flux')
    expect(getUserMedia.mock.calls[0][0]).toMatchObject({ audio: false, video: { facingMode: 'user' } })
    await expect(openFrontCamera({ mediaDevices: { getUserMedia: async () => { throw new Error('NotAllowed') } } })).rejects.toThrow(/à la main/)
    await expect(openFrontCamera({ mediaDevices: {} })).rejects.toThrow(/caméra/)
  })

  it('coupe chaque piste de la caméra', () => {
    const stop = vi.fn()
    stopCamera({ getTracks: () => [{ stop }, { stop }] })
    expect(stop).toHaveBeenCalledTimes(2)
    expect(() => stopCamera(null)).not.toThrow()
  })

  it('réduit à 512 px, ré-encode en JPEG et vide le canevas', () => {
    const ctx = { drawImage: vi.fn(), clearRect: vi.fn() }
    const canvas = { width: 0, height: 0, getContext: () => ctx, toDataURL: vi.fn(() => 'data:image/jpeg;base64,QUJD') }
    const doc = { createElement: () => canvas }
    const shot = captureSelfie({ videoWidth: 1280, videoHeight: 960 }, { doc })
    expect(SELFIE_MAX_SIDE).toBe(512)
    expect(shot).toEqual({ mimeType: 'image/jpeg', data: 'QUJD', width: 512, height: 384 })
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85)
    expect(ctx.clearRect).toHaveBeenCalled()
    expect(canvas.width).toBe(0)
    expect(() => captureSelfie({ videoWidth: 0, videoHeight: 0 }, { doc })).toThrow()
  })
})

describe('textes du parcours', () => {
  const files = ['PilouPhotoFlow.jsx', 'client.js', 'selfie.js', 'style.js'].map((f) => read(`src/companion/photo/${f}`))

  it('le vocabulaire interdit n’y apparaît pas', () => {
    for (const code of files) {
      for (const line of stripComments(code)) {
        for (const { re, why } of FORBIDDEN_WORDING) expect(re.test(line), `${why} : ${line}`).toBe(false)
      }
    }
  })

  it('aucune formule « slop IA »', () => {
    for (const code of files) {
      const flat = stripComments(code).join(' ').replace(/\s+/g, ' ')
      for (const { re, why } of SLOP_WORDING) expect(re.test(flat), why).toBe(false)
    }
  })
})
