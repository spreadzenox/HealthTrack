/**
 * Détail d'un objectif (ORG-4 et ORG-6, revue design du 07/11 ; leçon 14 : comprendre les liens statistiques).
 * Ouvert depuis sa carte de l'onglet Objectifs (pages/Objectives.jsx, refonte « Compagnon », étape 6a), à la place
 * des deux sous-onglets. Deux écrans de même structure, Bien-être et Digestion, sur le contrat de la méthode (services/analysisResults.js,
 * calculé dans le worker) :
 * - avant les résultats, un seul compte à rebours avec la phrase du propriétaire, « Noter maintenant » et « Recevoir
 *   un rappel » ;
 * - ensuite « Pistes à tester » (« Vérifier par un essai », vers Agir), « Ce qui va avec votre … » par horizon (Court / Moyen / Long
 *   terme, barres de part et d'autre de zéro en points sur 5 pour une variation habituelle, fourchette, couleur du
 *   thème, hachurées si pas assez net) et, à part, « À regarder, pas à changer » ;
 * - « Comment c'est calculé » en lien discret en bas.
 * REFONTE-6b : en tête des résultats, « Par famille » : Sommeil, Alimentation, Activité (et Habitudes ou Écrans s'ils
 * ont un lien net), chacune avec la force de son lien le plus net en trois points et en mots
 * (services/influenceFamilies.js). Le titre de la SPEC, « Ce qui influence », n'est pas repris : ce sont des liens.
 * REFONTE-6c : une famille qui a des facteurs comparés ouvre son détail (`…/famille/:family`) : son lien net « à
 * tester », puis ses seuls facteurs, délai par délai. Sans abonnement (pistes floutées) ou sans facteur, on revient
 * au détail de l'objectif.
 * REFONTE-6e : sous Confort digestif, une ligne « Réintroduction guidée » quand un test existe ou qu'une analyse
 * digestive cite un groupe FODMAP (services/act.js) ; la page de la réintroduction revient ici.
 * Retirés : l'historique, « Sur quelques semaines », « Autres liens repérés », « Bientôt » et l'analyse « dans les
 * heures ». Des liens statistiques, jamais une cause ni un diagnostic.
 */
import PilouFigure from '../companion/life/PilouFigure'
import PilouWaiting from '../companion/life/PilouWaiting'
import Cairn from '../companion/life/Cairn'
import SeeExample from '../components/SeeExample'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import DoctorReportCard from '../components/DoctorReportCard'
import WellbeingPrompt from '../components/WellbeingPrompt'
import GutEveningReminder from '../components/GutEveningReminder'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { PISTES_SUMMARY_KEY } from '../services/pistesSummary'
import { isExampleMode } from '../storage/exampleMode'
import { THEME_TONE, isRangeOnly, pistesTitles, resultsView } from '../services/resultsView'
import { influenceFamilies, familyDetail } from '../services/influenceFamilies'
import { readGutNotes } from '../services/gutNotes'
import { actSections, reintroLine } from '../services/act'
import { FODMAP_CHALLENGE_TYPE, FODMAP_GROUPS } from '../services/fodmapChallenge'
import DetailsToggle from '../components/DetailsToggle'
import LineIcon from '../components/LineIcon'
import { listEntries } from '../storage/localHealthStorage'
import { TRIAL_TYPE, homeTrial } from '../services/trials'
import { scoreToChoice } from '../services/mood/wellbeingScale'
import { GUT_LEVELS, GUT_TYPE } from '../services/today'
import { localDateKey } from '../services/analysisEngine'
import { OBS_SD } from '../services/method/stateSpace'
import { eveningNotePlugin } from '../services/eveningNote'
import { APP_NAME } from '../config/brand'
import { FEATURES, IN_APP_SETTINGS } from '../config/distribution'
import { FIRST_RESULTS_DAY, FIRST_SCORE_DAY } from '../config/firstResults'
import { useEntitlement } from '../hooks/useEntitlement'
import { gutCardMode } from '../settings/onboarding'
import { appLocale } from '../i18n/locale.js'
import { keepWhole } from '../utils/keepWhole'
import './Recommendations.css'
import TrialLink from '../components/TrialLink'
import { monoDigits } from '../utils/monoDigits'

const WORDS = {
  wellbeing: { what: 'votre bien-être', note: 'votre bien-être', weigh: 'Ce qui va avec votre bien-être', scale: 'de bien-être', plus: 'meilleur bien-être', days: 'avec votre bien-être noté ou lu' },
  digestion: { what: 'votre confort digestif', note: 'votre digestion', weigh: 'Ce qui va avec votre confort digestif', scale: 'de confort digestif', levels: ' (Calme 5, Gêne 3, Douleur 1)', plus: 'plus de confort', days: 'avec votre digestion notée' },
}

/** POLISH-SIM-62 : jusqu'où remontent les délais comparés (le plus long prêt). */
/** POLISH-SIM-160 : « a, b et c », chaque nom commençant par une minuscule (les sigles gardent leurs capitales). */
const listFr = (names) => {
  const low = names.map((n) => (/^\p{Lu}{2}/u.test(n) ? n : n.charAt(0).toLocaleLowerCase('fr') + n.slice(1)))
  return low.length > 1 ? `${low.slice(0, -1).join(', ')} et ${low[low.length - 1]}` : low[0]
}
const COMPARED_UP_TO = { short: 'à la veille', medium: 'à 6 jours avant', long: 'à 27 jours avant' }

const pts = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

/** Mémorise les titres des pistes pour l'Accueil et Agir (sans recalcul de leur côté). */
function rememberTitles(results) {
  if (isExampleMode()) return
  try {
    localStorage.setItem(PISTES_SUMMARY_KEY, JSON.stringify({ ...pistesTitles(results), at: new Date().toISOString() }))
  } catch {
    /* stockage indisponible */
  }
}

/** POLISH-SIM-82 : les niveaux notés aujourd'hui (notes au fil de l'eau et bilan du jour), dans l'ordre de l'échelle. */
function gutLevelsToday(gutEntries, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const seen = new Set((gutEntries || []).filter((e) => e?.type === GUT_TYPE && e.at && localDateKey(e.at) === today).map((e) => e.payload?.level))
  return GUT_LEVELS.filter((l) => seen.has(l.id)).map((l) => l.label)
}

/** POLISH-SIM-82b : les notes de bien-être données aujourd'hui, telles que saisies (1 à 5), dans l'ordre. */
function wellbeingNotesToday(entries, now = new Date()) {
  const today = localDateKey(now.toISOString())
  return (entries || [])
    .filter((e) => e?.type === 'wellbeing' && e.at && localDateKey(e.at) === today && scoreToChoice(e.payload?.score) != null)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .map((e) => `${scoreToChoice(e.payload.score)}/5`)
}

const readWellbeingToday = () => {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  return listEntries({ type: 'wellbeing', since: since.toISOString(), limit: 50 })
}

/** Tests de réintroduction et notes digestives assez loin pour couvrir un test, sa pause et un redémarrage (comme Agir). */
const REINTRO_WINDOW_DAYS = 120
const readReintroData = async () => {
  const since = new Date(Date.now() - REINTRO_WINDOW_DAYS * 86_400_000).toISOString()
  const [challenges, gut] = await Promise.all([
    listEntries({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
    listEntries({ type: GUT_TYPE, since, limit: Infinity }),
  ])
  return { challenges, gut }
}

/** REFONTE-6e : la réintroduction guidée vit sous Confort digestif ; la ligne n'apparaît que si elle a quelque chose à dire. */
function ReintroLink({ line }) {
  if (!line) return null
  return (
    <Link to="/reintroduction" className="today-card act-card reco-reintro" data-tone="peach" data-testid="reco-reintro">
      <span className="act-card-body">
        <span className="act-card-title">Réintroduction guidée</span>
        <span className="act-card-detail">{line}</span>
      </span>
      <LineIcon name="chevron" size={20} className="act-chevron" />
    </Link>
  )
}

const readTrialRows = () => listEntries({ type: TRIAL_TYPE, limit: Infinity })

/**
 * POLISH-SIM-116 : deux paliers, les mêmes que l'Accueil et Objectifs. Avant le premier score (7e jour noté pour le
 * bien-être, 14e pour la digestion) : jours restants jusqu'au score, puis le jour des pistes. Score passé : jours
 * restants jusqu'aux pistes, le score se lit dans Objectifs.
 */
function Countdown({ outcome, view, onNote, onReminder, notedToday = [], canNote = true }) {
  const w = WORDS[outcome]
  const n = view.daysLeft
  const have = view.progress?.have
  const scoreDay = FIRST_SCORE_DAY[outcome]
  const beforeScore = have != null && have < scoreDay
  const notedDays = (k) => `${k} jour${k > 1 ? 's' : ''} noté${k > 1 ? 's' : ''}`
  const title = beforeScore
    ? `Premier score dans ${notedDays(scoreDay - have)}`
    : n != null && n > 0 ? `Vos pistes dans ${notedDays(n)}` : 'Vos pistes arrivent bientôt'
  const bar = beforeScore ? { have, need: scoreDay } : view.progress
  return (
    <section className="today-card reco-countdown" data-testid={`reco-countdown-${outcome}`} aria-labelledby={`reco-cd-${outcome}`}>
      <h3 id={`reco-cd-${outcome}`} className="today-card-title">{keepWhole(title)}</h3>
      <p className="today-card-text">
        Notez {w.note} chaque jour : {APP_NAME} cherchera ensuite quels facteurs sont statistiquement liés à {w.what}.
      </p>
      {bar && (
        <>
          <div className="pistes-progress" role="progressbar" aria-valuemin={0} aria-valuemax={bar.need}
            aria-valuenow={bar.have} aria-label="Jours notés">
            <div className="pistes-progress-bar" style={{ width: `${(bar.have / bar.need) * 100}%` }} />
          </div>
          <p className="pistes-count"><span className="mono">{bar.have}/{bar.need}</span> jours notés, pas forcément d’affilée</p>
        </>
      )}
      {bar && (
        <p className="today-card-text reco-stages">
          {beforeScore ? `Pistes au ${FIRST_RESULTS_DAY[outcome]}e jour noté.` : 'Votre score est déjà dans Objectifs.'}
        </p>
      )}
      {outcome === 'digestion' && view.symptomsLeft > 0 && view.symptoms && (
        <p className="today-card-text">
          Il faut aussi <span className="mono">{view.symptoms.need}</span> jours avec une gêne ou une douleur notée : vous en avez <span className="mono">{view.symptoms.have}</span>.
        </p>
      )}
      {/* POLISH-GUT-OFF-NOTE : suivi masqué, on n'invite pas à noter (le bandeau dit où le rallumer) */}
      {!canNote ? null : notedToday.length > 0 ? (
        <>
          <p className="reco-noted" role="status" data-testid="reco-noted-today">Noté aujourd’hui : {outcome === 'wellbeing' ? <span className="mono">{notedToday.join(', ')}</span> : notedToday.join(', ')}</p>
          <button type="button" className="reco-cta is-secondary" onClick={onNote}>Ajouter une note</button>
        </>
      ) : (
        <button type="button" className="reco-cta" onClick={onNote}>Noter maintenant</button>
      )}
      {!canNote ? null : outcome === 'wellbeing'
        ? onReminder && <button type="button" className="reco-cta is-secondary" onClick={onReminder}>Recevoir un rappel</button>
        : <GutEveningReminder />}
    </section>
  )
}

/** Barre de part et d'autre de zéro, avec sa fourchette ; hachurée si le lien n'est pas assez net. */
function EffectBar({ f, max }) {
  if (f.outOfScale) {
    // POLISH-SIM-16 : un chiffre plus grand que la note elle-même ne s'affiche pas.
    return (
      <li className="reco-effect is-unsure is-out" data-tone={THEME_TONE[f.theme] ?? 'stone'}>
        <span className="reco-effect-label">
          {f.label}
          <span className="reco-effect-for">pour {f.usualChange?.text}</span>
        </span>
        <span className="reco-effect-out">pas assez de données</span>
      </li>
    )
  }
  const pos = (v) => `${50 + (v / max) * 50}%`
  const left = Math.min(0, f.effect)
  const right = Math.max(0, f.effect)
  // METHODE-BIAIS-4 : au long terme, pas nette, la ligne ne montre que sa fourchette (resultsView.js).
  const rangeOnly = isRangeOnly(f)
  return (
    <li className={`reco-effect${f.net ? '' : ' is-unsure'}`} data-tone={THEME_TONE[f.theme] ?? 'stone'}>
      <span className="reco-effect-label">
        {f.label}
        <span className="reco-effect-for">pour {f.usualChange?.text}</span>
      </span>
      <span className="reco-effect-track" aria-hidden="true">
        <span className="reco-effect-zero" />
        <span className="reco-effect-range" style={{ left: pos(Math.max(-max, f.low)), right: `calc(100% - ${pos(Math.min(max, f.high))})` }} />
        {!rangeOnly && <span className="reco-effect-bar" style={{ left: pos(left), right: `calc(100% - ${pos(right)})` }} />}
      </span>
      {rangeOnly
        ? <span className="reco-effect-value is-unsure is-word">pas assez net</span>
        : <span className={`reco-effect-value${f.net ? '' : ' is-unsure'}`} aria-label={`${pts(f.effect)} point sur 5${f.net ? '' : ', pas assez net'}`}>{monoDigits(pts(f.effect))}&nbsp;pt</span>}
    </li>
  )
}

function EffectList({ factors }) {
  const shown = factors.filter((f) => !f.outOfScale && !isRangeOnly(f))
  const max = Math.max(0.3, ...shown.map((f) => Math.max(Math.abs(f.low), Math.abs(f.high), Math.abs(f.effect))))
  return <ul className="reco-effects">{factors.map((f) => <EffectBar key={`${f.key}-${f.horizon}`} f={f} max={max} />)}</ul>
}

/** POLISH-SIM-23 : l'unité « pt » dite une fois, sous le premier titre qui a des barres ;
 *  POLISH-SIM-53 et 54 : le sens du « + » et, pour la digestion, la note de chaque niveau. */
function Unit({ w }) {
  return <p className="reco-unit">pt : points de votre note {w.scale}, sur 5{w.levels ?? ''}. + : {w.plus}.</p>
}

/** REFONTE-6b : la force du lien le plus net de chaque famille, en trois points et en mots. */
function Families({ outcome, families, base }) {
  return (
    <section className="reco-block" aria-labelledby={`reco-families-${outcome}`}>
      <h3 id={`reco-families-${outcome}`} className="reco-section-title">Par famille</h3>
      {/* Lot VIE (étape 12) : le cairn des galets, la taille du galet = la force du lien (SPEC comprendre § 6.3) */}
      <Cairn families={families} />
      <ul className="reco-families">
        {families.map((fam) => {
          // REFONTE-6c : une famille qui a des facteurs comparés ouvre son détail ; la carte entière est le lien
          // POLISH-SIM-170 : sans facteur comparé, elle mène là où donner ce qui manque
          const open = fam.state !== 'nodata'
          const to = open ? `${base}/famille/${fam.id}` : fam.action?.to
          const body = (
            <>
              <span className="reco-family-name">
                <span className="reco-family-label">{fam.label}{to && <LineIcon name="chevron" size={16} className="reco-family-chevron" />}</span>
                {fam.lead && fam.lead !== fam.label && <span className="reco-family-lead">{fam.lead}</span>}
              </span>
              {fam.level > 0 && (
                <span className="reco-family-dots" aria-hidden="true">
                  {[1, 2, 3].map((i) => <span key={i} className={`reco-family-dot${i <= fam.level ? ' is-on' : ''}`} />)}
                </span>
              )}
              <span className="reco-family-word">{fam.word}</span>
              {fam.action && <span className="reco-family-action">{fam.action.text}</span>}
            </>
          )
          return (
            <li key={fam.id} className={`today-card reco-family${fam.level ? '' : ' is-quiet'}${to ? ' is-link' : ''}`} data-tone={fam.tone} data-testid={`reco-family-${fam.id}`}>
              {to ? <Link to={to} className="reco-family-link">{body}</Link> : body}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const FODMAP_HINTS = Object.fromEntries(FODMAP_GROUPS.map((g) => [`fodmap_${g.id}`, g.hint]))
const PLAIN_SUBJECT = { wellbeing: 'vous allez', digestion: 'votre digestion va' }

/**
 * UPG-9 (« Ventre, sans technique » : « −2,7 pt pour 1 repas riche en fructanes, je n'y comprends rien ») : la piste
 * se dit d'abord en clair, avec des aliments pour un groupe FODMAP ; « plutôt » garde le lien pour ce qu'il est, une
 * piste à vérifier par un essai. Le chiffre, son unité et son délai restent derrière le chevron.
 */
function pistePlain(f) {
  const change = (f.usualChange?.text ?? f.label).replace(/ \(FODMAP[^)]*\)/, '')
  const hint = FODMAP_HINTS[f.key]
  const subject = PLAIN_SUBJECT[f.outcome] ?? PLAIN_SUBJECT.wellbeing
  return `Avec ${change}${hint ? ` (${hint})` : ''}, ${subject} plutôt ${f.effect > 0 ? 'mieux' : 'moins bien'}.`
}

/** Une piste : le lien net en clair, son chiffre sur demande, et le chemin vers l'essai (ou vers l'abonnement tant que c'est flouté). */
function PisteCard({ f, locked = false }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="today-card reco-piste" data-tone={THEME_TONE[f.theme] ?? 'stone'}>
      <span className={`reco-piste-title${locked ? ' is-locked' : ''}`}>
        {locked ? <span className="pistes-first-blur" aria-hidden="true" /> : f.label}
      </span>
      {!locked && <span className="reco-piste-text">{pistePlain(f)}</span>}
      {!locked && open && (
        <span className="reco-piste-text" data-testid="reco-piste-detail">
          {monoDigits(pts(f.effect))} point sur 5 pour {f.usualChange?.text} ({f.horizonLabel.toLowerCase()})
        </span>
      )}
      {!locked && <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />}
      {locked
        ? <Link to="/premium" className="reco-piste-try">Débloquer</Link>
        : <Link to="/agir" className="reco-piste-try">Vérifier par un essai</Link>}
    </li>
  )
}

/** POLISH-SIM-128 : sans piste, une phrase simple ; pour l'alimentation, dire qu'il n'y a rien à éviter. */
const FAMILY_NONE = {
  wellbeing: 'Rien à éviter pour l’instant : aucun aliment ne va nettement avec un bien-être moins bon. Continuez à noter vos repas.',
  digestion: 'Rien à éviter pour l’instant : aucun aliment ne va nettement avec une digestion moins bonne. Continuez à noter vos repas.',
}

/** POLISH-FODMAP-ABSENT : les groupes FODMAP que la méthode n'a pas pu comparer (aucun repas au-dessus du repère). */
function FodmapNotCompared({ groups }) {
  if (!groups?.length) return null
  const many = groups.length > 1
  return (
    <p className="reco-next" data-testid="reco-family-fodmap-missing">
      Pas encore comparé{many ? 's' : ''}, trop peu de vos repas en sont riches : {listFr(groups.map((g) => `${g.label} (${g.hint})`))}.
    </p>
  )
}

/**
 * REFONTE-6c : le détail d'une famille. Ses liens nets d'abord, puis tout ce qui a été comparé dans la famille.
 * POLISH-SIM-128 (« Ventre, sans technique ») : les lignes chiffrées (groupes, pt, fourchettes) derrière le chevron,
 * et, quand plusieurs délais sont montrés, une phrase qui dit qu'ils se lisent séparément.
 */
function FamilyDetail({ outcome, detail }) {
  const w = WORDS[outcome]
  const many = detail.pistes.length > 1
  const [open, setOpen] = useState(false)
  const none = detail.id === 'nutrition' ? FAMILY_NONE[outcome] : 'Aucun lien assez net pour l’instant dans cette famille.'
  return (
    <>
      {detail.pistes.length > 0 ? (
        <section className="reco-block" aria-labelledby="reco-family-pistes">
          <h3 id="reco-family-pistes" className="reco-section-title">{many ? 'Pistes à tester' : 'Piste à tester'}</h3>
          <ul className="reco-pistes">{detail.pistes.map((f) => <PisteCard key={f.key} f={f} />)}</ul>
          {/* Lot VIE (étape 12) : Pilou attend discrètement à côté de la piste (SPEC comprendre § 6.5) */}
          <PilouWaiting />
        </section>
      ) : (
        <section className="reco-block">
          <p className="today-card-text" data-testid="reco-family-none">{none}</p>
        </section>
      )}
      {detail.bars && (
        <section className="reco-block" aria-labelledby="reco-family-bars">
          <h3 id="reco-family-bars" className="reco-section-title">Ce qui a été comparé</h3>
          <div className="reco-family-compared-row">
            <p className="reco-next" data-testid="reco-family-compared">
              <span className="mono">{detail.count}</span> facteur{detail.count > 1 ? 's comparés' : ' comparé'}, délai par délai.
            </p>
            <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
          </div>
          {open && (
            <>
              <Unit w={w} />
              {detail.horizons.length > 1 && (
                <p className="reco-unit">Chaque délai se lit à part : un même facteur peut aller dans un sens le jour même et dans l’autre ensuite.</p>
              )}
              {detail.horizons.map((h) => (
                <div key={h.id} className="reco-horizon">
                  <p className="reco-horizon-title">{h.label} <span className="reco-horizon-window">{h.window}</span></p>
                  <EffectList factors={h.factors} />
                </div>
              ))}
              {detail.horizons.some((h) => h.factors.some((f) => !f.net)) && (
                <p className="reco-legend"><span className="reco-legend-unsure" aria-hidden="true" /> hachuré, chiffre en gris : pas assez net</p>
              )}
              <FodmapNotCompared groups={detail.fodmapNotCompared} />
            </>
          )}
        </section>
      )}
      {!detail.bars && (
        <p className="reco-next" data-testid="reco-family-compared">
          <span className="mono">{detail.count}</span> facteur{detail.count > 1 ? 's comparés' : ' comparé'} à {w.what} dans cette famille
          {/* POLISH-SIM-160 : sans barres, les nommer */}
          {detail.names?.length ? ` : ${listFr(detail.names)}.` : '.'}
        </p>
      )}
      {!detail.bars && <FodmapNotCompared groups={detail.fodmapNotCompared} />}
    </>
  )
}

function Results({ outcome, view, locked, families = [], base }) {
  const w = WORDS[outcome]
  const showWeigh = !locked && view.weigh && view.weigh.length > 0
  // POLISH-SIM-69 : rien de net, les barres hachurées étaient lues comme un résultat. Elles se replient, et le
  // haut de la page dit ce qui a été comparé et ce qui manque.
  const [unsureOpen, setUnsureOpen] = useState(false)
  const quiet = showWeigh && view.weighNothingNet && !view.pistes.length && view.lookOnly.every((x) => !x.net)
  const bars = !quiet || unsureOpen
  const nextLock = view.nextLock && (
    <p className="reco-next">
      {/* POLISH-SIM-56 : dire ce qui est compté (jours avec ce résultat) et de quel délai il s'agit ;
          passage du 26/11 20:30 : dire aussi les jours déjà comptés (« 45 jours que je note, et encore 11 ? ») */}
      {view.nextLock.label}{view.nextLock.window ? ` (${view.nextLock.window})` : ''} : <span className="mono">{view.nextLock.have}</span> jour{view.nextLock.have > 1 ? 's' : ''} sur <span className="mono">{view.nextLock.need}</span> {w.days}, encore <span className="mono">{view.nextLock.daysLeft}</span>.
    </p>
  )
  return (
    <>
      {!locked && families.length > 0 && <Families outcome={outcome} families={families} base={base} />}
      <section className="reco-block" aria-labelledby={`reco-pistes-${outcome}`}>
        <h3 id={`reco-pistes-${outcome}`} className="reco-section-title">Pistes à tester</h3>
        {view.pistes.length ? (
          <ul className="reco-pistes">
            {view.pistes.map((f) => <PisteCard key={f.key} f={f} locked={locked} />)}
          </ul>
        ) : (
          <p className="today-card-text">Aucun lien assez net pour l’instant sur ce que vous pouvez changer.</p>
        )}
        {/* POLISH-SIM-62 : sans piste ni barre, dire au moins ce qui a été comparé */}
        {!view.pistes.length && (quiet || (!showWeigh && !(view.lookOnly.length && !locked))) && view.compared && (
          <p className="reco-next" data-testid="reco-compared">
            <span className="mono">{view.compared.count}</span> facteur{view.compared.count > 1 ? 's comparés' : ' comparé'} à {w.what}, du jour même {COMPARED_UP_TO[view.compared.upTo]}.
          </p>
        )}
        {quiet && nextLock}
        {quiet && (
          <button type="button" className="reco-how-link" aria-expanded={unsureOpen} onClick={() => setUnsureOpen(!unsureOpen)}>
            Voir les liens pas encore nets
          </button>
        )}
      </section>
      {showWeigh && bars && (
        <section className="reco-block" aria-labelledby={`reco-weigh-${outcome}`}>
          <h3 id={`reco-weigh-${outcome}`} className="reco-section-title">{w.weigh}</h3>
          <Unit w={w} />
          {view.weighNothingNet && (
            <p className="reco-unsure-all">Rien n’est net pour l’instant (barres hachurées, chiffres en gris) : ces chiffres bougeront avec vos prochains jours notés.</p>
          )}
          {view.weigh.map((h) => (
            <div key={h.id} className="reco-horizon">
              <p className="reco-horizon-title">{h.label} <span className="reco-horizon-window">{h.window}</span></p>
              <EffectList factors={h.factors} />
            </div>
          ))}
          {!view.weighNothingNet && (
            <p className="reco-legend"><span className="reco-legend-unsure" aria-hidden="true" /> hachuré, chiffre en gris : pas assez net</p>
          )}
          {view.flipped?.map((label) => (
            <p key={label} className="reco-flipped">{label} change de sens selon le délai : rien à en tirer pour l’instant.</p>
          ))}
        </section>
      )}
      {!locked && bars && view.lookOnly.length > 0 && (
        <section className="reco-block" aria-labelledby={`reco-look-${outcome}`}>
          <h3 id={`reco-look-${outcome}`} className="reco-section-title">À regarder, pas à changer</h3>
          {!showWeigh && <Unit w={w} />}
          <EffectList factors={view.lookOnly} />
        </section>
      )}
      {!quiet && nextLock}
    </>
  )
}

/**
 * « Comment c'est calculé », un seul lien en bas (POLISH-SIM-121 : « Votre bien-être » en avait deux l'un sous
 * l'autre). Sur le bien-être, il dit d'abord d'où vient le chiffre (REFONTE-6b, SPEC § 6.4), puis comment il est
 * comparé.
 */
// Poids de la note face au visage au départ, tiré des précisions du modèle (stateSpace) : 0,8² / 0,35² ≈ 5
const NOTE_VS_FACE = Math.round(OBS_SD.faceDefault ** 2 / OBS_SD.note ** 2)

function HowItWorks({ wellbeing = false }) {
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(false)
  return (
    <div className="reco-how">
      <button type="button" className="reco-how-link" aria-expanded={open} onClick={() => setOpen(!open)}>
        Comment c’est calculé
      </button>
      {open && wellbeing && <PilouFigure size={64} expr="content" move="hop" className="reco-how-pilou" />}
      {open && wellbeing && (
        <p className="reco-how-text" data-testid="reco-how-wellbeing">
          Deux sources, réunies chaque jour : votre note et la lecture du visage, si vous l’utilisez. Votre note
          compte environ {NOTE_VS_FACE} fois plus que le visage au départ, puis selon l’accord des deux chez vous. Un
          jour sans note ni lecture, {APP_NAME} l’estime d’après les jours voisins.
        </p>
      )}
      {open && (
        <p className="reco-how-text" data-testid="reco-how-simple">
          {APP_NAME} compare vos jours notés à ce que vous avez fait le jour même et les semaines d’avant. Un lien
          n’est montré que s’il revient sur plusieurs semaines, et tout est calculé sur le téléphone.
        </p>
      )}
      {open && (
        <button type="button" className="reco-how-link" aria-expanded={more} onClick={() => setMore(!more)}>
          Le détail
        </button>
      )}
      {open && more && (
        <p className="reco-how-text">
          Une ligne par jour. Chaque facteur est regardé sur trois fenêtres avant le jour mesuré : le jour même et la
          veille, de 2 à 6 jours avant, de 7 à 27 jours avant. Un modèle régularisé tient compte du jour de la semaine,
          des jours malades ou en voyage et de la tendance. Un lien n’est dit net que s’il tient quand on retire des
          semaines entières, et les effets ne sont montrés que si le modèle prévoit mieux que « demain comme
          aujourd’hui ».
        </p>
      )}
    </div>
  )
}

export default function Recommendations({ view = 'wellbeing', read = () => getAnalysis('analysisResults'), readGut = readGutNotes, readWellbeing = readWellbeingToday, readReintro = readReintroData, readTrials = readTrialRows }) {
  const outcome = view === 'gut' ? 'digestion' : 'wellbeing'
  const [results, setResults] = useState(() => peekAnalysis('analysisResults').result ?? null)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noted, setNoted] = useState(null)
  const [ent] = useEntitlement()
  const navigate = useNavigate()
  const [showGut] = useState(() => gutCardMode() !== 'hide')
  const [gutToday, setGutToday] = useState([])
  const [wbToday, setWbToday] = useState([])
  const [reintro, setReintro] = useState(null)
  const [trial, setTrial] = useState(null)
  const { family } = useParams()
  const base = outcome === 'digestion' ? '/recommendations/ventre' : '/recommendations/bien-etre'

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

  useEffect(() => {
    let alive = true
    const [readNotes, toToday, set] = outcome === 'digestion' ? [readGut, gutLevelsToday, setGutToday] : [readWellbeing, wellbeingNotesToday, setWbToday]
    Promise.resolve()
      .then(readNotes)
      .then((list) => alive && set(toToday(list)))
      .catch(() => alive && set([]))
    return () => {
      alive = false
    }
  }, [outcome, readGut, readWellbeing, revision])

  // REFONTE-6e : tests de réintroduction, pour la ligne du confort digestif (une lecture en échec ne montre rien)
  useEffect(() => {
    if (outcome !== 'digestion') return undefined
    let alive = true
    Promise.resolve()
      .then(readReintro)
      .then((d) => alive && setReintro(d))
      .catch(() => alive && setReintro(null))
    return () => {
      alive = false
    }
  }, [outcome, readReintro, revision])

  useEffect(() => {
    let alive = true
    Promise.resolve()
      .then(readTrials)
      .then((rows) => alive && setTrial(homeTrial(rows, new Date(), { outcome })))
      .catch(() => alive && setTrial(null))
    return () => {
      alive = false
    }
  }, [outcome, readTrials, revision])

  const v = results ? resultsView(results.outcomes?.[outcome]) : { state: 'loading' }
  // Version Play sans abonnement (hors période de lancement) : les pistes restent floues, comme avant
  const locked = FEATURES.billing && !ent.premium
  // REFONTE-6c : le détail d'une famille, seulement quand il a quelque chose à montrer
  const detail = family && v.state === 'results' && !locked ? familyDetail(results.outcomes?.[outcome], family) : null
  const reintroText = outcome === 'digestion' && reintro && !isExampleMode()
    ? reintroLine(actSections({ ...reintro, pistes: results && !locked ? pistesTitles(results) : null }))
    : null
  const gutOff = outcome === 'digestion' && !showGut && !isExampleMode()
  const objectiveTitle = outcome === 'digestion' ? 'Votre confort digestif' : 'Votre bien-être'
  const onNote = outcome === 'wellbeing' ? () => setNoteOpen(true) : () => navigate('/ma-journee', { state: { open: 'digestion' } })
  // La note qui vient d'être enregistrée ici se lit dans la carte, même si la relecture des notes échoue
  const notedToday = outcome === 'digestion' ? gutToday : wbToday.length ? wbToday : noted != null ? [`${noted}/5`] : []
  const onReminder = outcome === 'wellbeing' && eveningNotePlugin() ? () => setNoteOpen('reminder') : null

  if (family && !detail && (v.state !== 'loading' || error)) return <Navigate to={base} replace />
  if (detail) {
    return (
      <section className="reco-page" data-tone={detail.tone}>
        <p className="reco-back"><Link to={base}>← {objectiveTitle}</Link></p>
        <h2 className="page-title">{detail.label}</h2>
        <FamilyDetail outcome={outcome} detail={detail} />
        <HowItWorks />
      </section>
    )
  }

  return (
    <section className="reco-page" data-tone={outcome === 'digestion' ? 'peach' : 'mint'}>
      {/* REFONTE-6a : le détail d'un objectif s'ouvre depuis sa carte d'Objectifs */}
      <p className="reco-back"><Link to="/recommendations">← Objectifs</Link></p>
      <h2 className="page-title">{objectiveTitle}</h2>
      {/* Pendant l'exemple (« Voir un exemple »), la digestion fictive s'affiche : pas de bandeau « masqué » (POLISH-SIM-37b) */}
      {gutOff && (
        <p className="reco-intro" data-testid="gut-off">
          Le suivi digestif est masqué. Pour le retrouver : {IN_APP_SETTINGS} › Paramètres › <Link to="/settings">Vos objectifs</Link>.
        </p>
      )}
      {error && <div className="error-msg" role="alert">{error}</div>}
      {outcome === 'wellbeing' && noted != null && v.state !== 'locked' && <p className="reco-noted" role="status">Noté : <span className="mono">{noted}/5</span></p>}
      {!isExampleMode() && <TrialLink trial={trial} className="reco-trial" testId="reco-trial" />}
      {v.state === 'loading' && !error && (
        <div className="loading"><div className="spinner" aria-hidden /><p>Calcul des analyses…</p></div>
      )}
      {v.state === 'locked' && <Countdown outcome={outcome} view={v} onNote={onNote} onReminder={onReminder} notedToday={notedToday} canNote={!gutOff} />}
      {v.state === 'results' && <Results outcome={outcome} view={v} locked={locked} families={influenceFamilies(results.outcomes?.[outcome])} base={base} />}
      {v.state !== 'loading' && <ReintroLink line={reintroText} />}
      {outcome === 'digestion' && v.state === 'results' && <DoctorReportCard />}
      <HowItWorks wellbeing={outcome === 'wellbeing'} />
      <SeeExample />
      <WellbeingPrompt open={!!noteOpen} initialMode={noteOpen === 'reminder' ? 'reminder' : 'now'} onClose={() => setNoteOpen(false)} onSaved={setNoted} />
    </section>
  )
}
