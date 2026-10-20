import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FaceSenseCard from './FaceSenseCard'

const base = { models: true, enabled: true, permission: true, running: true, batteryExempt: true, dayUnlocks: 3, dayBursts: 3, dayFaces: 2 }

function fake(initial) {
  let state = { ...initial }
  return {
    status: vi.fn(async () => ({ ...state })),
    start: vi.fn(async () => {
      state = { ...state, enabled: true, running: true, permission: true }
      return { started: true, permission: true }
    }),
    stop: vi.fn(async () => {
      state = { ...state, enabled: false, running: false }
    }),
    test: vi.fn(async () => {}),
    requestBatteryExemption: vi.fn(async () => {}),
  }
}

describe('FaceSenseCard', () => {
  beforeEach(() => localStorage.clear())

  it('hors de l’app Android : explication seule', () => {
    render(<FaceSenseCard plugin={null} />)
    expect(screen.getByText('Lecture du visage')).toBeInTheDocument()
    expect(screen.getByText('Disponible dans l’app Android.')).toBeInTheDocument()
    expect(screen.getByText(/puis les efface/)).toBeInTheDocument()
  })

  it('app Android mais module natif muet : la carte le dit et propose Réessayer (signalement du 19/10)', async () => {
    const plugin = fake({ ...base, enabled: false, running: false })
    plugin.status.mockRejectedValueOnce(new Error('"FaceSense" plugin is not implemented on android'))
    render(<FaceSenseCard plugin={plugin} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByText(/ne répond pas/)).toBeInTheDocument()
    expect(screen.queryByText('Disponible dans l’app Android.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('button', { name: 'Activer la lecture du visage' })).toBeInTheDocument()
  })

  it('désactivée → Activer démarre le service', async () => {
    const plugin = fake({ ...base, enabled: false, running: false })
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer la lecture du visage' }))
    await waitFor(() => expect(plugin.start).toHaveBeenCalled())
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Aujourd’hui : 3 déverrouillages, 3 lectures, visage lu 2 fois.')).toBeInTheDocument()
  })

  it('active : comptes, jamais de score ; diagnostic et désactivation', async () => {
    const plugin = fake({ ...base, values: { smile: 0.42 }, lastOutcome: 'face' })
    const save = vi.fn(async () => 'ok enregistré')
    render(<FaceSenseCard plugin={plugin} save={save} />)
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/0[.,]42/)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le diagnostic' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const [json, filename] = save.mock.calls[0]
    expect(filename).toMatch(/^healthtrack-visage-.*\.json$/)
    expect(JSON.parse(json).kind).toBe('healthtrack-face-diagnostic')
    expect(json).not.toMatch(/smile/)
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver' }))
    await waitFor(() => expect(plugin.stop).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: 'Activer la lecture du visage' })).toBeInTheDocument()
  })

  it('arrêtée par Android : Relancer en un geste', async () => {
    const plugin = fake({ ...base, running: false })
    render(<FaceSenseCard plugin={plugin} />)
    expect(await screen.findByText('Arrêtée')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Relancer' }))
    await waitFor(() => expect(plugin.start).toHaveBeenCalled())
    expect(await screen.findByText('Active')).toBeInTheDocument()
  })

  it('batterie optimisée : bouton « Sans restriction »', async () => {
    const plugin = fake({ ...base, batteryExempt: false })
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sans restriction' }))
    expect(plugin.requestBatteryExemption).toHaveBeenCalled()
  })

  it('caméra refusée à l’activation : message, rien d’activé', async () => {
    const plugin = fake({ ...base, enabled: false, running: false })
    plugin.start = vi.fn(async () => ({ started: false, permission: false }))
    render(<FaceSenseCard plugin={plugin} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Activer la lecture du visage' }))
    expect(await screen.findByText('Accès à la caméra refusé : rien n’a été activé.')).toBeInTheDocument()
  })

  it('range les rafales en attente à l’affichage et dit combien sont gardées, sans valeur', async () => {
    const plugin = fake(base)
    const importBursts = vi.fn(async () => ({ imported: 2 }))
    const loadHistory = vi.fn(async () => ({ stored: 12, forMood: 9, firstAt: '2026-10-19T06:00:00.000Z' }))
    const save = vi.fn(async () => 'ok')
    render(<FaceSenseCard plugin={plugin} importBursts={importBursts} loadHistory={loadHistory} save={save} />)
    expect(await screen.findByText(/12 lectures gardées depuis le 19 octobre/)).toBeInTheDocument()
    expect(importBursts).toHaveBeenCalledWith({ plugin })
    expect(screen.getByText(/Historique : 12 lectures rangées, dont 9 au déverrouillage/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le diagnostic' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(JSON.parse(save.mock.calls[0][0]).history).toMatchObject({ stored: 12, forMood: 9 })
  })

  it('la vérification visage ↔ notes est facultative : elle ne bloque plus l’affichage (consigne du 19/10 au soir)', async () => {
    const gate = { state: 'candidate', nDays: 12, needed: 30, r: null, z: null, openedAt: null, closedAt: null, periods: [], looks: [] }
    const loadHistory = vi.fn(async () => ({ stored: 40, forMood: 30, firstAt: '2026-10-19T06:00:00.000Z', gate }))
    render(<FaceSenseCard plugin={fake(base)} importBursts={vi.fn(async () => ({}))} loadHistory={loadHistory} />)
    expect(await screen.findByText(/Vérification facultative : 12 jours sur 30/)).toBeInTheDocument()
    expect(screen.getByText(/Vérification visage ↔ notes \(facultative\) : 12 \/ 30 jours comparables/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Rien n’est affiché/)
  })

  it('affiche l’humeur estimée dès la première lecture, avec fourchette et confiance ; le diagnostic n’en garde pas la valeur', async () => {
    const estimate = {
      moment: { at: new Date().toISOString(), note: 3.6, low: 2, high: 5, label: 'plutôt bonne', today: true },
      day: { date: '2026-10-19', note: 3.6, low: 2, high: 5, label: 'plutôt bonne', readings: 1, quality: 1, framing: 4, spread: null },
      confidence: 'faible', model: 'prior', baselineDays: 1, calibrationDays: 0, signals: ['visage'],
    }
    const loadHistory = vi.fn(async () => ({ stored: 1, forMood: 1, firstAt: new Date().toISOString(), estimate }))
    const save = vi.fn(async () => 'ok')
    render(<FaceSenseCard plugin={fake(base)} importBursts={vi.fn(async () => ({}))} loadHistory={loadHistory} save={save} loadEveningNote={async () => null} />)
    expect(await screen.findByText(/Bien-être estimé aujourd’hui : plutôt bonne, ≈ 3,6 \/ 5 \(entre 2,0 et 5,0\)/)).toBeInTheDocument()
    expect(screen.getByText(/Confiance faible : 1 lecture aujourd’hui/)).toBeInTheDocument()
    expect(screen.getByText(/estimation, pas un diagnostic/)).toBeInTheDocument()
    expect(screen.getByText(/Humeur estimée : modèle général des expressions, confiance faible/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le diagnostic' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const report = JSON.parse(save.mock.calls[0][0])
    expect(report.estimate).toEqual({ model: 'prior', confidence: 'faible', readingsToday: 1, baselineDays: 1, calibrationDays: 0 })
    expect(save.mock.calls[0][0]).not.toMatch(/3\.6|plutôt bonne/)
  })

  it('Tester maintenant : dit l’humeur de ce moment, sans la compter dans le jour', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const testEstimate = { at: new Date().toISOString(), trigger: 'manual', note: 2.4, low: 0.8, high: 4, label: 'moyenne', halfWidth: 1.6 }
      const loadHistory = vi.fn(async () => ({ stored: 1, forMood: 0, firstAt: new Date().toISOString(), testEstimate }))
      const plugin = fake(base)
      render(<FaceSenseCard plugin={plugin} importBursts={vi.fn(async () => ({}))} loadHistory={loadHistory} loadEveningNote={async () => null} />)
      fireEvent.click(await screen.findByRole('button', { name: 'Tester maintenant' }))
      await vi.advanceTimersByTimeAsync(4500)
      expect(await screen.findByText(/Test : visage lu\. Humeur de ce moment : moyenne, ≈ 2,4 \/ 5/)).toBeInTheDocument()
      expect(plugin.test).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('caméra refusée en arrière-plan (signalement du 19/10 15:05) : Relancer redémarre app ouverte, guide Shizuku / ADB', async () => {
    const attempts = JSON.stringify([{ at: Date.now(), trigger: 'unlock', source: 'keyguard', outcome: 'camera:camera_disabled' }])
    const plugin = fake({ ...base, cameraOp: 'foreground', attempts })
    render(<FaceSenseCard plugin={plugin} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByText('À relancer')).toBeInTheDocument()
    expect(screen.getByText(/refusé la caméra/)).toBeInTheDocument()
    expect(screen.getAllByText(/appops set com\.healthtrack\.app CAMERA allow/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Relancer' }))
    await waitFor(() => expect(plugin.start).toHaveBeenCalledWith({ restart: true }))
  })

  it('accès permanent accordé (Shizuku / ADB) : le diagnostic le dit', async () => {
    const plugin = fake({ ...base, cameraOp: 'allow' })
    render(<FaceSenseCard plugin={plugin} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.getAllByText(/accordé en permanence/).length).toBeGreaterThan(0)
  })

  it('active et modèle valence / éveil absent : téléchargement lancé une fois à l’ouverture (étape 2)', async () => {
    const plugin = { ...fake({ ...base, affectModel: false }), prepareAffect: vi.fn(async () => ({ ready: false, downloading: true })) }
    render(<FaceSenseCard plugin={plugin} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByText('Active')).toBeInTheDocument()
    await waitFor(() => expect(plugin.prepareAffect).toHaveBeenCalledTimes(1))
    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((r) => setTimeout(r, 20))
    expect(plugin.prepareAffect).toHaveBeenCalledTimes(1)
  })

  it('désactivée ou modèle déjà là : aucun téléchargement', async () => {
    const off = { ...fake({ ...base, enabled: false, running: false, affectModel: false }), prepareAffect: vi.fn(async () => ({})) }
    const { unmount } = render(<FaceSenseCard plugin={off} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByRole('button', { name: 'Activer la lecture du visage' })).toBeInTheDocument()
    unmount()
    const ready = { ...fake({ ...base, affectModel: true }), prepareAffect: vi.fn(async () => ({})) }
    render(<FaceSenseCard plugin={ready} importBursts={async () => {}} loadHistory={async () => null} loadEveningNote={async () => null} />)
    expect(await screen.findByText('Active')).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 20))
    expect(off.prepareAffect).not.toHaveBeenCalled()
    expect(ready.prepareAffect).not.toHaveBeenCalled()
  })
})
