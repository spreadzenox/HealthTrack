import { describe, it, expect, vi } from 'vitest'
import { buildPlan, MORE_ONBOARDING, ROUTES, EMPTY_ROUTES, EMPTY_SCROLLS, iphoneDemoEntries, runCaptureStep, STEP_KEY, probeHealthKit, probeGutEvening, probeEveningNote, probePortionReminder, probeDataRoundtrip, probeBackup, probeVoice, probeFace, probeFileImport, IMPORT_TEST_FILE, probeShareExport, probeShareReport, probeSnapshotWelcome, probeDeleteAll, waitForAck, watchRejections, lastSeenChangelogId, androidWords, pageText, healthSampleWindow, fakePhoneUsage, installPhoneUsageFake } from './captureMode'
import { phoneUsageEntriesFromSegments, summarizeSegmentsDay } from './phoneUsageIos'
import { summarizeSegmentsApps } from './phoneAppsIos'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
    data,
  }
}

function deps(local, overrides = {}) {
  return {
    storage: { upsertEntries: vi.fn(async () => ({ inserted: 3 })) },
    demoEntries: () => [{}, {}, {}],
    latestChangelogId: 'x',
    localStorage: local,
    go: vi.fn(),
    log: vi.fn(),
    wait: async () => {},
    signal: vi.fn(async () => {}),
    waitAck: vi.fn(async () => true),
    ...overrides,
  }
}

describe('mode captures iOS : parcours des pages piloté par l’app', () => {
  it('plan : installation vierge, puis chaque page en clair avec les données de démo, puis quelques-unes en sombre', () => {
    const plan = buildPlan(['/', '/journal'], ['/'], {})
    expect(plan.map((s) => s.name)).toEqual([
      'vierge-onboarding', 'vierge-onboarding-tuto-2', 'demo-clair-accueil', 'demo-clair-journal', 'demo-sombre-accueil',
    ])
    expect(plan[1]).toMatchObject({ route: '/bienvenue', data: null, onboarding: { flow: 2, step: 0, card: 1 } })
    expect(plan[2]).toMatchObject({ route: '/', data: 'demo', theme: 'light' })
    expect(plan[4]).toMatchObject({ route: '/', data: 'demo', theme: 'dark' })
  })

  // Android v786 (ANALYSES-ONGLETS-1) : sous-onglet « Ventre » d'Analyses, aussi dans `npm run visual` d'Android
  // (« recommendations-ventre ») ; une page à deux niveaux donne un nom de fichier sans « / »
  it('plan : le sous-onglet Ventre d’Analyses est capturé, sous un nom de fichier plat', () => {
    expect(ROUTES).toContain('/recommendations/ventre')
    expect(ROUTES).toContain('/agir') // onglet Agir (Android #803, ORG-1)
    const plan = buildPlan(['/recommendations/ventre'], [], {})
    expect(plan.map((s) => s.name)).toContain('demo-clair-recommendations-ventre')
  })

  it('plan : les autres écrans du nouvel accueil sur iPhone, après la 2e carte du tuto (objectifs, sources, trouvé, visage, première note)', () => {
    const plan = buildPlan(['/'], [], {}, {}, MORE_ONBOARDING)
    expect(plan.map((s) => s.name)).toEqual([
      'vierge-onboarding', 'vierge-onboarding-tuto-2', 'vierge-onboarding-objectifs', 'vierge-onboarding-sources',
      'vierge-onboarding-trouve', 'vierge-onboarding-visage', 'vierge-onboarding-premiere-note', 'demo-clair-accueil',
    ])
    // Nouvel accueil d'Android (08/11) : chaque écran rouvert par `lastScreen`, au parcours de la version 2
    expect(plan[3]).toMatchObject({ route: '/bienvenue', data: null, onboarding: { flow: 2, lastScreen: 'sources' } })
    expect(plan.slice(2, 7).map((s) => s.onboarding.lastScreen)).toEqual(['goal', 'sources', 'found', 'face', 'first'])
  })

  it('plan : états vides (onboarding fini, base vide), après l’onboarding et avant les données de démo', () => {
    const plan = buildPlan(['/'], [], {}, {}, [], ['/', '/journal'])
    expect(plan.map((s) => s.name)).toEqual([
      'vierge-onboarding', 'vierge-onboarding-tuto-2', 'vide-accueil', 'vide-journal', 'demo-clair-accueil',
    ])
    expect(plan[3]).toMatchObject({ route: '/journal', data: 'empty', theme: 'light' })
    // par défaut : les pages qui ont un état vide à montrer
    expect(EMPTY_ROUTES).toEqual(expect.arrayContaining(['/', '/journal', '/recommendations', '/connectors']))
    expect(buildPlan().some((s) => s.data === 'empty')).toBe(false)
  })

  it('état vide défilé : Sources vierge montre aussi la carte du temps d’écran, sous le pli', () => {
    const plan = buildPlan([], [], {}, {}, [], ['/connectors'], { '/connectors': 1 })
    expect(plan.map((s) => s.name)).toEqual(['vierge-onboarding', 'vierge-onboarding-tuto-2', 'vide-connectors', 'vide-connectors-2'])
    expect(plan[3]).toMatchObject({ route: '/connectors', data: 'empty', theme: 'light', scroll: 1 })
    expect(EMPTY_SCROLLS).toEqual({ '/connectors': 1 })
  })

  it('état vide : onboarding fini et Nouveautés vues, comme au sortir de l’onboarding, sans données', async () => {
    const plan = buildPlan(['/'], [], {}, {}, [], ['/journal'])
    const local = memoryStorage({ [STEP_KEY]: '1' })
    const d = deps(local)
    await runCaptureStep(plan, d) // 2e carte du tuto → Journal vide
    expect(JSON.parse(local.data.healthtrack_onboarding)).toMatchObject({ done: true })
    expect(local.data['healthtrack-whats-new-last-seen']).toBe('x')
    expect(local.data.healthtrack_theme).toBe('light')
    expect(d.storage.upsertEntries).not.toHaveBeenCalled()
    expect(d.go).toHaveBeenLastCalledWith('/journal')

    await runCaptureStep(plan, d) // Journal vide → Accueil avec les données de démo
    expect(d.storage.upsertEntries).toHaveBeenCalledTimes(1)
    expect(d.go).toHaveBeenLastCalledWith('/')
  })

  it('plan : les pages longues ont aussi leurs écrans suivants, défilés', () => {
    const plan = buildPlan(['/connectors'], [], { '/connectors': 2 }, {})
    expect(plan.slice(2).map((s) => [s.name, s.scroll ?? 0])).toEqual([
      ['demo-clair-connectors', 0], ['demo-clair-connectors-2', 1], ['demo-clair-connectors-3', 2],
    ])
  })

  it('plan : un volet replié peut être ouvert puis capturé (guide des montres sous « Ajouter une source »)', () => {
    const reveal = { name: 'guides', click: 'Ajouter une source', open: 'guide-garmin', target: 'watch-guides-title' }
    const plan = buildPlan(['/connectors', '/data'], [], { '/connectors': 1 }, { '/connectors': [reveal] })
    expect(plan.slice(2).map((s) => s.name)).toEqual([
      'demo-clair-connectors', 'demo-clair-connectors-2', 'demo-clair-connectors-guides', 'demo-clair-data',
    ])
    expect(plan[4]).toMatchObject({ route: '/connectors', data: 'demo', theme: 'light', reveal })
    // par défaut : le guide des montres de Sources
    expect(buildPlan().map((s) => s.name)).toContain('demo-clair-connectors-guides')
  })

  it('volet à ouvrir : ouvert avant que la page soit signalée', async () => {
    const reveal = { name: 'guides', click: 'Ajouter une source', open: 'guide-garmin', target: 'watch-guides-title' }
    const plan = buildPlan(['/connectors'], [], {}, { '/connectors': [reveal] })
    const local = memoryStorage({ [STEP_KEY]: '3' })
    const order = []
    const d = deps(local, {
      reveal: vi.fn(async (r) => order.push(`reveal ${r.click}`)),
      signal: vi.fn(async (name) => order.push(`signal ${name}`)),
    })
    await runCaptureStep(plan, d)
    expect(order).toEqual(['reveal Ajouter une source', 'signal demo-clair-connectors-guides', 'signal fin'])
  })

  it('2e carte du tuto : le nouvel accueil reprend à sa 2e carte', async () => {
    const plan = buildPlan(['/'], [], {})
    const local = memoryStorage()
    const d = deps(local)
    await runCaptureStep(plan, d) // vierge → 2e carte du tuto
    expect(JSON.parse(local.data.healthtrack_onboarding)).toEqual({ flow: 2, step: 0, card: 1 })
    expect(d.storage.upsertEntries).not.toHaveBeenCalled()
    expect(d.go).toHaveBeenLastCalledWith('/bienvenue')
  })

  it('écran défilé : la page descend avant d’être signalée', async () => {
    const plan = buildPlan(['/connectors'], [], { '/connectors': 1 }, {})
    const local = memoryStorage({ [STEP_KEY]: '3' })
    const order = []
    const d = deps(local, {
      scroll: vi.fn((n) => order.push(`scroll ${n}`)),
      signal: vi.fn(async (name) => order.push(`signal ${name}`)),
    })
    await runCaptureStep(plan, d)
    expect(order).toEqual(['scroll 1', 'signal demo-clair-connectors-2', 'signal fin'])
  })

  it('annonce la page prête, puis prépare la suivante (données une seule fois, thème) et y va', async () => {
    const plan = buildPlan(['/', '/journal'], ['/'], {})
    const local = memoryStorage({ [STEP_KEY]: '1' })
    const d = deps(local)
    await runCaptureStep(plan, d) // choix de la montre → accueil
    expect(d.log).toHaveBeenCalledWith('[capture] page vierge-onboarding-tuto-2')
    expect(d.storage.upsertEntries).toHaveBeenCalledTimes(1)
    expect(JSON.parse(local.data.healthtrack_onboarding)).toMatchObject({ done: true })
    expect(local.data['healthtrack-whats-new-last-seen']).toBe('x')
    expect(local.data.healthtrack_theme).toBe('light')
    expect(local.data[STEP_KEY]).toBe('2')
    expect(d.go).toHaveBeenLastCalledWith('/')

    await runCaptureStep(plan, d) // accueil → journal
    await runCaptureStep(plan, d) // journal → accueil sombre
    expect(local.data.healthtrack_theme).toBe('dark')
    expect(d.storage.upsertEntries).toHaveBeenCalledTimes(1)
    expect(d.go.mock.calls.map((c) => c[0])).toEqual(['/', '/journal', '/'])
  })

  it('chaque page est relue avant d’être signalée : les mots propres à Android sont notés dans la console', async () => {
    const plan = buildPlan(['/'], [], {})
    const local = memoryStorage({ [STEP_KEY]: '2' })
    const d = deps(local, { readText: () => 'Autoriser Health Connect · Google Play · app Santé' })
    await runCaptureStep(plan, d)
    expect(d.log).toHaveBeenCalledWith('[texte] demo-clair-accueil : Health Connect, Google Play')
    const propre = deps(memoryStorage({ [STEP_KEY]: '2' }), { readText: () => 'Autoriser l’app Santé' })
    await runCaptureStep(plan, propre)
    expect(propre.log.mock.calls.flat().some((m) => String(m).startsWith('[texte]'))).toBe(false)
  })

  it('après la dernière page : « fin », plus aucune navigation', async () => {
    const plan = buildPlan(['/'], [], {})
    const local = memoryStorage({ [STEP_KEY]: '2' })
    const d = deps(local)
    await runCaptureStep(plan, d)
    expect(d.log).toHaveBeenCalledWith('[capture] page demo-clair-accueil')
    expect(d.log).toHaveBeenLastCalledWith('[capture] fin')
    expect(d.go).not.toHaveBeenCalled()
    await runCaptureStep(plan, d)
    expect(d.go).not.toHaveBeenCalled()
  })

  it('chaque page est signalée au script, et l’app attend son accusé avant de passer à la suivante', async () => {
    const plan = buildPlan(['/'], [], {})
    const local = memoryStorage({ [STEP_KEY]: '1' })
    const order = []
    const d = deps(local, {
      signal: vi.fn(async (name) => order.push(`signal ${name}`)),
      waitAck: vi.fn(async (name) => {
        order.push(`ack ${name}`)
        return true
      }),
      go: vi.fn((route) => order.push(`go ${route}`)),
    })
    await runCaptureStep(plan, d)
    expect(order).toEqual(['signal vierge-onboarding-tuto-2', 'ack vierge-onboarding-tuto-2', 'go /'])
    await runCaptureStep(plan, d)
    expect(order.slice(3)).toEqual(['signal demo-clair-accueil', 'ack demo-clair-accueil', 'signal fin'])
  })

  it('après la dernière page : la sonde HealthKit passe avant « fin », avec les mêmes signal et accusé', async () => {
    const plan = buildPlan(['/'], [], {})
    const local = memoryStorage({ [STEP_KEY]: '2' })
    const order = []
    const d = deps(local, {
      signal: vi.fn(async (name) => order.push(`signal ${name}`)),
      probe: vi.fn(async ({ signal, waitAck }) => {
        await signal('healthkit-autorisation')
        await waitAck('healthkit-autorisation')
      }),
    })
    await runCaptureStep(plan, d)
    expect(d.probe).toHaveBeenCalledTimes(1)
    expect(order).toEqual(['signal demo-clair-accueil', 'signal healthkit-autorisation', 'signal fin'])
  })
})

describe('accusé du script (waitForAck)', () => {
  it('rend vrai dès que l’accusé porte le nom attendu, faux après le nombre d’essais donné', async () => {
    const reads = ['', 'autre', 'page']
    const readAck = vi.fn(async () => reads.shift() ?? '')
    const sleep = vi.fn(async () => {})
    expect(await waitForAck({ readAck, sleep }, 'page', 10)).toBe(true)
    expect(readAck).toHaveBeenCalledTimes(3)
    const never = vi.fn(async () => {
      throw new Error('absent')
    })
    expect(await waitForAck({ readAck: never, sleep }, 'page', 4)).toBe(false)
    expect(never).toHaveBeenCalledTimes(4)
  })
})

describe('mots propres à Android sur une page de l’iPhone (androidWords)', () => {
  it('relève chaque mot une fois, sans les marques dont l’app existe aussi sur iPhone', () => {
    expect(androidWords('Health Connect, puis Health Connect ; Android ; Samsung Health ; Gadgetbridge'))
      .toEqual(['Health Connect', 'Android', 'Samsung Health', 'Gadgetbridge'])
    // Le temps d'écran existe aussi sur iPhone depuis le 31/10 (UE, iOS 26.4+) : le nommer y est juste
    expect(androidWords('Temps d’écran et sommeil ; votre temps d\'écran')).toEqual([])
    expect(androidWords('Google Play et le Play Store')).toEqual(['Google Play', 'Play Store'])
    // Huawei Health, Withings, Garmin… écrivent dans l'app Santé de l'iPhone : les nommer y est juste
    expect(androidWords('Huawei Health, Withings, Garmin et l’app Santé')).toEqual([])
    expect(androidWords('')).toEqual([])
  })
})

describe('texte relu d’une page de l’iPhone (pageText)', () => {
  it('laisse de côté les passages où nommer une fonction d’Android est juste sur iPhone', () => {
    const root = document.createElement('main')
    root.innerHTML = '<h2>Vos sources</h2><section aria-labelledby="phone-usage-title"><h3 id="phone-usage-title">'
      + 'Temps d’écran et sommeil</h3><p>Pas encore disponible sur iPhone.</p></section><p>Autoriser Health Connect</p>'
    const text = pageText(root, ['[aria-labelledby="phone-usage-title"]'])
    expect(text).toContain('Vos sources')
    expect(text).not.toContain('Temps d’écran')
    expect(androidWords(text)).toEqual(['Health Connect'])
    // Par défaut, plus aucun passage écarté : la carte du temps d'écran de l'iPhone est relue comme le reste
    expect(pageText(root)).toContain('Pas encore disponible sur iPhone.')
  })
})

describe('Nouveautés déjà vues pendant les captures (lastSeenChangelogId)', () => {
  it('prend la dernière note de la variante, pas celle de tout l’historique (une note d’Android cachée sur iPhone)', () => {
    // v590 : la note la plus récente d'Android était cachée sur iPhone ; marquée « vue », l'app ne la trouvait pas
    // dans ses Nouveautés et annonçait toutes les autres (« … et 13 autres changements ») sur chaque capture
    const changelog = { ALL_CHANGELOG: [{ id: 'android-seule' }, { id: 'commune' }], CHANGELOG: [{ id: 'commune' }] }
    expect(lastSeenChangelogId(changelog)).toBe('commune')
    expect(lastSeenChangelogId({ ALL_CHANGELOG: [], CHANGELOG: [] })).toBeNull()
  })
})

describe('promesses rejetées sans traitement (watchRejections)', () => {
  it('les rend en erreur de la console, comptée dans js-errors.txt', () => {
    const target = new EventTarget()
    const report = vi.fn()
    watchRejections(target, report)
    const event = new Event('unhandledrejection')
    event.reason = new Error('plugin absent')
    target.dispatchEvent(event)
    expect(report).toHaveBeenCalledWith('[capture] promesse rejetée sans traitement :', expect.stringContaining('plugin absent'))
    const bare = new Event('unhandledrejection')
    bare.reason = 'refus'
    target.dispatchEvent(bare)
    expect(report).toHaveBeenLastCalledWith('[capture] promesse rejetée sans traitement :', 'refus')
  })
})

describe('sonde HealthKit (I4)', () => {
  function health({ acceptOnAck }) {
    let accept
    const answer = new Promise((resolve) => {
      accept = resolve
    })
    return {
      accept,
      api: {
        isAvailable: vi.fn(async () => ({ available: true })),
        checkAuthorization: vi.fn(async () => ({ readAuthorized: [] })),
        requestAuthorization: vi.fn(() => (acceptOnAck ? answer : new Promise(() => {}))),
        saveSample: vi.fn(async () => {}),
        readSamples: vi.fn(async () => ({ samples: [{ value: 1234 }] })),
      },
    }
  }

  it('laisse au script le temps du test d’interface (au moins 2 min), puis écrit et relit des pas', async () => {
    const h = health({ acceptOnAck: true })
    const logs = []
    const waitAck = vi.fn(async () => {
      h.accept({ readAuthorized: ['steps'] }) // le test d'interface a touché « Autoriser » avant l'accusé
      return true
    })
    await probeHealthKit({ signal: vi.fn(async () => {}), waitAck, wait: async () => {}, log: (m) => logs.push(m), health: h.api })
    const [name, tries] = waitAck.mock.calls[0]
    expect(name).toBe('healthkit-autorisation')
    expect(tries * 300).toBeGreaterThanOrEqual(120_000)
    expect(h.api.requestAuthorization).toHaveBeenCalledWith({
      read: expect.arrayContaining(['steps', 'heartRateVariability']),
      write: ['steps', 'heartRateVariability'],
    })
    expect(h.api.saveSample).toHaveBeenCalledWith(expect.objectContaining({ dataType: 'steps', value: 1234 }))
    expect(h.api.saveSample).toHaveBeenCalledWith(expect.objectContaining({ dataType: 'heartRateVariability', value: 48 }))
    expect(logs.join('\n')).toMatch(/\[healthkit\] readSamples \{"count":1,"values":\[1234\]\}/)
  })

  it('acceptée : les pas écrits repassent par le connecteur de l’app (celui de Sources), puis entrent dans la base', async () => {
    const h = health({ acceptOnAck: true })
    const logs = []
    const sync = vi.fn(async ({ writer }) => {
      await writer([
        { type: 'steps', source: 'health_connect', payload: { value: 1234, sourceName: 'Halcya' } },
        { type: 'sleep', payload: {} },
        { type: 'heart_rate', payload: { value: 48, subtype: 'heartRateVariabilitySdnn' } },
        { type: 'heart_rate', payload: { bpm: 70, subtype: 'heartRate' } },
      ])
      return { synced: 2, skipped: 0, errors: [] }
    })
    const waitAck = async () => {
      h.accept({})
      return true
    }
    const stored = []
    const store = { upsertEntries: vi.fn(async (entries) => stored.push(...entries)), listEntries: vi.fn(async () => stored) }
    await probeHealthKit({ signal: async () => {}, waitAck, wait: async () => {}, log: (m) => logs.push(m), health: h.api, connector: { sync }, store })
    const { since, until } = sync.mock.calls[0][0]
    // Le connecteur relit la fenêtre écrite : la dernière heure, sans remonter avant minuit (healthSampleWindow)
    expect(until.getTime() - since.getTime()).toBeGreaterThanOrEqual(1000)
    expect(until.getTime() - since.getTime()).toBeLessThanOrEqual(3600 * 1000 + 5000)
    expect(logs.join('\n')).toContain(
      '[healthkit] connecteur {"synced":2,"errors":[],"pas":[{"value":1234,"source":"Halcya"}],"vfc":[{"value":48,"subtype":"heartRateVariabilitySdnn"}]}',
    )
    // Puis la vraie synchronisation, rangée dans la base comme depuis Sources : les pas écrits y sont
    expect(sync).toHaveBeenCalledTimes(2)
    expect(store.upsertEntries).toHaveBeenCalledTimes(1)
    expect(logs.join('\n')).toContain('[healthkit] base {"synced":2,"pas":[1234]}')
  })

  it('puis les pas importés sont cherchés dans le Journal, et la page est capturée (I4)', async () => {
    const h = health({ acceptOnAck: true })
    const logs = []
    const signals = []
    const sync = vi.fn(async ({ writer }) => {
      await writer([{ type: 'steps', source: 'health_connect', payload: { value: 1234, sourceName: 'Halcya' } }])
      return { synced: 1, skipped: 0, errors: [] }
    })
    const waitAck = async () => {
      h.accept({})
      return true
    }
    const store = { upsertEntries: vi.fn(async () => {}), listEntries: vi.fn(async () => []) }
    const navigate = vi.fn()
    await probeHealthKit({
      signal: async (name) => signals.push(name), waitAck, wait: async () => {}, log: (m) => logs.push(m),
      health: h.api, connector: { sync }, store, navigate, readText: () => 'Aujourd’hui · Pas 1\u202f234',
    })
    expect(navigate).toHaveBeenCalledWith('/journal')
    expect(logs.join('\n')).toContain('[healthkit] journal {"pas":true}')
    expect(signals).toEqual(['healthkit-autorisation', 'healthkit-journal'])
  })

  it('feuille jamais acceptée : le dit et n’écrit rien', async () => {
    const h = health({ acceptOnAck: false })
    const logs = []
    await probeHealthKit({ signal: async () => {}, waitAck: async () => true, wait: async () => {}, log: (m) => logs.push(m), health: h.api })
    expect(h.api.saveSample).not.toHaveBeenCalled()
    expect(logs.join('\n')).toMatch(/feuille toujours ouverte/)
  })
})

describe('sonde du bilan du ventre du soir (I5)', () => {
  function gutEvening({ granted = true } = {}) {
    let notes = []
    return {
      requestNotifications: vi.fn(async () => ({ asked: true, notifications: granted })),
      testNotification: vi.fn(async () => {}),
      list: vi.fn(async () => ({ notes })),
      answer: (level) => {
        notes = [{ name: 'gut-1', json: `{"v":1,"level":"${level}","at":1}` }]
      },
      drain: () => {
        notes = []
      },
    }
  }

  it('autorisation acceptée par le test d’interface, notification d’essai, « Gêne » retrouvé dans la boîte', async () => {
    const plugin = gutEvening()
    const order = []
    const logs = []
    const waitAck = vi.fn(async (name) => {
      order.push(`ack ${name}`)
      if (name === 'notification-bilan') plugin.answer('discomfort') // geste du test d'interface
      return true
    })
    const importInbox = vi.fn(async () => {
      plugin.drain()
      return { imported: 1, inserted: 1, dropped: 0, kept: 0 }
    })
    const waits = []
    await probeGutEvening({ signal: async (n) => order.push(`signal ${n}`), waitAck, wait: async (ms) => waits.push(ms), log: (m) => logs.push(m), plugin, importInbox })
    expect(order).toEqual(['signal notification-autorisation', 'ack notification-autorisation', 'signal notification-bilan', 'ack notification-bilan'])
    expect(waitAck.mock.calls.every(([, tries]) => tries * 300 >= 120_000)).toBe(true)
    // notification d'essai en bannière, assez tard pour que le test d'interface l'attende déjà : xcodebuild met
    // jusqu'à ~30 s à lancer le test (iPhone 16e, 28/10), la bannière ne reste que quelques secondes
    expect(plugin.testNotification).toHaveBeenCalledWith({ delay: expect.any(Number), banner: true })
    expect(plugin.testNotification.mock.calls[0][0].delay).toBeGreaterThanOrEqual(40)
    expect(logs.join('\n')).toContain('[notification] boîte {"count":1,"levels":["discomfort"]}')
    // puis l'import de l'app (comme à l'ouverture suivante) : le bilan entre dans l'historique, la boîte se vide
    expect(importInbox).toHaveBeenCalledWith({ plugin })
    expect(logs.join('\n')).toContain('[notification] import {"imported":1,"inserted":1,"dropped":0,"kept":0,"left":0}')
    // l'import prévient l'app, qui reprogramme ses rappels : on la laisse finir avant l'essai suivant (28/10 : la
    // reprogrammation de la note du soir retirait sa notification d'essai)
    expect(waits.at(-1)).toBeGreaterThanOrEqual(2000)
  })

  it('notifications refusées : le dit et ne déclenche rien', async () => {
    const plugin = gutEvening({ granted: false })
    const logs = []
    await probeGutEvening({ signal: async () => {}, waitAck: async () => true, wait: async () => {}, log: (m) => logs.push(m), plugin })
    expect(plugin.testNotification).not.toHaveBeenCalled()
    expect(logs.join('\n')).toMatch(/notifications refusées/)
  })
})

describe('sonde de la note du soir (I5)', () => {
  function eveningNote({ notifications = true } = {}) {
    let notes = []
    return {
      status: vi.fn(async () => ({ notifications })),
      testNotification: vi.fn(async () => {}),
      list: vi.fn(async () => ({ notes })),
      answer: (score) => {
        notes = [{ name: 'note-1', json: `{"v":1,"score":${score},"at":1}` }]
      },
      drain: () => {
        notes = []
      },
    }
  }

  it('notification d’essai en bannière, note touchée par le test d’interface retrouvée dans la boîte', async () => {
    const plugin = eveningNote()
    const order = []
    const logs = []
    const waitAck = vi.fn(async (name) => {
      order.push(`ack ${name}`)
      if (name === 'note-du-soir') plugin.answer(4) // geste du test d'interface
      return true
    })
    const importInbox = vi.fn(async () => {
      plugin.drain()
      return { imported: 1, inserted: 1, dropped: 0, kept: 0 }
    })
    const waits = []
    await probeEveningNote({ signal: async (n) => order.push(`signal ${n}`), waitAck, wait: async (ms) => waits.push(ms), log: (m) => logs.push(m), plugin, importInbox })
    expect(order).toEqual(['signal note-du-soir', 'ack note-du-soir'])
    expect(waitAck.mock.calls.every(([, tries]) => tries * 300 >= 240_000)).toBe(true)
    expect(plugin.testNotification).toHaveBeenCalledWith({ delay: expect.any(Number), banner: true })
    expect(plugin.testNotification.mock.calls[0][0].delay).toBeGreaterThanOrEqual(40)
    expect(logs.join('\n')).toContain('[note] boîte {"count":1,"scores":[4]}')
    expect(importInbox).toHaveBeenCalledWith({ plugin })
    expect(logs.join('\n')).toContain('[note] import {"imported":1,"inserted":1,"dropped":0,"kept":0,"left":0}')
    expect(waits.at(-1)).toBeGreaterThanOrEqual(2000)
  })

  it('notifications non autorisées : le dit et ne déclenche rien', async () => {
    const plugin = eveningNote({ notifications: false })
    const logs = []
    const signal = vi.fn(async () => {})
    await probeEveningNote({ signal, waitAck: async () => true, wait: async () => {}, log: (m) => logs.push(m), plugin })
    expect(plugin.testNotification).not.toHaveBeenCalled()
    expect(signal).not.toHaveBeenCalled()
    expect(logs.join('\n')).toMatch(/\[note\] essai notifications non autorisées/)
  })
})

describe('sonde du rappel de portion (I5)', () => {
  function portionReminder({ notifications = true } = {}) {
    let open = false
    return {
      schedule: vi.fn(async ({ items }) => ({ count: items.length, notifications })),
      takeOpen: vi.fn(async () => {
        const was = open
        open = false
        return { open: was }
      }),
      touch: () => {
        open = true
      },
    }
  }

  it('rappel programmé par la vraie méthode, touché par le test d’interface : page et toucher relevés', async () => {
    const plugin = portionReminder()
    const order = []
    const logs = []
    const location = { pathname: '/settings' }
    const waitAck = vi.fn(async (name) => {
      order.push(`ack ${name}`)
      if (name === 'rappel-portion') plugin.touch() // toucher du test d'interface, l'app ne l'a pas encore lu
      return true
    })
    await probePortionReminder({ signal: async (n) => order.push(`signal ${n}`), waitAck, wait: async () => {}, log: (m) => logs.push(m), plugin, location, now: () => 1_000_000 })
    expect(order).toEqual(['signal rappel-portion', 'ack rappel-portion'])
    expect(waitAck.mock.calls.every(([, tries]) => tries * 300 >= 240_000)).toBe(true)
    const [{ items }] = plugin.schedule.mock.calls[0]
    expect(items).toHaveLength(1)
    expect(items[0].at - 1_000_000).toBeGreaterThanOrEqual(40_000)
    expect(items[0].title).toBe('Votre portion du jour')
    expect(logs.join('\n')).toContain('[portion] après le toucher {"page":"/settings","open":true}')
    // l'essai ne laisse aucun rappel derrière lui
    expect(plugin.schedule).toHaveBeenLastCalledWith({ items: [] })
  })

  it('notifications non autorisées : le dit, ne signale rien et ne laisse aucun rappel', async () => {
    const plugin = portionReminder({ notifications: false })
    const logs = []
    const signal = vi.fn(async () => {})
    await probePortionReminder({ signal, waitAck: async () => true, wait: async () => {}, log: (m) => logs.push(m), plugin, location: { pathname: '/' }, now: () => 0 })
    expect(signal).not.toHaveBeenCalled()
    expect(plugin.schedule).toHaveBeenLastCalledWith({ items: [] })
    expect(logs.join('\n')).toMatch(/\[portion\] essai notifications non autorisées/)
  })
})

describe('sonde des données : export, fichier, réimport (I3)', () => {
  function fakeStorage(entries) {
    let db = [...entries]
    return {
      countAllEntries: vi.fn(async () => db.length),
      exportToJson: vi.fn(async () => JSON.stringify({ version: 1, entries: db })),
      parseBackup: (json) => ({ entries: JSON.parse(json).entries }),
      importFromJson: vi.fn(async (json, { merge }) => {
        const incoming = JSON.parse(json).entries
        const fresh = merge ? incoming.filter((e) => !db.some((d) => d.id === e.id)) : incoming
        db = merge ? [...db, ...fresh] : fresh
        return { imported: fresh.length, skipped: incoming.length - fresh.length }
      }),
    }
  }
  function fakeFiles() {
    const disk = new Map()
    return {
      disk,
      write: vi.fn(async (name, text) => disk.set(name, text)),
      read: vi.fn(async (name) => disk.get(name)),
      remove: vi.fn(async (name) => disk.delete(name)),
    }
  }

  it('exporte toute la base, l’écrit et la relit comme l’app, la réimporte sans doublon, ne laisse rien', async () => {
    const storage = fakeStorage([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    const files = fakeFiles()
    const logs = []
    await probeDataRoundtrip({ log: (m) => logs.push(m), storage, files })
    expect(storage.importFromJson).toHaveBeenCalledWith(expect.any(String), { merge: true })
    expect(files.disk.size).toBe(0)
    expect(logs.join('\n')).toMatch(/\[données\] aller-retour \{"count":3,"exported":3,"reread":3,"imported":0,"skipped":3,"after":3,"bytes":\d+\}/)
  })

  it('un échec est dit, sans lever', async () => {
    const storage = { ...fakeStorage([]), exportToJson: vi.fn(async () => { throw new Error('base fermée') }) }
    const logs = []
    await probeDataRoundtrip({ log: (m) => logs.push(m), storage, files: fakeFiles() })
    expect(logs.join('\n')).toContain('[données] échec base fermée')
  })
})

describe('sonde de la sauvegarde du téléphone (I3)', () => {
  it('relève ce que la sauvegarde iCloud emporterait : dossiers, base, copie de secours', async () => {
    const plugin = {
      backupStatus: vi.fn(async () => ({
        items: [
          { path: 'Documents', excluded: false, bytes: 790000, files: 1 },
          { path: 'Library/WebKit/WebsiteData/Default/x/IndexedDB', excluded: false, bytes: 1200000, files: 4 },
          { path: 'Library/Application Support/Halcya/device_marker', excluded: true, bytes: 36, files: 1 },
        ],
      })),
    }
    const logs = []
    await probeBackup({ log: (m) => logs.push(m), plugin, checkRestore: async () => ({ restored: false }) })
    expect(logs.join('\n')).toContain('[sauvegarde] Documents {"excluded":false,"bytes":790000,"files":1}')
    expect(logs.join('\n')).toContain('[sauvegarde] Library/WebKit/WebsiteData/Default/x/IndexedDB {"excluded":false,"bytes":1200000,"files":4}')
    expect(logs.join('\n')).toContain('[sauvegarde] Library/Application Support/Halcya/device_marker {"excluded":true,"bytes":36,"files":1}')
    expect(logs.join('\n')).toContain('[sauvegarde] repère {"restored":false}')
  })

  it('un échec est dit, sans lever', async () => {
    const logs = []
    const checkRestore = async () => {
      throw new Error('lecture impossible')
    }
    await probeBackup({ log: (m) => logs.push(m), plugin: { backupStatus: async () => { throw new Error('absent') } }, checkRestore })
    expect(logs.join('\n')).toContain('[sauvegarde] échec absent')
    expect(logs.join('\n')).toContain('[sauvegarde] repère échec lecture impossible')
  })
})

describe('sonde de « Supprimer toutes mes données » (I3)', () => {
  it('vide la base et efface la copie de secours qui partirait dans la sauvegarde iCloud', async () => {
    let count = 3
    let copie = { text: '{}', savedAt: 'x' }
    const storage = { countAllEntries: vi.fn(async () => count) }
    const deleteAll = vi.fn(async () => {
      const entries = count
      count = 0
      copie = null
      return { entries }
    })
    const logs = []
    await probeDeleteAll({ log: (m) => logs.push(m), storage, readSnapshot: async () => copie, deleteAll })
    expect(logs).toEqual(['[suppression] avant {"count":3,"copie":true}', '[suppression] après {"entries":3,"count":0,"copie":false}'])
  })

  it('un échec est dit, sans lever', async () => {
    const logs = []
    const deleteAll = async () => {
      throw new Error('base fermée')
    }
    await probeDeleteAll({ log: (m) => logs.push(m), storage: { countAllEntries: async () => 1 }, readSnapshot: async () => null, deleteAll })
    expect(logs.join('\n')).toContain('[suppression] échec base fermée')
  })
})

describe('sonde de la copie proposée à l’onboarding après une restauration (I3)', () => {
  it('copie à jour, base vidée, onboarding repris sans recharger ; « Reprendre » rend toute la base', async () => {
    let count = 3
    const calls = []
    const storage = {
      countAllEntries: vi.fn(async () => count),
      deleteAllEntries: vi.fn(async () => {
        calls.push('base vidée')
        count = 0
      }),
    }
    const local = memoryStorage({ healthtrack_onboarding: '{"done":true}', healthtrack_theme: 'dark' })
    local.removeItem = (k) => delete local.data[k]
    const signal = vi.fn(async (name) => calls.push(`capture ${name}`))
    const logs = []
    await probeSnapshotWelcome({
      log: (m) => logs.push(m),
      signal,
      waitAck: vi.fn(async () => true),
      wait: async () => {},
      storage,
      localStorage: local,
      writeSnapshot: vi.fn(async () => calls.push('copie écrite') && true),
      navigate: (path) => calls.push(`page ${path}`),
      clickRestore: () => {
        calls.push('reprendre')
        count = 3
        local.setItem('healthtrack_theme', 'dark') // rétabli par la copie
        return true
      },
    })
    expect(calls).toEqual(['copie écrite', 'base vidée', 'page /bienvenue', 'capture restauration-onboarding', 'reprendre', 'capture restauration-reprise'])
    expect(JSON.parse(local.data.healthtrack_onboarding)).toMatchObject({ done: true })
    expect(logs).toEqual(['[restauration] avant {"count":3,"copie":true,"vidée":0}', '[restauration] après {"bouton":true,"count":3,"réglages":true}'])
  })
})

describe('sonde de l’import par le sélecteur de fichiers (I3)', () => {
  it('écrit un ancien fichier (tableau nu) dans Documents, ouvre Vos données, le test d’interface le choisit, « Ajouter » l’importe', async () => {
    let count = 10
    const calls = []
    const disk = new Map()
    const files = {
      write: vi.fn(async (name, text) => disk.set(name, text)),
      remove: vi.fn(async (name) => disk.delete(name)),
    }
    const logs = []
    await probeFileImport({
      log: (m) => logs.push(m),
      signal: vi.fn(async (name) => calls.push(`capture ${name}`)),
      waitAck: vi.fn(async () => true),
      wait: async () => {},
      storage: { countAllEntries: vi.fn(async () => count) },
      files,
      navigate: (path) => calls.push(`page ${path}`),
      reveal: (label) => calls.push(`montré ${label}`) && true,
      click: (label) => {
        calls.push(`touché ${label}`)
        count = 12
        return true
      },
    })
    expect(files.write).toHaveBeenCalledWith(IMPORT_TEST_FILE, expect.any(String))
    const written = JSON.parse(files.write.mock.calls[0][1])
    expect(Array.isArray(written)).toBe(true) // ancien format : tableau nu, sans version
    expect(written).toHaveLength(2)
    expect(calls).toEqual(['page /data', 'montré Choisir un fichier à importer', 'capture import-fichier', 'touché Ajouter à mes données'])
    expect(disk.size).toBe(0)
    expect(logs).toEqual(['[import] fichier {"avant":10,"bouton":true,"ajouter":true,"après":12}'])
  })
})

describe('sonde vocale (I8)', () => {
  it('dit si le français se reconnaît sur l’iPhone, avec le verdict d’Android, sans micro ni son', async () => {
    const logs = []
    const plugin = { probe: vi.fn(async () => ({ language: 'fr-FR', available: true, onDevice: true, support: { installed: ['fr-FR'], pending: [], supported: [], online: [] } })) }
    await probeVoice({ log: (m) => logs.push(m), plugin })
    expect(logs).toEqual(['[voix] sonde {"verdict":"on_device_fr","available":true,"onDevice":true}'])
  })

  it('sans réponse du plugin : dit qu’il n’y a rien', async () => {
    const logs = []
    await probeVoice({ log: (m) => logs.push(m), plugin: { probe: async () => { throw new Error('absent') } } })
    expect(logs).toEqual(['[voix] sonde {"verdict":null}'])
  })
})

describe('sonde de la lecture du visage (I7)', () => {
  it('le plugin répond avec ses modèles, en mode ouverture de l’app, sans valence ; la lecture de test s’arrête avant la caméra', async () => {
    const logs = []
    const plugin = {
      status: vi.fn(async () => ({ models: true, mode: 'app_open', affectModel: false, enabled: false })),
      test: vi.fn(async () => ({ outcome: 'skip:no_permission' })),
    }
    await probeFace({ log: (m) => logs.push(m), plugin, importBursts: async () => ({ imported: 0 }) })
    expect(logs).toEqual(['[visage] sonde {"plugin":true,"models":true,"mode":"app_open","affect":false,"outcome":"skip:no_permission","imported":0}'])
  })

  it('avec le portrait des captures : visage lu, rafale importée comme sur Android', async () => {
    const logs = []
    const plugin = {
      status: vi.fn(async () => ({ models: true, mode: 'app_open', affectModel: false })),
      test: vi.fn(async () => ({ outcome: 'face' })),
    }
    const importBursts = vi.fn(async ({ plugin: p }) => (p === plugin ? { imported: 1, inserted: 1 } : {}))
    await probeFace({ log: (m) => logs.push(m), plugin, importBursts })
    expect(logs).toEqual(['[visage] sonde {"plugin":true,"models":true,"mode":"app_open","affect":false,"outcome":"face","imported":1}'])
  })

  it('sans plugin, ou s’il échoue : le dit', async () => {
    const logs = []
    await probeFace({ log: (m) => logs.push(m), plugin: null })
    await probeFace({ log: (m) => logs.push(m), plugin: { status: async () => { throw new Error('absent') }, test: vi.fn() } })
    expect(logs).toEqual(['[visage] sonde {"plugin":false}', '[visage] sonde {"plugin":true,"error":"absent"}'])
  })
})

describe('sonde de l’export par la feuille de partage (I3)', () => {
  it('ouvre Vos données ; le test d’interface touche « Télécharger la sauvegarde » puis l’enregistre dans Fichiers', async () => {
    let names = ['Halcya-copie-de-secours.json', 'healthtrack-export-2026-10-27.json']
    const calls = []
    const logs = []
    await probeShareExport({
      log: (m) => logs.push(m),
      signal: vi.fn(async (name) => {
        calls.push(`capture ${name}`)
        // l'export écrit son fichier, puis « Enregistrer dans Fichiers › Garder les deux » en ajoute une copie
        names = [...names, 'halcya-export-2026-10-28.json', 'halcya-export-2026-10-28 2.json']
      }),
      waitAck: vi.fn(async () => true),
      wait: async () => {},
      navigate: (path) => calls.push(`page ${path}`),
      reveal: (label) => calls.push(`montré ${label}`) && true,
      list: async () => names,
    })
    expect(calls).toEqual(['page /data', 'montré Télécharger la sauvegarde', 'capture export-partage'])
    expect(logs).toEqual(['[export] partage {"bouton":true,"avant":1,"après":3}'])
  })
})

describe('mode captures iOS : données de démo de l’iPhone', () => {
  it('ni montre Huawei en direct, ni temps d’écran, ni visage ; la montre de Santé est une Apple Watch', () => {
    const entries = [
      { source: 'health_connect', type: 'steps', payload: { value: 8000, sourceName: 'Gadgetbridge' } },
      { source: 'huawei_watch', type: 'watch_stress', payload: { value: 28 } },
      { source: 'phone', type: 'phone_usage', payload: {} },
      { source: 'face_sense', type: 'face_burst', payload: {} },
      { source: 'app_food', type: 'food', payload: {} },
    ]
    expect(iphoneDemoEntries(entries)).toEqual([
      { source: 'health_connect', type: 'steps', payload: { value: 8000, sourceName: 'Apple Watch' } },
      { source: 'app_food', type: 'food', payload: {} },
    ])
    expect(entries[0].payload.sourceName).toBe('Gadgetbridge')
  })

  it('la balance passe par l’app Santé (pas de Withings en direct sur iPhone) : poids et masse grasse seulement', () => {
    const body = { valueKg: 77.2, fatRatioPct: 21.2, muscleMassKg: 32.4 }
    const at = '2026-10-28T07:30:00.000Z'
    expect(iphoneDemoEntries([
      { source: 'withings', type: 'weight', at, payload: body },
      { source: 'withings', type: 'body_composition', at, payload: body },
    ])).toEqual([
      { source: 'health_connect', type: 'weight', at, payload: { valueKg: 77.2 } },
      { source: 'health_connect', type: 'body_composition', at, payload: { fatRatioPct: 21.2 } },
    ])
  })

  it('la VFC de la démo est en SDNN, comme celle de l’app Santé (« VFC (SDNN) » dans le Journal et sur l’Accueil)', () => {
    const rmssd = { source: 'health_connect', type: 'heart_rate', payload: { value: 46, unit: 'ms', subtype: 'heartRateVariability', sourceName: 'Gadgetbridge' } }
    const resting = { source: 'health_connect', type: 'heart_rate', payload: { bpm: 61, subtype: 'restingHeartRate', sourceName: 'Gadgetbridge' } }
    expect(iphoneDemoEntries([rmssd, resting])).toEqual([
      { source: 'health_connect', type: 'heart_rate', payload: { value: 46, unit: 'ms', subtype: 'heartRateVariabilitySdnn', sourceName: 'Apple Watch' } },
      { source: 'health_connect', type: 'heart_rate', payload: { bpm: 61, subtype: 'restingHeartRate', sourceName: 'Apple Watch' } },
    ])
    expect(rmssd.payload.subtype).toBe('heartRateVariability')
  })

  it('les données de démo d’Android ne nomment plus Gadgetbridge ni Huawei', async () => {
    const { generateDemoEntries } = await import('../../scripts/visual/demoData.mjs')
    const text = JSON.stringify(iphoneDemoEntries(generateDemoEntries()))
    expect(text).not.toMatch(/Gadgetbridge|Huawei|"withings"/)
    expect(text).toMatch(/Apple Watch/)
  })

  it('plan : pas de page Montre (montre Huawei en direct) sur iPhone', () => {
    expect(buildPlan().map((s) => s.route)).not.toContain('/montre')
  })
})

describe('sonde du rapport PDF pour le médecin (N6b, correctif 09)', () => {
  it('ouvre Vos données, prépare le rapport ; le test d’interface touche « Créer le PDF » puis l’enregistre dans Fichiers', async () => {
    let names = ['Halcya-copie-de-secours.json', 'healthtrack-export-2026-10-28.json']
    const calls = []
    const logs = []
    await probeShareReport({
      log: (m) => logs.push(m),
      signal: vi.fn(async (name) => {
        calls.push(`capture ${name}`)
        // le PDF est écrit dans Documents, puis « Enregistrer dans Fichiers › Garder les deux » en ajoute une copie
        names = [...names, 'Halcya-rapport-2026-10-29.pdf', 'Halcya-rapport-2026-10-29 2.pdf']
      }),
      waitAck: vi.fn(async () => true),
      wait: async () => {},
      navigate: (path) => calls.push(`page ${path}`),
      click: (label) => calls.push(`touché ${label}`) && true,
      reveal: (label) => calls.push(`montré ${label}`) && true,
      list: async () => names,
      size: async (name) => (name === 'Halcya-rapport-2026-10-29.pdf' ? 48213 : 0),
      status: () => 'Halcya-rapport-2026-10-29.pdf est aussi dans l’app Fichiers › Sur mon iPhone › Halcya.',
    })
    expect(calls).toEqual(['page /data', 'touché Préparer le rapport', 'montré Créer le PDF', 'capture rapport-partage'])
    expect(logs).toEqual([
      '[rapport] partage {"préparer":true,"bouton":true,"avant":0,"après":2,"octets":48213,' +
        '"message":"Halcya-rapport-2026-10-29.pdf est aussi dans l’app Fichiers › Sur mon iPhone › Halcya."}',
    ])
  })

  it('sans PDF, ou si la sonde échoue : le dit', async () => {
    const logs = []
    const base = { log: (m) => logs.push(m), signal: async () => {}, waitAck: async () => true, wait: async () => {},
      navigate: () => {}, click: () => false, reveal: () => false, status: () => null }
    await probeShareReport({ ...base, list: async () => [] })
    await probeShareReport({ ...base, list: async () => { throw new Error('Documents illisible') } })
    expect(logs).toEqual([
      '[rapport] partage {"préparer":false,"bouton":false,"avant":0,"après":0,"octets":null,"message":null}',
      '[rapport] échec Documents illisible',
    ])
  })
})

describe('mode captures iOS : fenêtre des mesures écrites dans Santé', () => {
  it('la dernière heure, dans la journée : les pas de la sonde sont ceux d’aujourd’hui', () => {
    const w = healthSampleWindow(new Date(2026, 9, 30, 15, 0))
    expect(new Date(w.startDate)).toEqual(new Date(2026, 9, 30, 14, 0))
    expect(new Date(w.endDate)).toEqual(new Date(2026, 9, 30, 15, 0))
  })

  it('juste après minuit, la fenêtre commence à minuit (sinon les pas vont à hier, sous les 10 085 de la démo)', () => {
    const w = healthSampleWindow(new Date(2026, 9, 31, 0, 20))
    expect(new Date(w.startDate)).toEqual(new Date(2026, 9, 31, 0, 0))
    expect(new Date(w.endDate)).toEqual(new Date(2026, 9, 31, 0, 20))
  })

  it('dans la première seconde après minuit, une fenêtre d’une seconde (jamais vide)', () => {
    const w = healthSampleWindow(new Date(2026, 9, 31, 0, 0, 0, 500))
    expect(Date.parse(w.endDate) - Date.parse(w.startDate)).toBe(1000)
  })
})


describe('temps d’écran de démonstration (faux plugin PhoneUsage, I8)', () => {
  const now = new Date(2026, 9, 31, 15, 20)

  it('autorisé ; segments horaires des 10 derniers jours, jusqu’à maintenant, dont l’app tire des journées et une nuit', async () => {
    const plugin = fakePhoneUsage(now)
    expect(await plugin.checkAccess()).toEqual({ granted: true, supported: true })
    const { segments } = await plugin.queryUsageSegments({ start: now.getTime() - 10 * 86400000, end: now.getTime() })
    expect(segments.length).toBeGreaterThan(200)
    expect(Math.max(...segments.map((s) => s.end))).toBeLessThanOrEqual(now.getTime())
    const days = phoneUsageEntriesFromSegments(segments, { now: now.getTime() })
    expect(days.length).toBeGreaterThanOrEqual(8)
    for (const d of days) {
      expect(d.payload.screenMinutes).toBeGreaterThan(60)
      expect(d.payload.sleepEstimate?.minutes).toBeGreaterThan(6 * 60)
    }
    const today = summarizeSegmentsDay(segments, '2026-10-31', { now: now.getTime() })
    expect(today.screenMinutes).toBeGreaterThan(0)
    expect(today.unlocks).toBeGreaterThan(0)
    // Apps de démonstration (réseaux sociaux, messagerie, vidéo) : la carte montre « Dont … »
    const apps = summarizeSegmentsApps(segments, '2026-10-31')
    expect(Object.keys(apps.minutes).sort()).toEqual(['messaging', 'social', 'video'])
    expect(apps.topApps[0].label).toBe('Instagram')
  })

  it('tôt le matin aussi, la journée a déjà de l’écran et des apps (un peu d’écran juste après minuit)', async () => {
    const early = new Date(2026, 9, 31, 2, 30)
    const { segments } = await fakePhoneUsage(early).queryUsageSegments()
    const today = summarizeSegmentsDay(segments, '2026-10-31', { now: early.getTime() })
    expect(today.screenMinutes).toBeGreaterThan(0)
    expect(today.unlocks).toBeGreaterThan(0)
    expect(Object.keys(summarizeSegmentsApps(segments, '2026-10-31').minutes)).toContain('social')
  })

  it('installé : activé dans les réglages, puis la carte est relancée (visibilitychange)', () => {
    const store = new Map()
    const localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
    const target = {}
    const doc = { dispatchEvent: vi.fn() }
    installPhoneUsageFake({ target, localStorage, doc, now })
    expect(typeof target.__healthtrackFakePhoneUsage.queryUsageSegments).toBe('function')
    expect(JSON.parse(store.get('healthtrack_phone_usage')).enabled).toBe(true)
    expect(doc.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'visibilitychange' }))
  })
})
