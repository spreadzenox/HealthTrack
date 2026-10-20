/**
 * Sonde vocale (journal/IDEES.md I124) : la dictée du soir (I117) ne doit faire passer le son de la voix que par une
 * reconnaissance **sur le téléphone**. Avant de l'écrire, le diagnostic de la Lecture du visage dit ce que le
 * téléphone sait faire (natif : VoiceProbePlugin.java) : reconnaissance disponible, sur l'appareil ou en ligne
 * seulement, français installé / en cours / téléchargeable, moteur par défaut. Aucun micro n'est ouvert, aucune
 * permission demandée, aucun son ni aucune humeur dans le résultat.
 */
import { registerPlugin } from '@capacitor/core'

const NativeVoiceProbe = registerPlugin('VoiceProbe')
const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des captures / tests, sinon aucun. */
export function voiceProbePlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeVoiceProbe) return window.__healthtrackFakeVoiceProbe
  return isNative() ? NativeVoiceProbe : null
}

/** Résultat brut de la sonde, ou null hors de l'app Android. Ne lève jamais. */
export async function probeVoice(plugin = voiceProbePlugin()) {
  if (!plugin?.probe) return null
  try {
    return await plugin.probe()
  } catch {
    return null
  }
}

const isFrench = (tag) => /^fr([-_]|$)/i.test(String(tag || ''))
const hasFrench = (list) => Array.isArray(list) && list.some(isFrench)

/**
 * on_device_fr | on_device_fr_pending | on_device_fr_downloadable | on_device_no_fr | on_device_unknown_language
 * | online_only | none, ou null sans sonde. Seules les langues « sur l'appareil » comptent : une reconnaissance en
 * ligne enverrait le son hors du téléphone.
 */
export function voiceVerdict(p) {
  if (!p) return null
  const s = p.support
  if (s) {
    if (hasFrench(s.installed)) return 'on_device_fr'
    if (hasFrench(s.pending)) return 'on_device_fr_pending'
    if (hasFrench(s.supported)) return 'on_device_fr_downloadable'
    if (p.onDevice) return 'on_device_no_fr'
  }
  if (p.onDevice) return 'on_device_unknown_language'
  if (p.available) return 'online_only'
  return 'none'
}

const list = (v) => (Array.isArray(v) ? v.map(String) : null)

/** Bloc `voice` du diagnostic exportable : des faits sur le téléphone, jamais un son. */
export function voiceProbeDiagnostic(p) {
  if (!p) return null
  return {
    verdict: voiceVerdict(p),
    language: p.language ?? null,
    available: p.available ?? null,
    onDevice: p.onDevice ?? null,
    defaultService: p.defaultService ?? null,
    services: list(p.services),
    supportFrom: p.supportFrom ?? null,
    installed: list(p.support?.installed),
    pending: list(p.support?.pending),
    downloadable: list(p.support?.supported),
    online: list(p.support?.online),
    supportError: p.supportError ?? null,
    supportTimeout: p.supportTimeout === true,
    errors: list(p.errors) || [],
  }
}

const VERDICTS = {
  on_device_fr: 'reconnaissance en français sur le téléphone, installée',
  on_device_fr_pending: 'reconnaissance en français sur le téléphone, en cours de téléchargement',
  on_device_fr_downloadable: 'reconnaissance sur le téléphone, français téléchargeable (pas encore installé)',
  on_device_no_fr: 'reconnaissance sur le téléphone, mais pas en français',
  on_device_unknown_language: 'reconnaissance sur le téléphone (langues non dites avant Android 13)',
  online_only: 'seulement une reconnaissance en ligne (le son partirait du téléphone : pas utilisée)',
  none: 'aucune reconnaissance vocale sur ce téléphone',
}

const ENGINES = {
  'com.google.android.as': 'Android System Intelligence',
  'com.google.android.googlequicksearchbox': 'Google',
  'com.google.android.tts': 'Google (synthèse vocale)',
  'com.samsung.android.bixby.agent': 'Bixby',
  'com.samsung.android.svoiceime': 'Clavier vocal Samsung',
}
const engine = (pkg) => ENGINES[pkg] || pkg

/** Ligne lisible du diagnostic (carte). */
export function voiceProbeLine(p) {
  const d = voiceProbeDiagnostic(p)
  if (!d) return null
  const parts = [`Voix (sonde, aucun micro ouvert) : ${VERDICTS[d.verdict]}`]
  if (d.defaultService) parts.push(`moteur par défaut : ${engine(d.defaultService)}`)
  if (d.services?.length) parts.push(`moteurs : ${d.services.map(engine).join(', ')}`)
  return parts.join(' · ')
}
