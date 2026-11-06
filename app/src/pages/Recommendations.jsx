import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SoonList from '../components/SoonList'
import { listEntriesForAnalysis, countAllEntries } from '../storage/localHealthStorage'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { rememberPistesSummary } from '../services/pistesSummary'
import { HorizonHeading, MealHoursHorizon, WellbeingWeeks } from '../components/Horizon'
import DomainTag from '../components/DomainTag'
import { getHiddenLinks, gutLinkKey, hideLink, unhideAllLinks } from '../settings/hiddenLinks'
import {
  buildDailyDataset,
  localDateKey,
  MIN_DAYS_BASIC,
  HOLD_OUT_DAYS,
  MAX_FEATURES_RATIO,
  MAX_FEATURES,
  COLLINEARITY_MAX_R,
  MIN_ADVICE_EFFECT,
  MIN_WEEKEND_DAYS,
  DAY_OVER_HOUR,
  LEVER_MAX_Q,
  LEVER_PERSONAL_Q,
  LEVER_FAMILY,
} from '../services/analysisEngine'
import { MIN_TAG_DAYS, AUTO_LATE_SCREEN_MIN, EVENING_SPORT_FROM_HOUR, LATE_MEAL_FROM_HOUR } from '../services/behaviorTags'
import { LAGS, MIN_LAG_PAIRS } from '../services/laggedEffects'
import { FACE_MOOD_MIN_DAYS, FACE_MOOD_MIN_READINGS } from '../services/mood/faceMoodDays'
import { isDebugModeEnabled } from '../settings/debugMode'
import { formatSigned, evidenceLabel } from '../utils/format'
import { correlationStrength } from '../services/statistics'
import { useAutoSync } from '../hooks/useAutoSync'
import DetailsToggle from '../components/DetailsToggle'
import GutLinks from '../components/GutLinks'
import { GUT_LINKS_MIN_DAYS } from '../services/gutLinks'
import ReintroductionEntry from '../components/ReintroductionEntry'
import DoctorReportCard from '../components/DoctorReportCard'
import GutWeeks from '../components/GutWeeks'
import AnalysesTabs from '../components/AnalysesTabs'
import { gutCardMode } from '../settings/onboarding'
import { decimalMark } from '../i18n/locale.js'
import './Recommendations.css'

// ─── Correlation bar chart (SVG) ─────────────────────────────────────────────

function formatR(r) {
  return formatSigned(r, 2)
}

/** POL-7b (D6) : barres neutres lilas, le sens dit par ↑ / ↓ et non par vert / rouge (« bon » / « mauvais »). */
// ─── Importance bar (ML tab) ──────────────────────────────────────────────────

function ImportanceBar({ label, importance, direction }) {
  // importance is already normalised to [0,1] where 1 = strongest variable
  const pct = Math.round(importance * 100)
  return (
    <div className="reco-corr-row">
      <span className="reco-corr-label">{label}</span>
      <div className="reco-corr-bar-wrap">
        <div
          className={'reco-corr-bar ' + (direction === 'positive' ? 'reco-corr-up' : 'reco-corr-down')}
          style={{ width: `${pct}%` }}
          aria-label={`${pct}%`}
        />
      </div>
      <span className="reco-corr-value">
        {direction === 'positive' ? '▲' : '▼'} {pct}%
      </span>
    </div>
  )
}

// ─── Advice card ─────────────────────────────────────────────────────────────

function AdviceCard({ rank, advice }) {
  return (
    <li className="reco-advice-card">
      <span className="reco-advice-rank">{rank}</span>
      <div className="reco-advice-content">
        <p className="reco-advice-text">{advice}</p>
      </div>
    </li>
  )
}

// ─── Lever card ("piste à tester") ───────────────────────────────────────────

/** VC-23 : une seule échelle de solidité dans tout l'onglet, mêmes mots et mêmes pastels (DESIGN.md). */
const EVIDENCE_CLASS = {
  solide: 'reco-evidence-solid',
  'à confirmer': 'reco-evidence-tentative',
  incertain: 'reco-evidence-early',
}

function EvidenceBadge({ evidence }) {
  return <span className={'reco-evidence ' + (EVIDENCE_CLASS[evidence] ?? '')}>{evidenceLabel(evidence)}</span>
}

/** Below this change, the week-end control is not worth mentioning on a lever. */
const WEEKEND_R_SHIFT = 0.1

/** D6 : une piste contraire à la norme générale est montrée telle quelle, sans culpabiliser. */
function AgainstNormNote() {
  return (
    <p className="reco-advice-impact">Contraire à l’hypothèse générale : chez vous, vos données font foi.</p>
  )
}

/** I108 : une piste nette « chez vous » (q < 0,05) ou une seule « à vérifier » (q < 0,2). */
const LEVER_STAGE = {
  personal: { evidence: 'solide', note: 'Le lien tient même en comptant tous les facteurs testés.' },
  toVerify: { evidence: 'à confirmer', note: 'Peut-être le hasard. À revoir dans quelques jours.' },
}

/** POL-7b : la piste en mots d'abord ; r, jours indépendants et week-end derrière le chevron. */
function LeverCard({ rank, lever, lag, onHide }) {
  const [open, setOpen] = useState(false)
  const days = Math.round(lever.nEff)
  const weekendShift = lever.rRaw != null && Math.abs(lever.rRaw - lever.r) >= WEEKEND_R_SHIFT
  const stage = LEVER_STAGE[lever.stage]
  const toVerify = lever.stage === 'toVerify'
  return (
    <li className={'reco-advice-card' + (toVerify ? ' reco-advice-card--verify' : '')}>
      <span className="reco-advice-rank">{toVerify ? '?' : rank}</span>
      <div className="reco-advice-content">
        <DomainTag domain="wellbeing" />
        {/* POL-PLAY-32 : le lien en titre (« facteur → effet ») ; l'action à tester derrière le chevron */}
        <p className="reco-advice-text">{lever.title ?? lever.action}</p>
        {lever.againstNorm && <AgainstNormNote />}
        {open && lever.title && lever.action && (
          <p className="reco-advice-impact">À tester : {lever.action.charAt(0).toLowerCase() + lever.action.slice(1)}</p>
        )}
        <p className="reco-advice-impact">
          {toVerify ? 'Lien possible' : `Lien ${lever.strength}`} avec votre bien-être
        </p>
        <EvidenceBadge evidence={stage?.evidence ?? lever.evidence} />
        {open && stage && <p className="reco-advice-impact">{stage.note}</p>}
        {open && (
          <p className="reco-advice-stats">
            r = {formatR(lever.r)} · ≈ {days} jours indépendants
            {weekendShift && <> · r = {formatR(lever.rRaw)} sans tenir compte du week-end</>}
          </p>
        )}
        {/* POL-7c : un facteur = un verdict ; son effet décalé est rappelé ici plutôt que listé à part */}
        {open && lag && (
          <p className="reco-advice-stats">
            {lag.when}, {lag.sdText} de plus que d’habitude → bien-être {frDiff(lag.effectPerSd)}{' '}
            point{Math.abs(lag.effectPerSd) >= 2 ? 's' : ''} ({evidenceLabel(lag.evidence).toLowerCase()})
          </p>
        )}
        {open && onHide && <HideButton label="Masquer cette piste" onHide={onHide} />}
      </div>
      <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
    </li>
  )
}

// ─── Behaviour tags (« jours avec / sans ») ──────────────────────────────────

function frScore(v, digits = 1) {
  return v.toFixed(digits).replace('.', decimalMark())
}

function frDiff(v) {
  return formatSigned(v, 1)
}

// Show the week-end-controlled difference only when it really differs from the raw one.
const TAG_WEEKEND_SHIFT = 0.1

/** D'où vient un tag que l'app mesure elle-même (au lieu de le demander). */
function autoSourceNote(tagId) {
  if (tagId === 'evening_sport') return `déduit de vos séances (début après ${EVENING_SPORT_FROM_HOUR} h)`
  if (tagId === 'late_meal') return `déduit de vos repas notés (après ${LATE_MEAL_FROM_HOUR} h)`
  if (tagId === 'travel') return 'déduit des changements de fuseau horaire'
  return `mesuré par le téléphone (≥ ${AUTO_LATE_SCREEN_MIN} min après 22 h)`
}

/** VC-24 : une moyenne sur 5 à une décimale. */
function round1(v) {
  return Math.round(v * 10) / 10
}

function Delta({ value }) {
  return (
    <strong className={value < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
      {formatSigned(value, 1)} point{Math.abs(value) >= 2 ? 's' : ''}
    </strong>
  )
}

/**
 * VC-24 : un seul gabarit pour tous les liens (le jour même, jours avec / sans, avec délai) : le facteur en
 * entier, une phrase, la solidité. La ligne de chiffres en mono (jours, r, week-end) n'apparaît qu'au chevron
 * (POL-PLAY-22 : simple d'abord, détails pour qui veut creuser).
 */
/** I86 : retirer un lien évident, faux ou sans intérêt (réversible en bas de page, rien n'est effacé). */
function HideButton({ label, onHide }) {
  return (
    <button type="button" className="reco-hide-btn" onClick={onHide}>
      {label}
    </button>
  )
}

function LinkCard({ kind, name, children, meta, evidence, extra, onHide }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={`reco-link-card reco-link-card--${kind}` + (evidence === 'incertain' ? ' reco-link-card-uncertain' : '')}>
      <div className="reco-link-body">
        <DomainTag domain="wellbeing" />
        <p className="reco-link-name">{name}</p>
        {children}
        {open && meta && <p className="reco-link-meta">{meta}</p>}
        <EvidenceBadge evidence={evidence} />
        {extra}
        {open && onHide && <HideButton label="Masquer ce lien" onHide={onHide} />}
      </div>
      {meta && <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />}
    </li>
  )
}

function TagEffectCard({ effect, measure = 'bien-être', extra, onHide }) {
  const when = effect.effectDay === 'next' ? 'Le lendemain' : 'Le jour même'
  // Écart des moyennes affichées : les chiffres collent toujours à une décimale.
  const shown = round1(round1(effect.meanWith) - round1(effect.meanWithout))
  const weekendShift = Math.abs(effect.diff - (effect.diffRaw ?? effect.diff)) >= TAG_WEEKEND_SHIFT
  const meta = [
    `${effect.nWith} jour${effect.nWith > 1 ? 's' : ''} avec · ${effect.nWithout} sans`,
    effect.auto && autoSourceNote(effect.tagId),
    weekendShift && `week-end à part : ${frDiff(effect.diff)}`,
  ].filter(Boolean).join(' · ')
  return (
    <LinkCard kind="tag" name={effect.label} meta={meta} evidence={effect.evidence} extra={extra} onHide={onHide}>
      <p className="reco-link-text">
        {when} : {measure} {frScore(effect.meanWith)} / 5 contre {frScore(effect.meanWithout)} sans{' '}
        <Delta value={shown} />
      </p>
    </LinkCard>
  )
}

// ─── Lagged effects (« la veille », « 2 jours avant ») ───────────────────────

function LaggedEffectCard({ effect, measure = 'bien-être du jour', extra, onHide }) {
  return (
    <LinkCard
      kind="lag"
      name={effect.label}
      meta={`Lien ${effect.strength} · r = ${formatR(effect.r)} · ≈ ${Math.round(effect.nEff)} jours indépendants`}
      evidence={effect.evidence}
      extra={extra}
      onHide={onHide}
    >
      <p className="reco-link-text">
        {effect.when}, {effect.sdText} de plus que d’habitude → {measure} <Delta value={effect.effectPerSd} />
      </p>
      {effect.action && <p className="reco-link-text">Piste : {effect.action}</p>}
      {effect.action && effect.againstNorm && <AgainstNormNote />}
    </LinkCard>
  )
}

// ─── Same-day correlations ───────────────────────────────────────────────────

function CorrelationCard({ item, measure = 'bien-être', extra, onHide }) {
  const meta = [`Lien ${item.strength ?? correlationStrength(item.r)}`, `r = ${formatR(item.r)}`]
  if (item.nEff != null) meta.push(`≈ ${Math.round(item.nEff)} jours indépendants`)
  return (
    <LinkCard kind="corr" name={item.label} meta={meta.join(' · ')} evidence={item.evidence} extra={extra} onHide={onHide}>
      <p className="reco-link-text">
        Le jour même : plus haut, {item.r >= 0 ? `meilleur ${measure}` : `${measure} moins bon`}.
      </p>
    </LinkCard>
  )
}

// ─── Not enough data placeholder ─────────────────────────────────────────────

function NotEnoughData({ currentDays, minDays }) {
  const remaining = minDays - currentDays
  return (
    <div className="reco-not-enough">
      <p className="reco-not-enough-title">Pas encore assez de jours mesurés</p>
      <p className="reco-not-enough-hint">
        {currentDays === 0
          ? `Les liens avec votre bien-être demandent au moins ${minDays} jours avec une note de bien-être («\u00a0Noter moi-même\u00a0», dans la carte Bien-être estimé de l’Accueil).`
          : `Encore ${remaining} jour${remaining > 1 ? 's' : ''} avec une note de bien-être (vous en avez ${currentDays}).`}
      </p>
    </div>
  )
}

/** Seuil des liens avec le bien-être, en une ligne pour les « détails » de la carte lilas (VC-12). */
// ─── Week-end control note ───────────────────────────────────────────────────

function WeekendNote({ control }) {
  if (!control) return null
  if (!control.applied) {
    return (
      <p>
        Pas encore assez de jours de week-end et de semaine notés ({MIN_WEEKEND_DAYS} de chaque)
        pour tenir compte du jour de la semaine.
      </p>
    )
  }
  return (
    <p>
      Liens calculés en tenant compte du week-end (bien-être moyen :{' '}
      <strong>{frScore(control.weekendMean)} le week-end</strong>,{' '}
      <strong>{frScore(control.weekdayMean)} en semaine</strong>) : une habitude plus fréquente
      le samedi n’est pas créditée du meilleur bien-être du week-end.
    </p>
  )
}

/**
 * Variables déjà présentées ailleurs dans l'onglet : « Écran tard » est comparé en habitude (soirées mesurées par
 * le téléphone), ne pas le répéter en variable continue.
 */
const CHART_HIDDEN_VARIABLES = new Set(['screen_late_minutes'])

/**
 * Un même facteur sous deux noms (variable continue et tag) : un seul verdict (POL-7c). La dépense de l'activité et
 * celle de la journée entière disent la même chose (POL-PLAY-5) : un seul lien, le plus solide.
 */
const FACTOR_ALIAS = {
  alcohol_g: 'alcohol',
  screen_late_minutes: 'late_screen',
  activityCalories: 'energy_out',
  dailyCaloriesHC: 'energy_out',
}

const EVIDENCE_RANK = { solide: 0, 'à confirmer': 1, incertain: 2 }

/** Au-delà, les liens nets se replient derrière « Voir N autres liens ». */
const LINKS_SHOWN = 5

/**
 * POL-7c : corrélations, habitudes et effets décalés, avec vos notes et avec le bien-être estimé (visage), réunis
 * en une seule liste où chaque facteur n'a qu'un verdict : le plus solide (q le plus bas, vos notes d'abord à
 * égalité) ; les autres mesures du même facteur sont rappelées en une ligne. Rien n'est recalculé ici.
 */
function mergeLinks({ correlations: basic, tagEffects, laggedEffects, faceMood }, leverVariables = new Set()) {
  const items = []
  const add = (source, list, kind, keyOf) => {
    for (const x of list ?? []) items.push({ key: keyOf(x), source, kind, item: x })
  }
  const corrKey = (c) => FACTOR_ALIAS[c.variable] ?? c.variable
  const okCorr = (list) => (list ?? []).filter((c) => !CHART_HIDDEN_VARIABLES.has(c.variable))
  const tags = (t) => (t?.status === 'ok' ? t.effects : [])
  const lags = (l) => (l?.status === 'ok' ? l.effects : [])
  add('notes', okCorr(basic?.status === 'ok' ? basic.correlations : []), 'corr', corrKey)
  add('notes', tags(tagEffects), 'tag', (e) => e.tagId)
  add('notes', lags(laggedEffects), 'lag', corrKey)
  if (faceMood?.status === 'ok') {
    add('visage', okCorr(faceMood.correlations), 'corr', corrKey)
    add('visage', tags(faceMood.tagEffects), 'tag', (e) => e.tagId)
    add('visage', lags(faceMood.laggedEffects), 'lag', corrKey)
  }
  // Un facteur de la même famille qu'une piste montrée (pas → « Marcher davantage », calories d'activité →
  // « Bouger davantage ») ne se répète pas sous « Autres liens repérés » (POL-PLAY-14).
  const families = new Set([...leverVariables].map((v) => LEVER_FAMILY[v]).filter(Boolean))
  const sameFamily = Object.keys(LEVER_FAMILY).filter((v) => families.has(LEVER_FAMILY[v]))
  const leverKeys = new Set([...leverVariables, ...sameFamily].map((v) => FACTOR_ALIAS[v] ?? v))
  const rank = (a) => [EVIDENCE_RANK[a.item.evidence] ?? 2, a.item.q ?? 1, a.source === 'notes' ? 0 : 1]
  const better = (a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] < rb[i]
    return false
  }
  const byKey = new Map()
  for (const it of items) {
    if (leverKeys.has(it.key)) continue
    const group = byKey.get(it.key)
    if (!group) byKey.set(it.key, { best: it, others: [] })
    else if (better(it, group.best)) {
      group.others.push(group.best)
      group.best = it
    } else group.others.push(it)
  }
  return [...byKey.values()]
    .map(({ best, others }) => ({ ...best, others }))
    .sort((a, b) => (better(a, b) ? -1 : better(b, a) ? 1 : 0))
}

const KIND_LABEL = { corr: 'le jour même', tag: 'jours avec / sans', lag: 'avec délai' }

/** Les autres mesures nettes d'un même facteur, en une ligne sous son verdict (les incertaines n'apprennent rien). */
function AlsoLine({ best, others }) {
  // Même source et même mesure qu'au-dessus (dépense de l'activité / de la journée) : rien de neuf à rappeler.
  const clear = others.filter((o) => o.item.evidence !== 'incertain' && (o.source !== best.source || o.kind !== best.kind))
  if (!clear.length) return null
  // En phrase (POL-PLAY-7) : « Se retrouve aussi avec votre bien-être estimé (le jour même). »
  const parts = [...new Set(clear.map((o) => `${ALSO_SOURCE[o.source]} (${KIND_LABEL[o.kind]})`))]
  return <p className="reco-link-also">Se retrouve aussi {parts.join(' et ')}.</p>
}

const ALSO_SOURCE = { notes: 'avec vos notes', visage: 'avec votre bien-être estimé' }

function SourceChip({ source }) {
  return source === 'visage' ? <span className="reco-link-src">visage</span> : null
}

function LinkItem({ link, onHide }) {
  const { kind, source, item, others } = link
  const hide = onHide ? () => onHide(link.key) : undefined
  const face = source === 'visage'
  const extra = (
    <>
      <SourceChip source={source} />
      <AlsoLine best={link} others={others} />
    </>
  )
  if (kind === 'tag') return <TagEffectCard effect={item} measure={face ? 'bien-être estimé' : 'bien-être'} extra={extra} onHide={hide} />
  if (kind === 'lag') {
    // D6 : le bien-être estimé ne propose jamais de piste
    const effect = face ? { ...item, action: null } : item
    return <LaggedEffectCard effect={effect} measure={face ? 'bien-être estimé du jour' : 'bien-être du jour'} extra={extra} onHide={hide} />
  }
  return <CorrelationCard item={item} measure={face ? 'bien-être estimé' : 'bien-être'} extra={extra} onHide={hide} />
}

/** Ce qui manque encore à une habitude pour être comparée, en mots simples (POL-PLAY-70). */
function pendingProgress(t) {
  if (t.weekendOnly) return 'pas encore comparable (semaine et week-end)'
  const days = (n) => `${n} jour${n > 1 ? 's' : ''}`
  const missing = [
    // Un repère mesuré (écran, sport du soir) n'est pas « noté ».
    t.nWith < MIN_TAG_DAYS && `${days(MIN_TAG_DAYS - t.nWith)} ${t.auto ? 'avec' : `noté${MIN_TAG_DAYS - t.nWith > 1 ? 's' : ''}`}`,
    t.nWithout < MIN_TAG_DAYS && `${days(MIN_TAG_DAYS - t.nWithout)} sans`,
  ].filter(Boolean)
  return `encore ${missing.join(' et ')}`
}

/**
 * Habitudes pas encore comparables (POL-PLAY-98) : une ligne chacune dans « Bientôt », au lieu d'une phrase
 * « Bientôt comparés : … » posée seule au-dessus de cette section. Un tag déjà montré comme lien n'y est pas (POL-PLAY-6).
 */
function pendingTagLines(analysis, links) {
  return [
    ...(analysis.tagEffects?.status === 'ok' ? analysis.tagEffects.pending : []),
    ...(analysis.faceMood?.status === 'ok' && analysis.faceMood.tagEffects?.status === 'ok'
      ? analysis.faceMood.tagEffects.pending.filter((t) => !t.weekendOnly)
      : []),
  ].filter((t, i, all) => all.findIndex((u) => u.tagId === t.tagId) === i)
    .filter((t) => !links.some((l) => l.key === t.tagId))
    .map((t) => ({ id: `tag:${t.tagId}`, label: t.label, progress: pendingProgress(t) }))
}

/**
 * « Autres liens repérés » (POL-7c, maquette I163 §4) : une seule liste, un verdict par facteur, les liens nets
 * d'abord (5 visibles, puis « Voir N autres liens »), les incertains repliés.
 */
function LinksSection({ analysis, levers = [], hidden = [], onHide }) {
  const leverVariables = new Set(levers.map((l) => l.variable))
  const links = mergeLinks(analysis, leverVariables).filter((l) => !hidden.includes(l.key))
  if (!links.length) return null
  const clear = links.filter((l) => l.item.evidence !== 'incertain')
  const uncertain = links.filter((l) => l.item.evidence === 'incertain')
  const list = (ls) => (
    <ul className="reco-link-list">
      {ls.map((l) => (
        <LinkItem key={`${l.kind}:${l.source}:${l.key}`} link={l} onHide={onHide} />
      ))}
    </ul>
  )
  const more = clear.length - LINKS_SHOWN
  const faceDays = analysis.faceMood?.status === 'ok' ? analysis.faceMood.faceDays : null
  // L'étiquette « visage » ne s'explique qu'au-dessus d'une liste qui la montre (pas pour une ligne « aussi »).
  const hasFace = (ls) => faceDays != null && ls.some((l) => l.source === 'visage')
  const faceHint = (
    <p className="reco-section-hint">Étiquette « visage » : lien repéré avec votre bien-être estimé par la caméra ({faceDays} jours).</p>
  )
  return (
    <section className="reco-section" data-testid="reco-links">
      <h3 className="reco-section-title">{leverVariables.size > 0 ? 'Autres liens repérés' : 'Liens repérés'}</h3>
      <p className="reco-section-hint" data-testid="reco-links-hint">
        Tout ce qui varie avec votre bien-être, même ce qui ne se change pas, comme la météo ou le pouls.
      </p>
      {hasFace(clear) && faceHint}
      {clear.length > 0 ? list(clear.slice(0, LINKS_SHOWN)) : (
        <p className="reco-empty-levers">
          Aucun {leverVariables.size > 0 ? 'autre ' : ''}lien net pour l’instant : continuez à noter votre bien-être.
        </p>
      )}
      {more > 0 && (
        <details className="reco-corr-more">
          <summary>{more === 1 ? 'Voir 1 autre lien' : `Voir ${more} autres liens`}</summary>
          {list(clear.slice(LINKS_SHOWN))}
        </details>
      )}
      {uncertain.length > 0 && (
        <details className="reco-corr-more">
          <summary>
            {uncertain.length === 1 ? 'Voir le lien incertain' : 'Voir les liens incertains'}
          </summary>
          <p className="reco-section-hint">Trop tôt pour dire : peut-être le hasard.</p>
          {!hasFace(clear) && hasFace(uncertain) && faceHint}
          {list(uncertain)}
        </details>
      )}
    </section>
  )
}

/** Méthode des liens avec le bien-être estimé (visage), dans la note « Comment c’est calculé » du bas de page. */
function FaceMoodMethod() {
  return (
    <>
      <p className="reco-method-sub">Avec votre bien-être estimé (visage)</p>
      <p>
        Un jour avec au moins {FACE_MOOD_MIN_READINGS} lectures au déverrouillage reçoit un bien-être estimé : la
        médiane de ses lectures. Il compte comme une note prise à la dernière lecture : avant {DAY_OVER_HOUR} h, ce
        que vous faites ensuite ne compte pas. Mêmes garde-fous que pour vos notes. Ce bien-être ne vient que de
        votre visage (et de vos notes si vous en donnez) : aucun facteur comparé ne sert à l’estimer.
      </p>
      <p>
        Habitudes et effets décalés : comparés de la même façon, liens solides seulement pour les effets décalés.
      </p>
      <p>
        Le bien-être vient ici d’une estimation, moins précise qu’une note.
      </p>
    </>
  )
}

// ─── Bientôt : ce qui attend encore des données ──────────────────────────────

/**
 * Une ligne discrète par bloc qui n'a pas encore assez de données (POL-7) : jamais une carte presque vide.
 * Rien n'est calculé ici, seuls les compteurs déjà rendus par les analyses sont repris.
 */
function soonLines({ faceMood, tagEffects, laggedEffects } = {}, tagLines = []) {
  const lines = []
  if (faceMood && faceMood.status !== 'ok' && faceMood.status !== 'no_face') {
    lines.push({
      id: 'face',
      label: 'Avec votre bien-être estimé',
      progress: `${Math.min(faceMood.currentDays ?? 0, FACE_MOOD_MIN_DAYS)}/${FACE_MOOD_MIN_DAYS} jours`,
    })
  }
  if (tagEffects?.status === 'no_tags') {
    lines.push({ id: 'tags', label: 'Vos habitudes', progress: 'à ajouter à vos notes' })
  } else if (tagLines.length > 0) {
    // Chaque habitude a sa ligne : pas de compteur « Vos habitudes » en plus
    lines.push(...tagLines)
  } else if (tagEffects?.status === 'ok' && tagEffects.effects.length === 0) {
    const counts = tagEffects.pending.filter((t) => !t.weekendOnly).map((t) => Math.min(t.nWith, t.nWithout, MIN_TAG_DAYS))
    const best = counts.length ? Math.max(...counts) : 0
    lines.push({ id: 'tags', label: 'Vos habitudes', progress: `${best}/${MIN_TAG_DAYS} jours` })
  }
  if (laggedEffects?.status === 'not_enough_data') {
    lines.push({
      id: 'lagged',
      label: 'Effets décalés',
      progress: `${Math.min(laggedEffects.currentDays ?? 0, MIN_LAG_PAIRS)}/${MIN_LAG_PAIRS} jours`,
    })
  }
  return lines
}

function SoonSection({ lines }) {
  return <SoonList lines={lines} testId="reco-soon" />
}

// ─── Comment c'est calculé (une seule note, en bas de page) ──────────────────

function CorrelationMethod({ result }) {
  const { datasetDays } = result
  return (
    <>
      <p>
        Corrélation de Pearson entre chaque variable et le bien-être, corrigée pour les jours qui
        se ressemblent (autocorrélation) et pour le nombre de variables testées
        (Benjamini-Hochberg). Un jour sans mesure (montre non portée, pas de pesée) est ignoré
        pour cette mesure, jamais compté comme 0. Un jour noté avant {DAY_OVER_HOUR} h, seuls les pas,
        séances, cigarettes et temps d’écran d’avant la note comptent : ce qui suit ne peut pas
        l’expliquer.
        {result.nutritionDays != null && result.nutritionDays < datasetDays && (
          <>
            {' '}Alimentation connue sur {result.nutritionDays} jour{result.nutritionDays > 1 ? 's' : ''} sur {datasetDays} :
            un jour sans repas saisi ne compte pas comme 0 kcal (un oubli n’est pas un jeûne), et sans aucun
            repas saisi sur les 10 jours précédents, l’alimentation du jour est ignorée.
          </>
        )}
      </p>
      <WeekendNote control={result.weekendControl} />
      <p>
        Habitudes : bien-être les jours avec chaque habitude comparé aux jours sans. Pour celles du
        soir, c’est le lendemain qui compte. Le stress ressenti fait partie de votre bien-être : il
        n’est pas présenté comme sa cause.
      </p>
      <p>
        Liens « la veille » ou « 2 jours avant » : ce que vous avez fait {LAGS[0]} à {LAGS[LAGS.length - 1]} jours
        avant, à bien-être de la veille égal et à journée égale (sommeil, pas… du jour même). Une bonne passe qui
        dure n’est donc pas créditée à vos comportements.
      </p>
      <p>
        {evidenceLabel('solide')} : le lien tient même en comptant tous les facteurs testés
        (q &lt; {LEVER_PERSONAL_Q.toString().replace('.', decimalMark())}). {evidenceLabel('à confirmer')} : plus fragile (q &lt; {LEVER_MAX_Q.toString().replace('.', decimalMark())}), une au plus.
      </p>
      <p>
        Tout est calculé sur votre téléphone. Ce sont des hypothèses : une corrélation ne prouve
        pas une cause, et d’autres choses peuvent changer ces jours-là. Essayez une piste
        deux semaines et observez. Aucun comportement n’est jugé bon ou mauvais d’avance :
        quand vos données vont à l’inverse de l’hypothèse générale, la piste le dit.
      </p>
    </>
  )
}

/**
 * Pied de page (POL-7, SLOP-1b-6 : la mise en garde reste dans l'encart du haut) : une seule note « Comment c’est calculé » qui réunit
 * la méthode des liens, celle du bien-être estimé et le modèle de prédiction (calculé seulement à l’ouverture).
 */
function MethodFooter({ analysis, advanced, onOpenAdvanced }) {
  const correlationsOk = analysis.correlations.status !== 'not_enough_data'
  const faceOk = analysis.faceMood && analysis.faceMood.status !== 'no_face'
  // Données vierges : la carte lilas suffit, pas de note de méthode sur rien
  if (!correlationsOk && !faceOk) return null
  return (
    <footer className="reco-footer">
      <details className="reco-method-note">
        <summary>Comment c’est calculé</summary>
        {correlationsOk && <CorrelationMethod result={analysis.correlations} />}
        {faceOk && <FaceMoodMethod />}
        <details
          className="reco-method-note reco-model-note"
          onToggle={(e) => { if (e.currentTarget.open) onOpenAdvanced() }}
        >
          <summary>Le modèle qui prédit votre bien-être</summary>
          {advanced ? <AdvancedTab analysis={advanced} /> : <p>Calcul…</p>}
        </details>
      </details>
    </footer>
  )
}

// ─── Vue unique des analyses ────────────────────────────────────────────────

/** I86 : « 2 liens masqués · Tout réafficher », seulement s'il y a quelque chose de masqué parmi ce qui serait montré. */
function HiddenLine({ count, onUnhide }) {
  if (!count) return null
  return (
    <p className="reco-hidden-line" data-testid="reco-hidden-line">
      {count === 1 ? '1 lien masqué' : `${count} liens masqués`}
      <button type="button" className="reco-hide-btn" onClick={onUnhide}>Tout réafficher</button>
    </p>
  )
}

function AnalysisView({ analysis, teaserShown = false, advanced, onOpenAdvanced }) {
  const { correlations: result } = analysis
  const levers = result.status === 'not_enough_data' ? [] : result.levers ?? []
  // Données insuffisantes : seuls les liens du visage sont montrés, donc seules ses habitudes en attente
  const linkScope = result.status === 'not_enough_data' ? { faceMood: analysis.faceMood } : analysis
  const allLinks = mergeLinks(linkScope, new Set(levers.map((l) => l.variable)))
  const tagLines = pendingTagLines(linkScope, allLinks)
  // I86 : masquer ne change aucun calcul ; la carte lilas de l'Accueil suit (résumé réécrit)
  const [hidden, setHidden] = useState(getHiddenLinks)
  const onHide = (key) => {
    setHidden(hideLink(key))
    rememberPistesSummary(analysis)
  }
  const onUnhide = () => {
    setHidden(unhideAllLinks())
    rememberPistesSummary(analysis)
  }
  const shownLevers = levers.filter((l) => !hidden.includes(l.variable))
  const hiddenCount = (levers.length - shownLevers.length) + allLinks.filter((l) => hidden.includes(l.key)).length
  const hiddenLine = <HiddenLine count={hiddenCount} onUnhide={onUnhide} />
  const soon = soonLines(analysis, tagLines)

  if (result.status === 'not_enough_data') {
    return (
      <div data-testid="reco-basic-waiting">
        {/* VC-12 : sous la carte lilas, un seul seuil visible ; celui du bien-être passe dans ses « détails » */}
        {!teaserShown && <NotEnoughData currentDays={result.currentDays} minDays={result.minDays} />}
        {analysis.faceMood?.status === 'ok' && (
          <LinksSection analysis={{ faceMood: analysis.faceMood }} hidden={hidden} onHide={onHide} />
        )}
        {hiddenLine}
        {/* Habitudes et effets décalés attendent les mêmes notes que la carte lilas : seul le visage a son compteur */}
        <SoonSection
          lines={soon.filter((l) => l.id === 'face' || l.id.startsWith('tag:'))}
        />
        <MealHoursHorizon result={analysis.mealHours} />
        <WellbeingWeeks weeks={analysis.wellbeingWeeks} />
        <MethodFooter analysis={analysis} advanced={advanced} onOpenAdvanced={onOpenAdvanced} />
      </div>
    )
  }

  const lagByVariable = new Map(
    (analysis.laggedEffects?.status === 'ok' ? analysis.laggedEffects.effects : []).map((e) => [e.variable, e]),
  )

  return (
    <div className="reco-tab-content">
      {result.reliability === 'exploratory' && (
        <p className="reco-reliability-warn reco-explore">
          Données exploratoires : continuez à noter votre bien-être (objectif : 10 jours).
        </p>
      )}

      {/* ANALYSES-ONGLETS-5 : à l'échelle des heures, les lectures du visage autour des repas */}
      <MealHoursHorizon result={analysis.mealHours} />

      {/* ANALYSES-ONGLETS-3 : pistes et liens du bien-être comparent le jour même ou 1 à 3 jours de délai */}
      <HorizonHeading id="days" />

      <section className="reco-section">
        <h3 className="reco-section-title">Pistes à tester</h3>
        {/* ANALYSES-ONGLETS-4 : ce qui distingue une piste d'un lien, en une ligne */}
        <p className="reco-section-hint" data-testid="reco-levers-hint">
          Les liens les plus nets avec votre bien-être, sur ce que vous pouvez changer.
        </p>
        {shownLevers.length > 0 ? (
          <ol className="reco-advice-list">
            {shownLevers.map((l, i) => (
              <LeverCard
                key={l.variable}
                rank={i + 1}
                lever={l}
                lag={lagByVariable.get(l.variable)}
                onHide={() => onHide(l.variable)}
              />
            ))}
          </ol>
        ) : levers.length > 0 ? (
          <p className="reco-empty-levers">Vous avez masqué toutes les pistes.</p>
        ) : (
          <p className="reco-empty-levers">
            Aucune piste ne se dégage encore nettement de vos données : les liens observés
            peuvent être dus au hasard. Continuez à noter votre bien-être chaque jour.
          </p>
        )}
      </section>

      <LinksSection analysis={analysis} levers={levers} hidden={hidden} onHide={onHide} />

      {hiddenLine}

      <SoonSection lines={soon} />

      <WellbeingWeeks weeks={analysis.wellbeingWeeks} />

      <MethodFooter analysis={analysis} advanced={advanced} onOpenAdvanced={onOpenAdvanced} />
    </div>
  )
}

// ─── Sous-onglet « Ventre » (retours du 04/11, point 4) ──────────────────────

/**
 * ANALYSES-ONGLETS-2 (retour (4) du 04/11) : le compte à rebours propre à chaque sous-onglet. Bien-être : jours avec
 * une note de bien-être (seuil des liens) ; Ventre : jours avec une note du ventre (seuil des pistes repas → ventre).
 * Plus de « jours avec un repas ou une note du ventre » sous Bien-être.
 */
const COUNTDOWN_TEXT = {
  wellbeing: {
    title: 'Vos pistes du bien-être arrivent dans',
    count: 'jours avec une note de bien-être',
    how: 'Notez votre bien-être depuis',
  },
  gut: {
    title: 'Vos pistes du ventre arrivent dans',
    count: 'jours avec une note du ventre',
    how: 'Notez votre ventre depuis',
  },
}

export function AnalysisCountdown({ domain, days, target }) {
  const text = COUNTDOWN_TEXT[domain]
  const done = Math.min(Math.max(days || 0, 0), target)
  const remaining = target - done
  return (
    <section className="today-card pistes-card reco-countdown" data-testid={`reco-countdown-${domain}`} aria-labelledby={`reco-countdown-${domain}-title`}>
      <DomainTag domain={domain} />
      <h3 id={`reco-countdown-${domain}-title`} className="today-card-title">
        {text.title} {remaining} jour{remaining > 1 ? 's' : ''}
      </h3>
      <div className="pistes-progress" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={done} aria-label={text.count}>
        <div className="pistes-progress-bar" style={{ width: `${(done / target) * 100}%` }} />
      </div>
      <p className="pistes-count">
        <span className="mono">{done}/{target}</span> {text.count}
      </p>
      {/* COUNTDOWN-LIEN : la carte où noter, à un geste */}
      <p className="today-card-text">
        {text.how} <Link to="/">la carte de l’Accueil</Link>. Avec moins de jours, les résultats seraient surtout dus au hasard.
      </p>
    </section>
  )
}

/**
 * Seulement le ventre : les pistes aliment → ventre, la réintroduction, les semaines du ventre et le rapport PDF. Les pistes du bien-être
 * restent sous « Bien-être » ; rien n'est recalculé, la même analyse sert les deux sous-onglets.
 */
function GutView({ analysis, showGut }) {
  const [hidden, setHidden] = useState(getHiddenLinks)
  if (!showGut) {
    return (
      <p className="reco-intro" data-testid="gut-off">
        Le suivi du ventre est masqué. Pour le retrouver : Paramètres → <Link to="/settings">Ce qui vous amène</Link>.
      </p>
    )
  }
  const onHide = (key) => {
    setHidden(hideLink(key))
    rememberPistesSummary(analysis)
  }
  const onUnhide = () => {
    setHidden(unhideAllLinks())
    rememberPistesSummary(analysis)
  }
  const gut = analysis.gut
  const gutLinks = gut?.status === 'links' ? gut.links : []
  const hiddenCount = new Set(gutLinks.map(gutLinkKey).filter((k) => hidden.includes(k))).size
  const waiting = !gut || gut.status === 'no_notes' || gut.status === 'too_early'
  return (
    <div className="reco-tab-content" data-testid="reco-gut-view">
      <p className="reco-intro reco-intro--gut">Ce qui va avec vos jours de gêne ou de douleur, d’après vos notes du ventre et vos repas.</p>
      {waiting && <AnalysisCountdown domain="gut" days={gut?.noteDays ?? 0} target={gut?.minDays ?? GUT_LINKS_MIN_DAYS} />}
      <GutLinks gut={gut} hidden={hidden} onHide={onHide} />
      <ReintroductionEntry />
      <HiddenLine count={hiddenCount} onUnhide={onUnhide} />
      <GutWeeks weeks={analysis.gutWeeks} />
      {/* Aucune note du ventre : ni rapport vide, ni « Débloquer », ni bloc « Bientôt », une phrase (POL-PLAY-VENTRE-BIENTOT) */}
      {gut && gut.status !== 'no_notes' ? (
        <DoctorReportCard />
      ) : (
        <p className="reco-report-later" data-testid="reco-report-later">
          Le rapport PDF pour votre médecin arrive avec votre première note du ventre.
        </p>
      )}
    </div>
  )
}

// ─── Advanced tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ analysis }) {
  const { result, totalDays } = analysis

  if (result.status === 'not_enough_data') {
    return (
      <NotEnoughData currentDays={result.currentDays} minDays={result.minDays} />
    )
  }

  const { datasetDays, modelInfo, featureImportance, topRecommendations, residuals } = result

  const r2Display = modelInfo?.r2 != null ? `${Math.round(modelInfo.r2 * 100)}%` : 'N/A'
  const r2LooDisplay = modelInfo?.r2_loo != null
    ? `${Math.round(modelInfo.r2_loo * 100)}%`
    : null
  const method = modelInfo?.method === 'ols_linear_regression'
    ? 'Régression linéaire multiple (OLS + Ridge)'
    : 'Corrélation de Pearson (fallback)'

  // Model reliability derived states
  const isModelUnreliable = modelInfo?.model_reliable === false
  const isModelReliable   = modelInfo?.model_reliable === true

  return (
    <div className="reco-tab-content">
      <p className="reco-meta">
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} notés</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}
        {modelInfo?.weekendEffect != null && ' · week-end pris en compte'}.
        {isModelUnreliable && (
          <> <span className="reco-reliability-warn">⚠ Modèle encore peu fiable (il prédit mal les jours qu’il n’a pas vus) : pistes à titre indicatif. Continuez à enregistrer vos données.</span></>
        )}
        {isModelReliable && (
          <> <span className="reco-reliability-ok">✓ Il prédit bien les jours qu’il n’a pas vus.</span></>
        )}
      </p>
        <details className="reco-method-note">
          <summary>Comment fonctionne ce modèle ?</summary>
          <p>
            Modèle : <em>{method}</em>, entraîné entièrement sur vos données locales.
            {modelInfo?.r2 != null && (
              <> R² entraînement : <strong>{r2Display}</strong>
              {r2LooDisplay != null && <> · R² LOO (hors-échantillon) : <strong>{r2LooDisplay}</strong></>}
              . Le premier mesure l’ajustement aux jours vus ; le R² LOO prédit chaque jour sans l’avoir vu :
              négatif ou bien plus bas, il signale un sur-apprentissage et le modèle est marqué peu fiable.</>
            )}
            {modelInfo?.overfit_risk && (
              <> <span className="reco-overfit-warn">⚠ Plus de variables que de jours : R² d’entraînement non fiable.</span></>
            )}
          </p>
          {modelInfo?.nFeaturesFinal != null && modelInfo?.nFeaturesCandidate != null && (
            <p>
              Variables retenues : <strong>{modelInfo.nFeaturesFinal}</strong> sur {modelInfo.nFeaturesCandidate}, les plus
              liées au bien-être sur les jours d’entraînement ({MAX_FEATURES} au plus, une pour{' '}
              {Math.round(1 / MAX_FEATURES_RATIO)} jours, mesurées au moins un jour sur deux ; un jour sans mesure compte
              comme un jour habituel). Deux variables corrélées à plus de {Math.round(COLLINEARITY_MAX_R * 100)} % (comme
              les pas et les calories d’activité) fausseraient l’estimation : seule la plus liée est gardée.
            </p>
          )}
          {modelInfo?.droppedCollinear?.length > 0 && (
            <p>
              Variables redondantes écartées :{' '}
              {modelInfo.droppedCollinear
                .map((d) => `${d.label} (≈ ${d.keptInsteadLabel})`)
                .join(', ')}
              .
            </p>
          )}
          <p>
            {modelInfo?.weekendEffect != null ? (
              <>
                Le week-end est une variable de contrôle : à habitudes égales,{' '}
                {Math.abs(modelInfo.weekendEffect) < 0.05
                  ? <>votre bien-être n’est <strong>pas différent le week-end</strong>.</>
                  : <>votre bien-être est estimé à <strong>{frDiff(modelInfo.weekendEffect)}{' '}
                    point{Math.abs(modelInfo.weekendEffect) >= 2 ? 's' : ''} le week-end</strong> par rapport à la semaine.</>}
                {' '}Cet effet n’est attribué à aucune habitude (sinon une habitude plus fréquente le samedi
                récupérerait le bien-être propre au week-end).
              </>
            ) : (
              <>Le week-end sera pris en compte dès {MIN_WEEKEND_DAYS} jours notés de chaque sorte.</>
            )}
          </p>
          {modelInfo?.method === 'ols_linear_regression' && (<>
          <p>
            Toutes les entrées sont regroupées par <strong>jour calendaire</strong> (somme pour les pas, calories et
            nutriments, moyenne pour le cœur et le bien-être). Les nutriments sont <strong>lissés sur{' '}
            {String(modelInfo.lagDays).replace('.', decimalMark())} jours</strong> : un repas compte pour les jours suivants, de moins en moins.
          </p>
          <p>
            La régularisation Ridge{modelInfo.lambda != null && <> (λ = {String(modelInfo.lambda).replace('.', decimalMark())})</>} est
            choisie par validation croisée : plus vos données sont bruitées, plus les effets sont prudemment réduits vers
            zéro. Seuls les effets d’au moins {String(MIN_ADVICE_EFFECT).replace('.', decimalMark())} écart-type deviennent des
            pistes. Le modèle est entraîné <strong>sans les {HOLD_OUT_DAYS} derniers jours</strong>, que « A-t-il vu
            juste ? » et l’« attendu d’après vos habitudes » des Tendances les estiment donc sans les avoir vus.
          </p>
          </>)}
        </details>


      {topRecommendations?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            Pistes suggérées par le modèle
          </h3>
          <p className="reco-section-hint">
            Facteurs sur lesquels vous pouvez agir : hypothèses tirées de vos données.
          </p>
          <ol className="reco-advice-list">
            {topRecommendations.map((advice, i) => (
              <AdviceCard key={i} rank={i + 1} advice={advice} />
            ))}
          </ol>
        </section>
      )}

      {featureImportance?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            Ce qui pèse le plus dans le modèle
          </h3>
          <p className="reco-section-hint">
            ▲ va avec un meilleur bien-être · ▼ avec un moins bon · le plus influent = 100 %.
          </p>
          <div className="reco-corr-chart">
            {featureImportance.map((f) => (
              <ImportanceBar
                key={f.variable}
                label={f.label}
                importance={f.importance}
                direction={f.direction}
              />
            ))}
          </div>
        </section>
      )}

      {residuals && residuals.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            A-t-il vu juste ?
          </h3>
          <p className="reco-section-hint">
            Votre bien-être des {HOLD_OUT_DAYS} derniers jours, prédit sans que le modèle les ait vus.
          </p>
          <div className="reco-residuals">
            {residuals.map((r) => {
              const [, m, d] = r.dateKey.split('-')
              const diff = r.actual - r.predicted
              return (
                <div key={r.dateKey} className="reco-residual-row">
                  <span className="reco-residual-date">{d}/{m}</span>
                  <span className="reco-residual-actual">Réel : <strong>{r.actual.toFixed(1).replace('.', decimalMark())}</strong></span>
                  <span className="reco-residual-pred">Prédit : <strong>{r.predicted.toFixed(1).replace('.', decimalMark())}</strong></span>
                  <span className={'reco-residual-diff ' + (diff >= 0 ? 'reco-diff-pos' : 'reco-diff-neg')}>
                    {formatSigned(diff, 1)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}

// ─── Debug panel (visible only in debug mode) ─────────────────────────────────

function RecoDebugPanel({ entries, totalDbCount }) {
  const byType = useMemo(() => {
    const map = {}
    for (const e of entries) map[e.type] = (map[e.type] || 0) + 1
    return map
  }, [entries])

  const wellbeingByDay = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (e.type !== 'wellbeing' || !e.at) continue
      const dk = localDateKey(e.at)
      if (!map[dk]) map[dk] = []
      map[dk].push({ score: e.payload?.score, at: e.at })
    }
    return map
  }, [entries])

  const allDays = useMemo(() => {
    const set = new Set(entries.filter((e) => e.at).map((e) => localDateKey(e.at)))
    return [...set].sort()
  }, [entries])

  const wellbeingDaysSorted = Object.keys(wellbeingByDay).sort()
  const dailyDataset = useMemo(() => buildDailyDataset(entries), [entries])

  return (
    <details className="reco-debug-panel" open>
      <summary className="reco-debug-title">Debug : données Recommandations</summary>
      <div className="reco-debug-body">
        <p><strong>Total entrées en base (DB) :</strong> {totalDbCount ?? '…'}</p>
        <p><strong>Total entrées chargées (après limites par type) :</strong> {entries.length}</p>
        <p><strong>Jours calendaires (toutes données) :</strong> {allDays.length} — [{allDays.join(', ')}]</p>
        <p><strong>Jours avec score bien-être :</strong> {wellbeingDaysSorted.length}</p>
        <p><strong>Jours dans buildDailyDataset() :</strong> {dailyDataset.length}</p>

        <p><strong>Entrées par type :</strong></p>
        <ul>
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
            <li key={t}>{t} : {c}</li>
          ))}
        </ul>

        <p><strong>Détail jours bien-être :</strong></p>
        <ul>
          {wellbeingDaysSorted.map((day) => {
            const records = wellbeingByDay[day]
            return (
              <li key={day}>
                {day} — {records.length} entrée(s), scores : [{records.map((r) => r.score).join(', ')}]
                , heures UTC : [{records.map((r) => new Date(r.at).toISOString().slice(11, 16)).join(', ')}]
              </li>
            )
          })}
        </ul>

        <p><strong>Jours sans bien-être (données manquantes pour le modèle) :</strong></p>
        <ul>
          {allDays.filter((d) => !wellbeingByDay[d]).map((d) => {
            const dayEntries = entries.filter((e) => e.at && localDateKey(e.at) === d)
            const typeCounts = {}
            for (const e of dayEntries) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
            return (
              <li key={d}>{d} — {Object.entries(typeCounts).map(([t, c]) => `${t}:${c}`).join(', ')}</li>
            )
          })}
        </ul>
      </div>
    </details>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

const TAB_TASKS = { basic: 'basicAnalysis', advanced: 'advancedAnalysis' }

/** Ligne mono d'en-tête : sur combien de jours porte l'analyse (« à garder en tête », retour du 24/10). */
function analysisMetaLine(analysis) {
  const r = analysis?.correlations
  if (!r || r.status === 'not_enough_data') return null
  const parts = [`analyse sur ${r.datasetDays} jour${r.datasetDays > 1 ? 's' : ''} notés`]
  if (analysis.totalDays > r.datasetDays) parts.push(`${analysis.totalDays} jours de données`)
  return parts.join(' · ')
}

export default function Recommendations({ view = 'wellbeing' }) {
  useAutoSync()

  // Une seule analyse à l'écran (POL-7). Le modèle de prédiction (ex-« analyse avancée ») n'est calculé, dans un
  // Web Worker et avec le même cache (perf D2), que si l'on ouvre sa note en bas de page.
  const [analyses, setAnalyses] = useState(() => ({ basic: peekAnalysis('basicAnalysis').result ?? null }))
  const [wantAdvanced, setWantAdvanced] = useState(false)
  const [debugEntries, setDebugEntries] = useState([])
  const [totalDbCount, setTotalDbCount] = useState(null)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const debugMode = isDebugModeEnabled()
  // Comme la carte « Votre ventre » de l'Accueil (POL-4) : seulement pour qui suit son ventre
  const [showGut] = useState(() => gutCardMode() !== 'hide')

  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])

  useEffect(() => {
    let alive = true
    const tabs = wantAdvanced ? ['basic', 'advanced'] : ['basic']
    for (const tab of tabs) {
      // Déjà calculé et données inchangées : servi par le cache, sans recalcul
      getAnalysis(TAB_TASKS[tab])
        .then((result) => {
          if (!alive) return
          setAnalyses((a) => ({ ...a, [tab]: result }))
          // POL-PLAY-21 : la carte lilas de l'Accueil annonce ces pistes sans recalculer
          if (tab === 'basic') rememberPistesSummary(result)
        })
        .catch((e) => {
          if (alive) setError(e.message)
        })
    }
    return () => {
      alive = false
    }
  }, [wantAdvanced, revision])

  useEffect(() => {
    if (!debugMode) return
    let alive = true
    Promise.all([listEntriesForAnalysis(), countAllEntries()])
      .then(([data, dbTotal]) => {
        if (!alive) return
        setDebugEntries(data)
        setTotalDbCount(dbTotal)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [debugMode, revision])

  const current = analyses.basic
  const loading = current == null && !error
  // Rien à montrer encore (VC-2) : la même carte lilas que l'Accueil, sans seuils techniques
  const gutView = view === 'gut'
  const waiting = !gutView && current?.correlations?.status === 'not_enough_data'
  const meta = gutView ? null : analysisMetaLine(current)

  return (
    <section className="reco-page">
      <AnalysesTabs />
      {meta && <p className="reco-meta-line">{meta}</p>}
      <h2 className="page-title">Vos analyses</h2>
      {/* Données vierges : la carte lilas seule (rien à nuancer encore) */}
      {current && !waiting && !gutView && (
        <p className="reco-intro">
          Des liens repérés dans vos données, à vérifier avant d’y croire.
        </p>
      )}

      {waiting && (
        <AnalysisCountdown domain="wellbeing" days={current.correlations.currentDays} target={current.correlations.minDays} />
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Calcul des analyses…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {!loading && !error && gutView && <GutView analysis={current} showGut={showGut} />}

      {!loading && !error && !gutView && (
        <>
          {debugMode && <RecoDebugPanel entries={debugEntries} totalDbCount={totalDbCount} />}
          {/* Le ventre a son sous-onglet (04/11 (4)) : ici, seulement le bien-être */}
          <AnalysisView
            analysis={current}
            teaserShown={waiting}
            advanced={analyses.advanced}
            onOpenAdvanced={() => setWantAdvanced(true)}
          />
        </>
      )}
    </section>
  )
}
