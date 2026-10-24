import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WatchDiagnostic from './WatchDiagnostic'
import { watchJournal } from '../devices/huawei/journal'
import { APP_NAME } from '../config/brand'

const REPORT = {
  startedAt: '2026-10-12T20:00:00.000Z',
  finishedAt: '2026-10-12T20:00:20.000Z',
  steps: [
    { id: 'bluetooth', label: 'Bluetooth du téléphone', status: 'ok' },
    { id: 'apps', label: 'Apps qui peuvent tenir la montre', status: 'warn', detail: 'Huawei Health' },
    { id: 'find', label: 'Recherche de la montre', status: 'ok' },
    { id: 'connect', label: 'Connexion directe', status: 'ok' },
    { id: 'services', label: 'Services Bluetooth de la montre', status: 'ok' },
    { id: 'subscribe', label: 'Canal Huawei (abonnement)', status: 'ok' },
    { id: 'link', label: 'Paramètres du lien (1re trame)', status: 'fail', detail: 'aucune réponse en 6 s' },
  ],
  watch: { name: 'HUAWEI WATCH GT 6 Pro-F2' },
  log: [{ t: 0, level: 'info', msg: 'x' }],
  verdict: { code: 'no_answer', title: 'La montre ne répond pas', advice: ['Elle est probablement liée à Huawei Health et ignore les autres apps.'] },
}

describe('WatchDiagnostic', () => {
  beforeEach(() => localStorage.clear())

  it('hors app Android : explique sans bouton', () => {
    render(<WatchDiagnostic available={false} />)
    expect(screen.getByText('Montre Huawei')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tester/ })).toBeNull()
  })

  it('lance le test, affiche étapes et verdict, garde le rapport et l’exporte', async () => {
    const run = vi.fn(async (onUpdate) => {
      onUpdate({ ...REPORT, finishedAt: undefined, verdict: null })
      return REPORT
    })
    const save = vi.fn(async () => 'Journal enregistré.')
    const copy = vi.fn(async () => 'Journal copié.')
    const background = vi.fn(async () => ({ lastDecision: 'absent', lastTrigger: 'unlock', periodic: true, lastSuccessAt: 0 }))
    render(<WatchDiagnostic available run={run} save={save} copy={copy} setup={null} connect={null} background={background} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tester la connexion directe' }))
    expect(await screen.findByText('La montre ne répond pas')).toBeInTheDocument()
    expect(screen.getByText('HUAWEI WATCH GT 6 Pro-F2')).toBeInTheDocument()
    expect(screen.getByText(/aucune réponse en 6 s/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('healthtrack_watch_diagnostic_last')).verdict.code).toBe('no_answer')

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le journal' }))
    await screen.findByText('Journal enregistré.')
    const [json, filename] = save.mock.calls[0]
    expect(JSON.parse(json).format).toBe('healthtrack-watch-journal')
    expect(JSON.parse(json).diagnostic.verdict.code).toBe('no_answer')
    expect(JSON.parse(json).connect).toBeNull()
    // relecture app fermée : dernière décision et déclencheur, pour le run suivant
    expect(JSON.parse(json).background).toEqual({ lastDecision: 'absent', lastTrigger: 'unlock', periodic: true, lastSuccessAt: null })
    expect(filename).toBe('healthtrack-journal-montre-2026-10-12-20-00.json')

    fireEvent.click(screen.getByRole('button', { name: 'Copier le journal' }))
    await screen.findByText('Journal copié.')
    expect(screen.getByRole('button', { name: 'Relancer le test' })).toBeInTheDocument()
  })

  it('réaffiche le dernier rapport au retour sur la page', () => {
    localStorage.setItem('healthtrack_watch_diagnostic_last', JSON.stringify(REPORT))
    render(<WatchDiagnostic available run={vi.fn()} setup={null} connect={null} />)
    expect(screen.getByText('La montre ne répond pas')).toBeInTheDocument()
  })

  it('erreur inattendue : message clair, bouton réactivé', async () => {
    render(<WatchDiagnostic available run={async () => { throw new Error('boom') }} setup={null} connect={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tester la connexion directe' }))
    expect(await screen.findByText(/Diagnostic interrompu : boom/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tester la connexion directe' })).not.toBeDisabled())
  })

  it('test qui ne finit jamais : interrompu au délai maximal, bouton réactivé (régression du 18/10/2026)', async () => {
    render(<WatchDiagnostic available run={() => new Promise(() => {})} maxMs={30} setup={null} connect={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tester la connexion directe' }))
    expect(screen.getByRole('button', { name: 'Test en cours…' })).toBeDisabled()
    expect(await screen.findByText(/Diagnostic interrompu : test : délai dépassé/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tester la connexion directe' })).not.toBeDisabled())
  })

  it('synchro en cours : le test l’attend et le dit', async () => {
    let release
    const run = vi.fn(() => new Promise((r) => (release = r)))
    render(<WatchDiagnostic available run={run} busy={() => true} setup={null} connect={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tester la connexion directe' }))
    expect(await screen.findByText('Synchro de la montre en cours : le test démarre dès qu’elle se termine.')).toBeInTheDocument()
    release(REPORT)
    expect(await screen.findByText('La montre ne répond pas')).toBeInTheDocument()
    expect(screen.queryByText(/Synchro de la montre en cours/)).toBeNull()
  })

  it('une seule carte : état + « Synchroniser » en tête, tout le reste replié sous « Diagnostic », un journal commun exporté', async () => {
    const connected = {
      startedAt: '2026-10-14T07:30:00.000Z',
      finishedAt: '2026-10-14T07:30:09.000Z',
      steps: [{ id: 'auth', label: 'Authentification', status: 'ok' }],
      outcome: { code: 'connected', title: `Montre connectée à ${APP_NAME}` },
    }
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify(connected))
    localStorage.setItem('healthtrack_watch_diagnostic_last', JSON.stringify(REPORT))
    localStorage.setItem('healthtrack_watch_autosync', JSON.stringify({ at: new Date().toISOString(), outcome: 'connected', inserted: 7, battery: 84, failures: 0, everConnected: true }))
    const save = vi.fn(async () => 'ok')
    const { container } = render(<WatchDiagnostic available run={vi.fn()} save={save} copy={vi.fn()} setup={null} connect={vi.fn()} />)
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.getByText(/batterie 84 % · synchro .* · 7 nouvelles mesures/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Synchroniser la montre' })).toBeInTheDocument()
    // plus de bandeau « Montre connectée » : le titre du résultat n'est montré qu'en cas d'échec
    expect(screen.queryByText(`Montre connectée à ${APP_NAME}`)).toBeNull()
    const diag = container.querySelector('details.watch-trouble')
    expect(diag.open).toBe(false)
    expect(diag.querySelector('summary').textContent).toBe('Diagnostic')
    for (const name of ['Enregistrer le journal', 'Refaire l’appairage', 'Relancer le test']) expect(diag.contains(screen.getByRole('button', { name }))).toBe(true)
    expect(container.querySelectorAll('details.watch-trouble')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Enregistrer le journal' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le journal' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const [json, filename] = save.mock.calls[0]
    expect(JSON.parse(json).connect.outcome.code).toBe('connected')
    expect(JSON.parse(json).diagnostic.verdict.code).toBe('no_answer')
    expect(filename).toBe('healthtrack-journal-montre-2026-10-14-07-30.json')
  })

  it('montre déjà connectée : lien visible vers l’écran « Montre » (M5), pas sous « Diagnostic »', () => {
    localStorage.setItem('healthtrack_watch_autosync', JSON.stringify({ at: new Date().toISOString(), outcome: 'connected', everConnected: true }))
    const { container } = render(
      <MemoryRouter>
        <WatchDiagnostic available run={vi.fn()} setup={null} connect={vi.fn()} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Voir ce qui remonte de la montre' })
    expect(link.getAttribute('href')).toBe('/montre')
    expect(container.querySelector('details.watch-trouble').contains(link)).toBe(false)
  })

  it('jamais connectée : « Diagnostic » replié et pas de lien vers l’écran « Montre » (VC-6, VC-8)', () => {
    const { container } = render(
      <MemoryRouter>
        <WatchDiagnostic available run={vi.fn()} setup={null} connect={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container.querySelector('details.watch-trouble').open).toBe(false)
    expect(screen.getByRole('button', { name: 'Connecter ma montre' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Voir ce qui remonte de la montre' })).toBeNull()
  })

  it('hors app Android et jamais connectée : pas de lien vers l’écran « Montre » (VC-6)', () => {
    render(
      <MemoryRouter>
        <WatchDiagnostic available={false} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: 'Voir ce qui remonte de la montre' })).toBeNull()
  })

  it('watchJournal : rien à exporter → objets nuls, nom daté du jour', () => {
    const { json, filename } = watchJournal({}, new Date('2026-10-14T08:00:00Z'))
    expect(JSON.parse(json)).toMatchObject({ connect: null, diagnostic: null, version: 1 })
    expect(filename).toBe('healthtrack-journal-montre-2026-10-14-08-00.json')
  })

  it('page Sources hors mode diagnostic (POL-8) : ni test de connexion ni journal à enregistrer', () => {
    render(<WatchDiagnostic available run={vi.fn()} setup={null} connect={null} troubleshooting={false} />)
    expect(screen.getByRole('heading', { name: 'Montre Huawei' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tester la connexion directe' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Enregistrer le journal' })).toBeNull()
  })
})
