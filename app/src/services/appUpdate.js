/**
 * Mise à jour en un clic, avec visibilité (signalement du propriétaire du 20/10 19:05 : « ça reste bloqué sur
 * Téléchargement en cours »). Le téléchargement est confié au DownloadManager d'Android (plugin natif
 * `AppUpdate`, AppUpdatePlugin.java) : il continue app en arrière-plan avec sa notification de progression et
 * reprend après une coupure réseau. Ici : lecture de l'avancement (Mo reçus / Mo totaux, débit, temps restant),
 * détection d'un téléchargement qui ne progresse plus, messages d'échec exacts, et les étapes
 * téléchargement → vérification → ouverture de l'installateur.
 */

export const REPO_RELEASES_URL = 'https://github.com/spreadzenox/HealthTrack/releases/latest'

/** Sans octet reçu pendant ce délai, le téléchargement est signalé comme bloqué (il n'est pas annulé). */
export const STALL_MS = 45_000
export const POLL_MS = 800
const SPEED_WINDOW_MS = 6_000

/** L'APK de la release : adresse directe, taille et empreinte (« sha256:… ») publiées par GitHub. */
export function getApkAsset(release) {
  const apk = release?.assets?.find((a) => a?.name?.toLowerCase().endsWith('.apk'))
  if (!apk?.browser_download_url) return null
  return {
    url: apk.browser_download_url,
    name: apk.name,
    size: Number(apk.size) > 0 ? Number(apk.size) : null,
    digest: typeof apk.digest === 'string' ? apk.digest : null,
  }
}

const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatMo(bytes) {
  if (!(bytes >= 0)) return '?'
  return `${nf1.format(bytes / 1_000_000)}\u00a0Mo`
}

export function formatDuration(seconds) {
  if (!(seconds >= 0) || !Number.isFinite(seconds)) return null
  const s = Math.max(1, Math.round(seconds))
  // Espaces insécables : « 14 s » ne se coupe pas en fin de ligne.
  if (s < 60) return `${s}\u00a0s`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m < 60) return r ? `${m}\u00a0min\u00a0${String(r).padStart(2, '0')}\u00a0s` : `${m}\u00a0min`
  return `${Math.floor(m / 60)}\u00a0h\u00a0${String(m % 60).padStart(2, '0')}`
}

/**
 * Débit (octets/s) sur les dernières secondes et temps restant estimé.
 * @param {Array<{t:number, bytes:number}>} samples échantillons croissants dans le temps
 */
export function estimateSpeed(samples, total) {
  if (!samples?.length) return { speed: null, eta: null }
  const last = samples[samples.length - 1]
  const recent = samples.filter((s) => last.t - s.t <= SPEED_WINDOW_MS)
  const first = recent[0]
  const dt = (last.t - first.t) / 1000
  if (dt < 1.5) return { speed: null, eta: null }
  const speed = Math.max(0, (last.bytes - first.bytes) / dt)
  const eta = speed > 0 && total > 0 ? Math.max(0, (total - last.bytes) / speed) : null
  return { speed, eta }
}

// Codes de android.app.DownloadManager (COLUMN_REASON).
const PAUSED_REASONS = {
  1: 'Petite coupure réseau : nouvel essai automatique…',
  2: 'En attente de réseau : le téléchargement reprendra tout seul dès que la connexion revient.',
  3: 'En attente du Wi-Fi (fichier volumineux pour les données mobiles).',
  4: 'En pause.',
}
const FAILED_REASONS = {
  1000: 'Erreur inconnue du gestionnaire de téléchargements.',
  1001: "Impossible d'écrire le fichier sur le téléphone.",
  1002: 'Réponse inattendue du serveur GitHub.',
  1004: 'La connexion a été coupée pendant le transfert.',
  1005: 'Trop de redirections depuis GitHub.',
  1006: 'Espace de stockage insuffisant sur le téléphone.',
  1007: 'Stockage du téléphone indisponible.',
  1008: 'Le téléchargement ne peut pas reprendre là où il s’était arrêté.',
  1009: 'Un ancien fichier de mise à jour gêne le téléchargement.',
}

export function describePaused(reason) {
  return PAUSED_REASONS[reason] || PAUSED_REASONS[4]
}

export function describeFailure(reason) {
  if (reason >= 400 && reason < 600) return `Le serveur GitHub a répondu « erreur ${reason} ».`
  return FAILED_REASONS[reason] || `Le téléchargement a échoué (code ${reason ?? 'inconnu'}).`
}

const INSTALL_ERRORS = {
  missing: 'Le fichier téléchargé est introuvable (nettoyé par le téléphone ?).',
  empty: 'Le fichier téléchargé est vide.',
  size_mismatch: "Le fichier téléchargé est incomplet (taille différente de celle annoncée).",
  sha_mismatch: "Le fichier téléchargé est abîmé (empreinte différente de celle de la release).",
  not_apk: "Le fichier téléchargé n'est pas une application Android lisible.",
  wrong_package: "Le fichier téléchargé n'est pas HealthTrack.",
  older: 'Cette version est plus ancienne que celle installée.',
  no_permission: "HealthTrack n'a pas encore le droit d'installer des applications.",
}

export function describeInstallError(result) {
  const base = INSTALL_ERRORS[result?.error] || "L'installateur n'a pas pu être ouvert."
  return result?.error === 'exception' && result?.detail ? `${base} (${result.detail})` : base
}

/** Texte de progression : « 12,3 Mo / 33,6 Mo · 37 % » (+ débit, temps restant). */
export function progressLabel({ downloaded, total, speed, eta }) {
  const parts = []
  const pct = total > 0 ? Math.min(100, Math.floor((downloaded / total) * 100)) : null
  parts.push(total > 0 ? `${formatMo(downloaded)} / ${formatMo(total)}` : formatMo(downloaded))
  if (pct != null) parts.push(`${pct} %`)
  if (speed != null) parts.push(`${formatMo(speed)}/s`)
  const left = formatDuration(eta)
  if (left && pct !== 100) parts.push(`encore\u00a0≈\u00a0${left}`)
  return { percent: pct, text: parts.join(' · ') }
}

/** Le plugin natif, s'il existe (app Android). En dev, `window.__HT_APP_UPDATE__` permet les captures. */
export async function loadAppUpdatePlugin() {
  if (import.meta.env?.DEV && typeof window !== 'undefined' && window.__HT_APP_UPDATE__) {
    return window.__HT_APP_UPDATE__
  }
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (!Capacitor?.isNativePlatform?.() || Capacitor.getPlatform?.() !== 'android') return null
    if (Capacitor.isPluginAvailable && !Capacitor.isPluginAvailable('AppUpdate')) return null
    return registerPlugin('AppUpdate')
  } catch {
    return null
  }
}

/** Ouvre une adresse dans le navigateur du téléphone (secours : téléchargement manuel). */
export async function openInBrowser(url) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor?.isNativePlatform?.()) {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      await AppLauncher.openUrl({ url })
      return
    }
  } catch {
    /* repli ci-dessous */
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Pilote une mise à jour : permission → téléchargement → vérification → installateur.
 * `onChange(state)` reçoit { step, downloaded, total, speed, eta, notice, stalled, error }.
 * step : idle | permission | download | verify | installer | error.
 */
export function createUpdateRunner({
  plugin,
  asset,
  version,
  onChange,
  now = () => Date.now(),
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  pollMs = POLL_MS,
  stallMs = STALL_MS,
}) {
  let state = { step: 'idle', downloaded: 0, total: asset?.size || 0 }
  let timer = null
  let samples = []
  let lastProgressAt = 0
  let disposed = false

  const emit = (patch) => {
    state = { ...state, ...patch }
    if (!disposed) onChange?.(state)
  }
  const stop = () => {
    if (timer != null) clearTimer(timer)
    timer = null
  }
  const schedule = () => {
    stop()
    if (!disposed) timer = setTimer(poll, pollMs)
  }
  const fail = (error) => {
    stop()
    emit({ step: 'error', error, stalled: false, notice: null })
  }

  async function verifyAndInstall() {
    stop()
    emit({ step: 'verify', notice: null, stalled: false, speed: null, eta: null })
    let res
    try {
      res = await plugin.install()
    } catch (e) {
      return fail(`L'installateur n'a pas pu être ouvert : ${e?.message || e}`)
    }
    if (res?.ok) return emit({ step: 'installer' })
    if (res?.error === 'no_permission') {
      await plugin.openInstallSettings?.().catch(() => {})
      return emit({
        step: 'permission',
        error: null,
        notice: "Autorisez « Installer des applis inconnues » pour HealthTrack, revenez ici puis touchez « Installer ».",
      })
    }
    return fail(describeInstallError(res))
  }

  async function poll() {
    timer = null
    if (disposed) return
    let st
    try {
      st = await plugin.status()
    } catch (e) {
      return fail(`Avancement illisible : ${e?.message || e}`)
    }
    if (disposed) return
    const t = now()
    const total = st?.total > 0 ? st.total : state.total
    const downloaded = Math.max(0, st?.downloaded || 0)
    switch (st?.state) {
      case 'successful':
        emit({ downloaded: total || downloaded, total })
        return verifyAndInstall()
      case 'failed':
        return fail(describeFailure(st.reason))
      case 'none':
        return fail('Le téléchargement a été annulé (depuis la notification ?).')
      default: {
        if (downloaded > (samples.at(-1)?.bytes ?? -1)) lastProgressAt = t
        samples = [...samples.filter((s) => t - s.t <= 10_000), { t, bytes: downloaded }]
        const { speed, eta } = estimateSpeed(samples, total)
        const stalled = t - lastProgressAt >= stallMs
        emit({
          step: 'download',
          downloaded,
          total,
          speed: stalled ? 0 : speed,
          eta: stalled ? null : eta,
          stalled,
          notice: st?.state === 'paused' ? describePaused(st.reason) : null,
          error: null,
        })
        schedule()
      }
    }
  }

  function track() {
    samples = []
    lastProgressAt = now()
    emit({ step: 'download', downloaded: 0, stalled: false, error: null, notice: null, speed: null, eta: null })
    poll()
  }

  return {
    get state() {
      return state
    },
    /** Lance (ou relance depuis zéro) le téléchargement. */
    async start() {
      stop()
      emit({ step: 'permission', error: null, notice: null })
      try {
        const { granted } = (await plugin.canInstall()) || {}
        if (!granted) {
          await plugin.openInstallSettings().catch(() => {})
          return emit({
            notice:
              "Autorisez « Installer des applis inconnues » pour HealthTrack dans l'écran qui vient de s'ouvrir, puis revenez et touchez « Continuer ».",
          })
        }
        await plugin.start({ url: asset.url, version: String(version), size: asset.size || -1, digest: asset.digest })
      } catch (e) {
        return fail(`Le téléchargement n'a pas pu démarrer : ${e?.message || e}`)
      }
      track()
    },
    /** Reprend le suivi d'un téléchargement déjà lancé pour cette version (app rouverte, retour d'arrière-plan). */
    async attach() {
      if (timer != null || state.step === 'verify') return false
      let st
      try {
        st = await plugin.status()
      } catch {
        return false
      }
      if (!st || st.state === 'none' || st.version !== String(version)) return false
      if (st.state === 'failed') {
        fail(describeFailure(st.reason))
        return true
      }
      if (st.state === 'successful' && state.step === 'installer') return true
      track()
      return true
    },
    /** Après l'écran d'autorisation : reprendre là où on en était. */
    async install() {
      return verifyAndInstall()
    },
    async cancel() {
      stop()
      await plugin.cancel().catch(() => {})
      samples = []
      emit({ step: 'idle', downloaded: 0, stalled: false, error: null, notice: null, speed: null, eta: null })
    },
    dispose() {
      disposed = true
      stop()
    },
  }
}
