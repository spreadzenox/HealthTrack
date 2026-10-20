import { describe, it, expect, vi } from 'vitest'
import {
  getApkAsset,
  formatMo,
  formatDuration,
  estimateSpeed,
  progressLabel,
  describeFailure,
  describePaused,
  describeInstallError,
  createUpdateRunner,
} from './appUpdate'

const RELEASE = {
  tag_name: 'v188',
  html_url: 'https://github.com/spreadzenox/HealthTrack/releases/tag/v188',
  assets: [
    {
      name: 'HealthTrack-v188.apk',
      size: 33_562_556,
      digest: 'sha256:126b9e436515309f93fecbc0e1dd4e58dbfe39386a0c98f34ac893e2728ff977',
      browser_download_url: 'https://github.com/spreadzenox/HealthTrack/releases/download/v188/HealthTrack-v188.apk',
    },
  ],
}
const ASSET = getApkAsset(RELEASE)

describe('getApkAsset', () => {
  it("lit l'adresse, la taille et l'empreinte de l'APK", () => {
    expect(ASSET).toEqual({
      url: RELEASE.assets[0].browser_download_url,
      name: 'HealthTrack-v188.apk',
      size: 33_562_556,
      digest: RELEASE.assets[0].digest,
    })
  })
  it('sans APK : null ; taille inconnue : null', () => {
    expect(getApkAsset({ assets: [] })).toBeNull()
    expect(getApkAsset(null)).toBeNull()
    expect(getApkAsset({ assets: [{ name: 'a.apk', browser_download_url: 'u' }] }).size).toBeNull()
  })
})

describe('formatage', () => {
  it('Mo et durées en français', () => {
    const n = (x) => x.replace(/\u00a0/g, ' ')
    expect(n(formatMo(33_562_556))).toBe('33,6 Mo')
    expect(n(formatMo(0))).toBe('0,0 Mo')
    expect(n(formatDuration(42))).toBe('42 s')
    expect(n(formatDuration(125))).toBe('2 min 05 s')
    expect(n(formatDuration(3 * 3600 + 120))).toBe('3 h 02')
    expect(formatDuration(null)).toBeNull()
    expect(formatDuration(Infinity)).toBeNull()
  })

  it('progression : Mo reçus / totaux, pourcentage, débit, temps restant', () => {
    const { percent, text } = progressLabel({ downloaded: 12_300_000, total: 33_600_000, speed: 1_000_000, eta: 21.3 })
    expect(percent).toBe(36)
    expect(text.replace(/\u00a0/g, ' ')).toBe('12,3 Mo / 33,6 Mo · 36 % · 1,0 Mo/s · encore ≈ 21 s')
    expect(progressLabel({ downloaded: 5_000_000, total: 0 }).text.replace(/\u00a0/g, ' ')).toBe('5,0 Mo')
  })
})

describe('estimateSpeed', () => {
  it('débit sur les dernières secondes et temps restant', () => {
    const samples = [
      { t: 0, bytes: 0 },
      { t: 2000, bytes: 2_000_000 },
      { t: 4000, bytes: 4_000_000 },
    ]
    const { speed, eta } = estimateSpeed(samples, 10_000_000)
    expect(speed).toBe(1_000_000)
    expect(eta).toBe(6)
  })
  it('pas assez de recul : rien', () => {
    expect(estimateSpeed([{ t: 0, bytes: 0 }], 10)).toEqual({ speed: null, eta: null })
  })
})

describe('messages', () => {
  it("échecs exacts du DownloadManager et de l'installation", () => {
    expect(describeFailure(1006)).toMatch(/Espace de stockage insuffisant/)
    expect(describeFailure(404)).toBe('Le serveur GitHub a répondu « erreur 404 ».')
    expect(describeFailure(7)).toMatch(/code 7/)
    expect(describePaused(2)).toMatch(/En attente de réseau/)
    expect(describeInstallError({ error: 'sha_mismatch' })).toMatch(/abîmé/)
    expect(describeInstallError({ error: 'exception', detail: 'boom' })).toMatch(/boom/)
  })
})

/** Faux plugin natif + horloge manuelle. */
function harness({ granted = true, statuses = [], install = { ok: true } } = {}) {
  let t = 0
  let pending = null
  const queue = [...statuses]
  const plugin = {
    canInstall: vi.fn(async () => ({ granted })),
    openInstallSettings: vi.fn(async () => {}),
    start: vi.fn(async () => ({ id: 1 })),
    status: vi.fn(async () => (queue.length > 1 ? queue.shift() : queue[0])),
    install: vi.fn(async () => install),
    cancel: vi.fn(async () => {}),
  }
  const states = []
  const runner = createUpdateRunner({
    plugin,
    asset: ASSET,
    version: '188',
    onChange: (s) => states.push(s),
    now: () => t,
    setTimer: (fn) => {
      pending = fn
      return 1
    },
    clearTimer: () => {
      pending = null
    },
    stallMs: 45_000,
  })
  const flush = () => new Promise((r) => setTimeout(r, 0))
  const tick = async (ms) => {
    t += ms
    const fn = pending
    pending = null
    fn?.()
    await flush()
    await flush()
  }
  return { plugin, runner, states, tick, flush, last: () => states.at(-1) }
}

describe('createUpdateRunner', () => {
  it('téléchargement → vérification → installateur, avec Mo reçus et débit', async () => {
    const h = harness({
      statuses: [
        { state: 'pending', downloaded: 0, total: -1, version: '188' },
        { state: 'running', downloaded: 2_000_000, total: 33_562_556, version: '188' },
        { state: 'running', downloaded: 6_000_000, total: 33_562_556, version: '188' },
        { state: 'successful', downloaded: 33_562_556, total: 33_562_556, version: '188' },
      ],
    })
    await h.runner.start()
    await h.flush()
    expect(h.plugin.start).toHaveBeenCalledWith({
      url: ASSET.url,
      version: '188',
      size: 33_562_556,
      digest: ASSET.digest,
    })
    expect(h.last()).toMatchObject({ step: 'download', downloaded: 0, total: 33_562_556 })
    await h.tick(1000)
    expect(h.last()).toMatchObject({ step: 'download', downloaded: 2_000_000 })
    await h.tick(2000)
    expect(h.last().downloaded).toBe(6_000_000)
    expect(h.last().speed).toBeCloseTo(2_000_000)
    await h.tick(1000)
    expect(h.states.map((s) => s.step)).toContain('verify')
    expect(h.last().step).toBe('installer')
    expect(h.plugin.install).toHaveBeenCalledTimes(1)
  })

  it("sans l'autorisation « applis inconnues » : ouvre le réglage, ne télécharge pas", async () => {
    const h = harness({ granted: false })
    await h.runner.start()
    expect(h.plugin.openInstallSettings).toHaveBeenCalled()
    expect(h.plugin.start).not.toHaveBeenCalled()
    expect(h.last()).toMatchObject({ step: 'permission' })
    expect(h.last().notice).toMatch(/Installer des applis inconnues/)
  })

  it("signale un téléchargement qui ne progresse plus, sans l'annuler", async () => {
    const h = harness({ statuses: [{ state: 'running', downloaded: 1_000_000, total: 33_000_000, version: '188' }] })
    await h.runner.start()
    await h.flush()
    await h.tick(20_000)
    expect(h.last().stalled).toBe(false)
    await h.tick(30_000)
    expect(h.last()).toMatchObject({ step: 'download', stalled: true })
    expect(h.plugin.cancel).not.toHaveBeenCalled()
  })

  it("explique une pause réseau et un échec avec sa cause exacte", async () => {
    const h = harness({
      statuses: [
        { state: 'paused', reason: 2, downloaded: 5, total: 10, version: '188' },
        { state: 'failed', reason: 1006, downloaded: 5, total: 10, version: '188' },
      ],
    })
    await h.runner.start()
    await h.flush()
    expect(h.last().notice).toMatch(/En attente de réseau/)
    await h.tick(1000)
    expect(h.last()).toMatchObject({ step: 'error' })
    expect(h.last().error).toMatch(/Espace de stockage insuffisant/)
  })

  it('fichier abîmé : erreur claire, pas d’installateur', async () => {
    const h = harness({
      statuses: [{ state: 'successful', downloaded: 10, total: 10, version: '188' }],
      install: { ok: false, error: 'sha_mismatch' },
    })
    await h.runner.start()
    await h.flush()
    await h.flush()
    expect(h.last()).toMatchObject({ step: 'error' })
    expect(h.last().error).toMatch(/empreinte/)
  })

  it("reprend le suivi d'un téléchargement en cours pour la même version seulement", async () => {
    const h = harness({ statuses: [{ state: 'running', downloaded: 3, total: 10, version: '187' }] })
    expect(await h.runner.attach()).toBe(false)
    const h2 = harness({ statuses: [{ state: 'running', downloaded: 3, total: 10, version: '188' }] })
    expect(await h2.runner.attach()).toBe(true)
    await h2.flush()
    expect(h2.last()).toMatchObject({ step: 'download', downloaded: 3 })
    expect(h2.plugin.start).not.toHaveBeenCalled()
  })

  it('annuler : retour au départ', async () => {
    const h = harness({ statuses: [{ state: 'running', downloaded: 3, total: 10, version: '188' }] })
    await h.runner.start()
    await h.runner.cancel()
    expect(h.plugin.cancel).toHaveBeenCalled()
    expect(h.last().step).toBe('idle')
  })
})
