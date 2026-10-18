/**
 * « Libérer et appairer la montre » (dépannage de la carte « Montre Huawei », chantier D3 étape b) :
 * l'app qui tient la montre (boîte de désinstallation ou réglages Android), la réinitialisation
 * guidée depuis la montre, l'appairage Android, puis le test. Plan B : garder Huawei Santé avec
 * l'identifiant de compte Huawei. Chaque geste est confirmé par l'utilisateur ; rien n'est envoyé
 * à la montre ici. Logique dans src/devices/huawei/setup.js.
 */
import { useCallback, useEffect, useState } from 'react'
import { getWatchAutoSyncState } from '../services/watchAutoSync'
import { formatAgo } from '../utils/timeAgo'
import {
  setupPlan,
  lastConnectedAt,
  loadSetup,
  saveSetup,
  observeBond,
  pairWatch,
  isWatchBonded,
  normalizeAccountId,
  RESET_STEPS,
  RESET_WARNINGS,
  KEEP_STEPS,
} from '../devices/huawei/setup'

const STEP_LABELS = {
  release: 'Libérer la montre de l’app qui la tient',
  reset: 'Réinitialiser la montre',
  pair: 'Appairer la montre à ce téléphone',
  test: 'Vérifier que la montre répond',
  account: 'Identifiant de compte Huawei',
}

const ICONS = { done: '✓', current: '→', todo: '·', skip: '–' }

const PAIR_MESSAGES = {
  bonded: (n) => `${n} est appairée à ce téléphone.`,
  already: (n) => `${n} est déjà appairée à ce téléphone.`,
  not_found: () => 'Aucune montre Huawei visible. Gardez-la sur son écran d’appairage, près du téléphone, puis réessayez.',
  refused: () => 'Appairage refusé ou expiré. Réessayez et acceptez la demande d’Android (et sur la montre si elle la montre).',
  unavailable: () => 'Appairage indisponible ici : utilisez les réglages Bluetooth d’Android.',
}

/**
 * @param {{ detectApps: Function, classic: object|null, appManager: object|null, verdict: string|null, onRunTest?: Function, now?: Function }} props
 */
const isoNow = () => new Date().toISOString()

export default function WatchSetup({ detectApps, classic, appManager, verdict, onRunTest, now = isoNow, autoState: autoStateProp }) {
  const [autoState, setAutoState] = useState(() => autoStateProp ?? getWatchAutoSyncState())
  const [installed, setInstalled] = useState(null)
  const [bonded, setBonded] = useState(null)
  const [state, setState] = useState(loadSetup)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [accountInput, setAccountInput] = useState('')

  const update = useCallback((next) => {
    setState(next)
    saveSetup(next)
  }, [])

  // Apps et appairage lus séparément : une détection d'apps qui traîne ne fige plus l'état d'appairage (18/10)
  const refresh = useCallback(async () => {
    if (autoStateProp === undefined) setAutoState(getWatchAutoSyncState())
    detectApps()
      .catch(() => null)
      .then((apps) => setInstalled(apps ?? null))
    const isBonded = await isWatchBonded(classic)
    setBonded(isBonded)
    setState((prev) => {
      const next = observeBond(prev, isBonded, now())
      if (next !== prev) saveSetup(next)
      return next
    })
  }, [detectApps, classic, now, autoStateProp])

  useEffect(() => {
    if (autoStateProp !== undefined) return undefined
    const onSync = () => setAutoState(getWatchAutoSyncState())
    window.addEventListener('watch-sync-updated', onSync)
    return () => window.removeEventListener('watch-sync-updated', onSync)
  }, [autoStateProp])

  useEffect(() => {
    refresh()
    // Retour depuis la boîte de désinstallation / les réglages Android : on regarde de nouveau.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const connectedAt = lastConnectedAt(autoStateProp ?? autoState)
  const plan = setupPlan({ installed, bonded, verdict, state, connectedAt })
  const anyHolder = plan.holders.some((a) => a.id !== 'gadgetbridge')

  const act = async (fn) => {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
    } catch (e) {
      setMessage(`Impossible : ${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  const pair = () =>
    act(async () => {
      const res = await pairWatch(classic, { onProgress: (s, name) => setMessage(s === 'search' ? 'Recherche de la montre (≈ 12 s)…' : `Demande d’appairage à ${name} : acceptez la boîte d’Android.`) })
      setMessage(PAIR_MESSAGES[res.status](res.name || 'La montre'))
      if (res.status === 'bonded' || res.status === 'already') {
        setBonded(true)
        update({ ...state, pairedAt: now() })
      }
    })

  const renderCurrent = (id) => {
    if (id === 'release') {
      return (
        <>
          <p className="watch-setup-text">
            Une montre Huawei n’accepte qu’une app à la fois. Désinstallez l’app qui la tient (Android vous demande de confirmer), ou
            retirez-lui le Bluetooth : Réglages de l’app → Autorisations → Appareils à proximité → Ne pas autoriser.
          </p>
          {plan.holders.map((app) => (
            <div key={app.id} className="my-device-actions">
              <button type="button" className="btn btn-primary connector-btn" disabled={busy || !appManager} onClick={() => act(() => appManager.uninstall({ package: app.package }))}>
                Désinstaller {app.name}
              </button>
              <button type="button" className="btn btn-secondary connector-btn" disabled={busy || !appManager} onClick={() => act(() => appManager.openSettings({ package: app.package }))}>
                Réglages de {app.name}
              </button>
            </div>
          ))}
          <p className="my-device-meta">Vos données déjà dans Huawei Santé ou Health Connect restent là où elles sont.</p>
        </>
      )
    }
    if (id === 'reset') {
      return (
        <>
          <p className="watch-setup-text">La montre garde la clé de l’ancienne app : seule une réinitialisation, faite sur la montre, la libère.</p>
          <ol className="watch-setup-guide">
            {RESET_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <ul className="watch-setup-warnings">
            {RESET_WARNINGS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary connector-btn" disabled={busy} onClick={() => update({ ...state, resetAt: now(), pairedAt: null, unbondedSinceReset: bonded === false })}>
            C’est fait : la montre affiche l’écran d’appairage
          </button>
          {plan.holders.length === 0 && (
            <button type="button" className="btn btn-secondary connector-btn" disabled={busy} onClick={() => update({ ...state, neverLinked: true })}>
              Elle n’a jamais été liée à une autre app
            </button>
          )}
        </>
      )
    }
    if (id === 'pair') {
      return (
        <>
          {plan.stalePairing ? (
            <p className="watch-setup-text">
              Android se souvient de l’ancien appairage, devenu inutile. Dans les réglages Bluetooth d’Android : touchez la roue dentée à côté de la
              montre → Dissocier (dans Android uniquement), puis revenez ici.
            </p>
          ) : (
            <p className="watch-setup-text">
              Montre allumée sur son écran d’appairage, près du téléphone : HealthTrack la cherche puis Android vous demande de confirmer
              l’appairage.
            </p>
          )}
          <div className="my-device-actions">
            {!plan.stalePairing && (
              <button type="button" className="btn btn-primary connector-btn" disabled={busy || !classic} onClick={pair}>
                {busy ? 'Appairage…' : 'Appairer la montre'}
              </button>
            )}
            <button type="button" className={`btn ${plan.stalePairing ? 'btn-primary' : 'btn-secondary'} connector-btn`} disabled={busy || !classic?.openBluetoothSettings} onClick={() => act(() => classic.openBluetoothSettings())}>
              Réglages Bluetooth
            </button>
          </div>
        </>
      )
    }
    if (id === 'account') {
      return (
        <>
          <ul className="watch-setup-guide">
            {KEEP_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <form
            className="watch-setup-account"
            onSubmit={(e) => {
              e.preventDefault()
              const id = normalizeAccountId(accountInput)
              if (!id) return setMessage('Identifiant attendu : 15 à 20 chiffres.')
              update({ ...state, accountId: id })
              setAccountInput('')
              setMessage('Identifiant gardé sur ce téléphone.')
            }}
          >
            <label htmlFor="huawei-account-id">Identifiant de compte Huawei</label>
            <input id="huawei-account-id" className="settings-input" inputMode="numeric" autoComplete="off" value={accountInput} onChange={(e) => setAccountInput(e.target.value)} placeholder="ex. 12345678901234567" />
            <button type="submit" className="btn btn-primary connector-btn">
              Enregistrer
            </button>
          </form>
        </>
      )
    }
    if (id === 'test') {
      return (
        <>
          <p className="watch-setup-text">Relancez le test : la montre doit répondre à HealthTrack. Exportez ensuite le journal pour la suite (authentification).</p>
          {onRunTest && (
            <button type="button" className="btn btn-primary connector-btn" disabled={busy} onClick={onRunTest}>
              Relancer le test
            </button>
          )}
        </>
      )
    }
    return null
  }

  return (
    <div className="my-device watch-setup" aria-labelledby="watch-setup-title">
      <p id="watch-setup-title" className="watch-diag-watch">
        Libérer et appairer la montre
      </p>
      {!plan.connected && (anyHolder || state.choice === 'keep') && (
        <div className="watch-setup-choice" role="radiogroup" aria-label="Chemin choisi">
          <button type="button" role="radio" aria-checked={plan.path === 'free'} className={`watch-setup-chip ${plan.path === 'free' ? 'active' : ''}`} onClick={() => update({ ...state, choice: 'free' })}>
            HealthTrack seule (conseillé)
          </button>
          <button type="button" role="radio" aria-checked={plan.path === 'keep'} className={`watch-setup-chip ${plan.path === 'keep' ? 'active' : ''}`} onClick={() => update({ ...state, choice: 'keep' })}>
            Garder Huawei Santé
          </button>
        </div>
      )}
      <ol className="watch-diag-steps watch-setup-steps">
        {plan.steps.map((s) => (
          <li key={s.id} className={`watch-diag-step watch-setup-${s.status} ${s.status === 'done' ? 'watch-diag-ok' : ''}`}>
            <span className="watch-diag-icon" aria-hidden="true">
              {ICONS[s.status]}
            </span>
            <span className="watch-diag-label">
              {STEP_LABELS[s.id]}
              {s.status === 'skip' && <span className="watch-diag-detail"> — inutile, la montre n’est liée à aucune autre app</span>}
              {s.status === 'current' && <div className="watch-setup-body">{renderCurrent(s.id)}</div>}
            </span>
          </li>
        ))}
      </ol>
      {plan.connected ? (
        <p className="watch-setup-text">
          Rien à faire ici : la montre est appairée et HealthTrack la synchronise (dernière synchro réussie {formatAgo(connectedAt)}).
        </p>
      ) : (
        !plan.current && <p className="watch-setup-text">Montre prête : touchez « Se connecter à la montre » ci-dessus pour lire vos mesures.</p>
      )}
      {message && (
        <p className="my-device-message" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
