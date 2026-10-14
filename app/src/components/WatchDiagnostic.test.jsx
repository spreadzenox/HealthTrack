import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WatchDiagnostic, { watchJournal } from './WatchDiagnostic'

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
    render(<WatchDiagnostic available run={run} save={save} copy={copy} setup={null} connect={null} />)
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
    expect(await screen.findByText('Diagnostic interrompu : boom')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tester la connexion directe' })).not.toBeDisabled())
  })

  it('une seule carte : connexion en tête, dépannage replié une fois connectée, un journal commun exporté', async () => {
    const connected = {
      startedAt: '2026-10-14T07:30:00.000Z',
      finishedAt: '2026-10-14T07:30:09.000Z',
      steps: [{ id: 'auth', label: 'Authentification', status: 'ok' }],
      outcome: { code: 'connected', title: 'Montre connectée à HealthTrack' },
    }
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify(connected))
    localStorage.setItem('healthtrack_watch_diagnostic_last', JSON.stringify(REPORT))
    const save = vi.fn(async () => 'ok')
    const { container } = render(<WatchDiagnostic available run={vi.fn()} save={save} copy={vi.fn()} setup={null} connect={vi.fn()} />)
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.getByText('Montre connectée à HealthTrack')).toBeInTheDocument()
    expect(container.querySelector('details.watch-trouble').open).toBe(false)
    expect(screen.getAllByRole('button', { name: 'Enregistrer le journal' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le journal' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    const [json, filename] = save.mock.calls[0]
    expect(JSON.parse(json).connect.outcome.code).toBe('connected')
    expect(JSON.parse(json).diagnostic.verdict.code).toBe('no_answer')
    expect(filename).toBe('healthtrack-journal-montre-2026-10-14-07-30.json')
  })

  it('jamais connectée : dépannage déplié', () => {
    const { container } = render(<WatchDiagnostic available run={vi.fn()} setup={null} connect={vi.fn()} />)
    expect(container.querySelector('details.watch-trouble').open).toBe(true)
  })

  it('watchJournal : rien à exporter → objets nuls, nom daté du jour', () => {
    const { json, filename } = watchJournal({}, new Date('2026-10-14T08:00:00Z'))
    expect(JSON.parse(json)).toMatchObject({ connect: null, diagnostic: null, version: 1 })
    expect(filename).toBe('healthtrack-journal-montre-2026-10-14-08-00.json')
  })
})
