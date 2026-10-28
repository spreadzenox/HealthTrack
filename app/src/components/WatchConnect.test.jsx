import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WatchConnect from './WatchConnect'
import { APP_NAME } from '../config/brand'

const hex16 = (n) => Array.from({ length: 16 }, (_, i) => ((i + n) & 0xff).toString(16).padStart(2, '0')).join(' ')
const FILE = `DIGEST_SECRETS = {\n  AuthVersion.V1: "${hex16(1)}",\n  AuthVersion.V2: "${hex16(2)}",\n  AuthVersion.V3: "${hex16(3)}",\n}`

const connected = {
  startedAt: '2026-10-13T00:30:00.000Z',
  finishedAt: '2026-10-13T00:30:05.000Z',
  steps: [{ id: 'auth', label: 'Authentification', status: 'ok', detail: 'trames chiffrées (AES-GCM)' }],
  outcome: { code: 'connected', title: `Montre appairée à ${APP_NAME}` },
}

describe('WatchConnect', () => {
  beforeEach(() => localStorage.clear())

  it('premier geste « Connecter ma montre » : télécharge les constantes, les garde en local, puis se connecte avec', async () => {
    const connect = vi.fn(async () => connected)
    const { container } = render(<WatchConnect connect={connect} fetchSecrets={async () => FILE} />)
    // carte d'un nouvel utilisateur : rien de technique hors « Diagnostic », replié (VC-8)
    expect(container.querySelector('details.watch-trouble').open).toBe(false)
    expect(container.querySelector('details.watch-trouble').contains(screen.getByRole('button', { name: 'Télécharger les paramètres' }))).toBe(true)
    expect(screen.getByText(/montre compatible Huawei/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    await waitFor(() => expect(connect).toHaveBeenCalled())
    expect(JSON.parse(localStorage.getItem('healthtrack_huawei_secrets')).v2).toBe(hex16(2).replace(/ /g, ''))
    expect(connect.mock.calls[0][0].secrets.v1).toBe(hex16(1).replace(/ /g, ''))
    expect(connect.mock.calls[0][0].rebind).toBe(false)
    expect(await screen.findByRole('button', { name: 'Synchroniser la montre' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Télécharger les paramètres' })).toBeNull()
    expect(container.querySelector('details.watch-trouble').open).toBe(false)
  })

  it('constantes non téléchargées au premier geste : message clair, pas de connexion', async () => {
    const connect = vi.fn()
    render(<WatchConnect connect={connect} fetchSecrets={async () => { throw new Error('hors ligne') }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    expect(await screen.findByText(/hors ligne.*connexion Internet/)).toBeTruthy()
    expect(connect).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Connecter ma montre' }).disabled).toBe(false)
  })

  it('échec de connexion : le conseil est visible sans déplier « Diagnostic », les étapes restent repliées', async () => {
    localStorage.setItem('healthtrack_huawei_secrets', JSON.stringify({ v1: 'a', v2: 'b', v3: 'c' }))
    const failed = { ...connected, outcome: { code: 'connect_failed', title: 'Montre introuvable' } }
    const { container } = render(<WatchConnect connect={vi.fn(async () => failed)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    const title = await screen.findByText('Montre introuvable')
    const diag = container.querySelector('details.watch-trouble')
    expect(diag.contains(title)).toBe(false)
    expect(diag.open).toBe(false)
    expect(diag.contains(screen.getByText(/AES-GCM/))).toBe(true)
  })

  it('page Sources hors mode diagnostic (POL-8) : pas de « Diagnostic » tant qu’aucune connexion n’a échoué', async () => {
    localStorage.setItem('healthtrack_huawei_secrets', JSON.stringify({ v1: 'a', v2: 'b', v3: 'c' }))
    const failed = { ...connected, outcome: { code: 'connect_failed', title: 'Montre introuvable' } }
    const { container } = render(<WatchConnect connect={vi.fn(async () => failed)} troubleshooting={false} />)
    expect(container.querySelector('details.watch-trouble')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    await screen.findByText('Montre introuvable')
    // après un échec, le dépannage (« Libérer et appairer », « Refaire l'appairage ») redevient utile
    expect(container.querySelector('details.watch-trouble')).not.toBeNull()
  })

  it('page Sources hors mode diagnostic : montre appairée, aucun outil technique', () => {
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify(connected))
    const { container } = render(<WatchConnect connect={vi.fn()} troubleshooting={false} />)
    expect(container.querySelector('details.watch-trouble')).toBeNull()
  })

  it('téléchargement impossible → texte collé accepté ; texte invalide refusé', async () => {
    render(<WatchConnect connect={vi.fn()} fetchSecrets={async () => { throw new Error('hors ligne') }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger les paramètres' }))
    expect(await screen.findByText(/hors ligne/)).toBeTruthy()
    const area = screen.getByLabelText('Constantes Huawei v1, v2, v3')
    fireEvent.change(area, { target: { value: 'v1: 00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce texte' }))
    expect(await screen.findByText(/Texte non reconnu/)).toBeTruthy()
    fireEvent.change(area, { target: { value: `v1: ${hex16(1)}\nv2: ${hex16(2)}\nv3: ${hex16(3)}` } })
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce texte' }))
    await waitFor(() => expect(localStorage.getItem('healthtrack_huawei_secrets')).toBeTruthy())
  })

  it('clé refusée → conseils sans « dissocier » et bouton « Refaire l’appairage » (rebind)', async () => {
    localStorage.setItem('healthtrack_huawei_secrets', JSON.stringify({ v1: 'a', v2: 'b', v3: 'c' }))
    const rejected = { ...connected, outcome: { code: 'key_rejected', title: `La montre ne reconnaît plus la clé de ${APP_NAME}` } }
    const connect = vi.fn(async () => rejected)
    render(<WatchConnect connect={connect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    expect(await screen.findByText(/ne reconnaît plus/)).toBeTruthy()
    expect(screen.queryByText(/dissocier/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Refaire l’appairage' }))
    await waitFor(() => expect(connect.mock.calls[1][0].rebind).toBe(true))
  })

  it('affiche l’état de la montre et le met à jour quand une synchro se termine', async () => {
    render(<WatchConnect connect={vi.fn()} />)
    expect(screen.queryByText('Connectée')).toBeNull()
    const at = new Date().toISOString()
    localStorage.setItem('healthtrack_watch_autosync', JSON.stringify({ at, auto: true, outcome: 'connected', inserted: 9, battery: 84, failures: 0, everConnected: true }))
    window.dispatchEvent(new CustomEvent('watch-sync-updated'))
    expect(await screen.findByText('Connectée')).toBeTruthy()
    expect(screen.getByText(/batterie 84 % · synchro .* · 9 nouvelles mesures/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Synchroniser la montre' })).toBeTruthy()
  })

  it('données restaurées sur un nouveau téléphone : « À reconnecter » et bouton « Reconnecter ma montre »', () => {
    localStorage.setItem('healthtrack_watch_autosync', JSON.stringify({ at: new Date().toISOString(), outcome: 'restored', everConnected: true }))
    render(<WatchConnect connect={vi.fn()} troubleshooting={false} />)
    expect(screen.getByText('À reconnecter')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reconnecter ma montre' })).toBeTruthy()
    expect(screen.queryByText('Diagnostic')).toBeNull()
  })

  it('remonte le rapport final à la carte (journal commun)', async () => {
    localStorage.setItem('healthtrack_huawei_secrets', JSON.stringify({ v1: 'a', v2: 'b', v3: 'c' }))
    const onReport = vi.fn()
    render(<WatchConnect connect={async () => connected} onReport={onReport} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connecter ma montre' }))
    await waitFor(() => expect(onReport).toHaveBeenCalledWith(connected))
    expect(screen.queryByRole('button', { name: 'Enregistrer le journal' })).toBeNull()
  })

  it('association côté montre : demande ce que montre la montre, garde la réponse pour le journal', async () => {
    const report = { ...connected, association: { sentSetupStatus: true, accepted: 9, refused: 0, steps: [], freshData: false, userSaw: null } }
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify(report))
    const onReport = vi.fn()
    render(<WatchConnect connect={vi.fn()} onReport={onReport} />)
    expect(screen.getByText('Fin d’association envoyée à la montre')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Encore « Association »' }))
    expect(await screen.findByText('La montre affiche encore son écran d’association')).toBeTruthy()
    expect(screen.getByText(/réinitialisez-la/)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('healthtrack_watch_connect_last')).association.userSaw).toBe('pairing_screen')
    expect(onReport.mock.calls[0][0].association.userSaw).toBe('pairing_screen')
  })

  it('mesures fraîches reçues : association confirmée, sans question', () => {
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify({ ...connected, association: { freshData: true, userSaw: null } }))
    render(<WatchConnect connect={vi.fn()} />)
    // plus de bandeau redondant une fois l'association confirmée
    expect(screen.queryByText(`La montre se considère associée à ${APP_NAME}`)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Son cadran' })).toBeNull()
  })

  it('ancienne connexion sans fin d’association : invite à resynchroniser', () => {
    localStorage.setItem('healthtrack_watch_connect_last', JSON.stringify(connected))
    render(<WatchConnect connect={vi.fn()} />)
    expect(screen.getByText(/termine l’association côté montre/)).toBeTruthy()
  })
})
