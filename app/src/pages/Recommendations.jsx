/**
 * Onglet Analyses (ORG-4 et ORG-6, revue design du 07/11 ; leçon 14 : Analyses = comprendre les liens statistiques).
 * Deux sous-onglets de même structure, Bien-être et Digestion, sur le contrat de la méthode (services/analysisResults.js,
 * calculé dans le worker) :
 * - avant les résultats, un seul compte à rebours avec la phrase du propriétaire, « Noter maintenant » et « Recevoir
 *   un rappel » ;
 * - ensuite « Pistes à tester » (« Essayer dans Agir »), « Ce qui pèse sur votre … » par horizon (Court / Moyen / Long
 *   terme, barres de part et d'autre de zéro en points sur 5 pour une variation habituelle, fourchette, couleur du
 *   thème, hachurées si pas assez net) et, à part, « À regarder, pas à changer » ;
 * - « Comment c'est calculé » en lien discret en bas.
 * Retirés : l'historique, « Sur quelques semaines », « Autres liens repérés », « Bientôt » et l'analyse « dans les
 * heures ». Des liens statistiques, jamais une cause ni un diagnostic.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AnalysesTabs from '../components/AnalysesTabs'
import DoctorReportCard from '../components/DoctorReportCard'
import WellbeingPrompt from '../components/WellbeingPrompt'
import GutEveningReminder from '../components/GutEveningReminder'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { PISTES_SUMMARY_KEY } from '../services/pistesSummary'
import { THEME_TONE, pistesTitles, resultsView } from '../services/resultsView'
import { eveningNotePlugin } from '../services/eveningNote'
import { APP_NAME } from '../config/brand'
import { FEATURES } from '../config/distribution'
import { useEntitlement } from '../hooks/useEntitlement'
import { gutCardMode } from '../settings/onboarding'
import { appLocale } from '../i18n/locale.js'
import { keepWhole } from '../utils/keepWhole'
import './Recommendations.css'

const WORDS = {
  wellbeing: { what: 'votre bien-être', note: 'votre bien-être', weigh: 'Ce qui pèse sur votre bien-être' },
  digestion: { what: 'votre confort digestif', note: 'votre digestion', weigh: 'Ce qui pèse sur votre confort digestif' },
}

const pts = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

/** Mémorise les titres des pistes pour l'Accueil et Agir (sans recalcul de leur côté). */
function rememberTitles(results) {
  try {
    localStorage.setItem(PISTES_SUMMARY_KEY, JSON.stringify({ ...pistesTitles(results), at: new Date().toISOString() }))
  } catch {
    /* stockage indisponible */
  }
}

function Countdown({ outcome, view, onNote, onReminder }) {
  const w = WORDS[outcome]
  const n = view.daysLeft
  const title = n != null && n > 0
    ? `Vos premiers résultats arrivent dans ${n} jour${n > 1 ? 's' : ''}`
    : 'Vos premiers résultats arrivent bientôt'
  return (
    <section className="today-card reco-countdown" data-testid={`reco-countdown-${outcome}`} aria-labelledby={`reco-cd-${outcome}`}>
      <h3 id={`reco-cd-${outcome}`} className="today-card-title">{keepWhole(title)}</h3>
      <p className="today-card-text">
        Notez {w.note} chaque jour : {APP_NAME} cherchera ensuite quels facteurs sont statistiquement liés à {w.what}.
      </p>
      {view.progress && (
        <>
          <div className="pistes-progress" role="progressbar" aria-valuemin={0} aria-valuemax={view.progress.need}
            aria-valuenow={view.progress.have} aria-label="Jours notés">
            <div className="pistes-progress-bar" style={{ width: `${(view.progress.have / view.progress.need) * 100}%` }} />
          </div>
          <p className="pistes-count"><span className="mono">{view.progress.have}/{view.progress.need}</span> jours</p>
        </>
      )}
      {outcome === 'digestion' && view.symptomsLeft > 0 && (
        <p className="today-card-text">
          Il faut aussi <span className="mono">{view.symptomsLeft}</span> jour{view.symptomsLeft > 1 ? 's' : ''} de plus avec une gêne ou une douleur notée.
        </p>
      )}
      <button type="button" className="reco-cta" onClick={onNote}>Noter maintenant</button>
      {outcome === 'wellbeing'
        ? onReminder && <button type="button" className="reco-cta is-secondary" onClick={onReminder}>Recevoir un rappel</button>
        : <GutEveningReminder />}
    </section>
  )
}

/** Barre de part et d'autre de zéro, avec sa fourchette ; hachurée si le lien n'est pas assez net. */
function EffectBar({ f, max }) {
  const pos = (v) => `${50 + (v / max) * 50}%`
  const left = Math.min(0, f.effect)
  const right = Math.max(0, f.effect)
  return (
    <li className={`reco-effect${f.net ? '' : ' is-unsure'}`} data-tone={THEME_TONE[f.theme] ?? 'stone'}>
      <span className="reco-effect-label">
        {f.label}
        <span className="reco-effect-for">pour {f.usualChange?.text}</span>
      </span>
      <span className="reco-effect-track" aria-hidden="true">
        <span className="reco-effect-zero" />
        <span className="reco-effect-range" style={{ left: pos(Math.max(-max, f.low)), right: `calc(100% - ${pos(Math.min(max, f.high))})` }} />
        <span className="reco-effect-bar" style={{ left: pos(left), right: `calc(100% - ${pos(right)})` }} />
      </span>
      <span className="reco-effect-value mono" aria-label={`${pts(f.effect)} point sur 5${f.net ? '' : ', pas assez net'}`}>{pts(f.effect)}</span>
    </li>
  )
}

function EffectList({ factors }) {
  const max = Math.max(0.3, ...factors.map((f) => Math.max(Math.abs(f.low), Math.abs(f.high), Math.abs(f.effect))))
  return <ul className="reco-effects">{factors.map((f) => <EffectBar key={`${f.key}-${f.horizon}`} f={f} max={max} />)}</ul>
}

function Results({ outcome, view, locked }) {
  const w = WORDS[outcome]
  return (
    <>
      <section className="reco-block" aria-labelledby={`reco-pistes-${outcome}`}>
        <h3 id={`reco-pistes-${outcome}`} className="reco-section-title">Pistes à tester</h3>
        {view.pistes.length ? (
          <ul className="reco-pistes">
            {view.pistes.map((f) => (
              <li key={f.key} className="today-card reco-piste" data-tone={THEME_TONE[f.theme] ?? 'stone'}>
                <span className={`reco-piste-title${locked ? ' is-locked' : ''}`}>
                  {locked ? <span className="pistes-first-blur" aria-hidden="true" /> : f.label}
                </span>
                {!locked && (
                  <span className="reco-piste-text">
                    <span className="mono">{pts(f.effect)}</span> point sur 5 pour {f.usualChange?.text} ({f.horizonLabel.toLowerCase()})
                  </span>
                )}
                {locked
                  ? <Link to="/premium" className="reco-piste-try">Débloquer</Link>
                  : <Link to="/agir" className="reco-piste-try">Essayer dans Agir</Link>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="today-card-text">Aucun lien assez net pour l’instant sur ce que vous pouvez changer.</p>
        )}
      </section>
      {!locked && view.weigh && view.weigh.length > 0 && (
        <section className="reco-block" aria-labelledby={`reco-weigh-${outcome}`}>
          <h3 id={`reco-weigh-${outcome}`} className="reco-section-title">{w.weigh}</h3>
          {view.weigh.map((h) => (
            <div key={h.id} className="reco-horizon">
              <p className="reco-horizon-title">{h.label} <span className="reco-horizon-window">{h.window}</span></p>
              <EffectList factors={h.factors} />
            </div>
          ))}
          <p className="reco-legend"><span className="reco-legend-unsure" aria-hidden="true" /> hachuré : pas assez net</p>
        </section>
      )}
      {!locked && view.lookOnly.length > 0 && (
        <section className="reco-block" aria-labelledby={`reco-look-${outcome}`}>
          <h3 id={`reco-look-${outcome}`} className="reco-section-title">À regarder, pas à changer</h3>
          <EffectList factors={view.lookOnly} />
        </section>
      )}
      {view.nextLock && (
        <p className="reco-next">
          {view.nextLock.label} : dans <span className="mono">{view.nextLock.daysLeft}</span> jour{view.nextLock.daysLeft > 1 ? 's' : ''} de notes.
        </p>
      )}
    </>
  )
}

function HowItWorks() {
  const [open, setOpen] = useState(false)
  return (
    <div className="reco-how">
      <button type="button" className="reco-how-link" aria-expanded={open} onClick={() => setOpen(!open)}>
        Comment c’est calculé
      </button>
      {open && (
        <p className="reco-how-text">
          Une ligne par jour. Chaque facteur est regardé sur trois fenêtres avant le jour mesuré : le jour même et la
          veille, de 2 à 6 jours avant, de 7 à 27 jours avant. Un modèle régularisé tient compte du jour de la semaine,
          des jours malades ou en voyage et de la tendance. Un lien n’est dit net que s’il tient quand on retire des
          semaines entières, et les effets ne sont montrés que si le modèle prévoit mieux que « demain comme
          aujourd’hui ». Tout est calculé sur le téléphone.
        </p>
      )}
    </div>
  )
}

export default function Recommendations({ view = 'wellbeing', read = () => getAnalysis('analysisResults') }) {
  const outcome = view === 'gut' ? 'digestion' : 'wellbeing'
  const [results, setResults] = useState(() => peekAnalysis('analysisResults').result ?? null)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const [noteOpen, setNoteOpen] = useState(false)
  const [ent] = useEntitlement()
  const navigate = useNavigate()
  const [showGut] = useState(() => gutCardMode() !== 'hide')

  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])
  useEffect(() => {
    let alive = true
    read()
      .then((r) => {
        if (!alive) return
        setResults(r)
        if (r) rememberTitles(r)
      })
      .catch((e) => alive && setError(e?.message || 'Calcul impossible'))
    return () => {
      alive = false
    }
  }, [read, revision])

  const v = results ? resultsView(results.outcomes?.[outcome]) : { state: 'loading' }
  // Version Play sans abonnement (hors période de lancement) : les pistes restent floues, comme avant
  const locked = FEATURES.billing && !ent.premium
  const onNote = outcome === 'wellbeing' ? () => setNoteOpen(true) : () => navigate('/', { state: { open: 'digestion' } })
  const onReminder = outcome === 'wellbeing' && eveningNotePlugin() ? () => setNoteOpen('reminder') : null

  return (
    <section className="reco-page" data-tone={outcome === 'digestion' ? 'peach' : 'mint'}>
      <AnalysesTabs />
      <h2 className="page-title">{outcome === 'digestion' ? 'Votre confort digestif' : 'Votre bien-être'}</h2>
      {outcome === 'digestion' && !showGut && (
        <p className="reco-intro" data-testid="gut-off">
          Le suivi digestif est masqué. Pour le retrouver : Paramètres → <Link to="/settings">Ce qui vous amène</Link>.
        </p>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}
      {v.state === 'loading' && !error && (
        <div className="loading"><div className="spinner" aria-hidden /><p>Calcul des analyses…</p></div>
      )}
      {v.state === 'locked' && <Countdown outcome={outcome} view={v} onNote={onNote} onReminder={onReminder} />}
      {v.state === 'results' && <Results outcome={outcome} view={v} locked={locked} />}
      {outcome === 'digestion' && v.state === 'results' && <DoctorReportCard />}
      <HowItWorks />
      <WellbeingPrompt open={!!noteOpen} initialMode={noteOpen === 'reminder' ? 'reminder' : 'now'} onClose={() => setNoteOpen(false)} />
    </section>
  )
}
