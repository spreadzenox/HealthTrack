import { useState, useEffect, useMemo } from 'react'
import SoonList from '../components/SoonList'
import { listEntriesForAnalysis, countAllEntries } from '../storage/localHealthStorage'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
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
} from '../services/analysisEngine'
import { MIN_TAG_DAYS, AUTO_LATE_SCREEN_MIN, EVENING_SPORT_FROM_HOUR, LATE_MEAL_FROM_HOUR } from '../services/behaviorTags'
import { LAGS, MIN_LAG_PAIRS } from '../services/laggedEffects'
import { FACE_MOOD_MIN_DAYS, FACE_MOOD_MIN_READINGS } from '../services/mood/faceMoodDays'
import { isDebugModeEnabled } from '../settings/debugMode'
import { formatSigned, evidenceLabel } from '../utils/format'
import { correlationStrength } from '../services/statistics'
import { useAutoSync } from '../hooks/useAutoSync'
import { useDetailsMode } from '../hooks/useDetailsMode'
import { PistesTeaser } from '../components/TodayCards'
import DetailsToggle from '../components/DetailsToggle'
import GutLinks from '../components/GutLinks'
import { gutCardMode, homeFocus } from '../settings/onboarding'
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
  personal: { evidence: 'solide', note: 'Lien net chez vous : il tient même en comptant tous les facteurs examinés.' },
  toVerify: { evidence: 'à confirmer', note: 'Peut-être encore le hasard : quelques jours de plus le diront.' },
}

/** POL-7b : la piste en mots d'abord ; r, jours indépendants et week-end derrière le chevron. */
function LeverCard({ rank, lever, lag }) {
  const [open, setOpen] = useState(false)
  const days = Math.round(lever.nEff)
  const weekendShift = lever.rRaw != null && Math.abs(lever.rRaw - lever.r) >= WEEKEND_R_SHIFT
  const stage = LEVER_STAGE[lever.stage]
  const toVerify = lever.stage === 'toVerify'
  return (
    <li className={'reco-advice-card' + (toVerify ? ' reco-advice-card--verify' : '')}>
      <span className="reco-advice-rank">{toVerify ? '?' : rank}</span>
      <div className="reco-advice-content">
        <p className="reco-advice-text">{lever.action}</p>
        {lever.againstNorm && <AgainstNormNote />}
        <p className="reco-advice-impact">
          {toVerify ? 'Lien possible' : `Lien ${lever.strength}`} avec votre bien-être
        </p>
        <EvidenceBadge evidence={stage?.evidence ?? lever.evidence} />
        {open && stage && <p className="reco-advice-stats">{stage.note}</p>}
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
      </div>
      <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
    </li>
  )
}

// ─── Behaviour tags (« jours avec / sans ») ──────────────────────────────────

function frScore(v, digits = 1) {
  return v.toFixed(digits).replace('.', ',')
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
 * entier, une phrase, une ligne de chiffres en mono, la solidité.
 */
function LinkCard({ kind, name, children, meta, evidence, extra }) {
  return (
    <li className={`reco-link-card reco-link-card--${kind}` + (evidence === 'incertain' ? ' reco-link-card-uncertain' : '')}>
      <p className="reco-link-name">{name}</p>
      {children}
      {meta && <p className="reco-link-meta">{meta}</p>}
      <EvidenceBadge evidence={evidence} />
      {extra}
    </li>
  )
}

function TagEffectCard({ effect, measure = 'bien-être', extra }) {
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
    <LinkCard kind="tag" name={effect.label} meta={meta} evidence={effect.evidence} extra={extra}>
      <p className="reco-link-text">
        {when} : {measure} {frScore(effect.meanWith)} / 5 contre {frScore(effect.meanWithout)} sans{' '}
        <Delta value={shown} />
      </p>
    </LinkCard>
  )
}

// ─── Lagged effects (« la veille », « 2 jours avant ») ───────────────────────

function LaggedEffectCard({ effect, measure = 'bien-être du jour', extra }) {
  return (
    <LinkCard
      kind="lag"
      name={effect.label}
      meta={`Lien ${effect.strength} · r = ${formatR(effect.r)} · ≈ ${Math.round(effect.nEff)} jours indépendants`}
      evidence={effect.evidence}
      extra={extra}
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

function CorrelationCard({ item, measure = 'bien-être', extra }) {
  const meta = [`Lien ${item.strength ?? correlationStrength(item.r)}`, `r = ${formatR(item.r)}`]
  if (item.nEff != null) meta.push(`≈ ${Math.round(item.nEff)} jours indépendants`)
  return (
    <LinkCard kind="corr" name={item.label} meta={meta.join(' · ')} evidence={item.evidence} extra={extra}>
      <p className="reco-link-text">
        Le jour même : plus c’est élevé, {item.r >= 0 ? 'meilleur' : 'moins bon'} est votre {measure}
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
function wellbeingWaitLine({ currentDays = 0, minDays }) {
  return `liens avec le bien-être : ${Math.min(currentDays, minDays)}/${minDays} jours avec une note de bien-être («\u00a0Noter moi-même\u00a0»)`
}

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

/** Un même facteur sous deux noms (variable continue et tag) : un seul verdict (POL-7c). */
const FACTOR_ALIAS = { alcohol_g: 'alcohol', screen_late_minutes: 'late_screen' }

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
  add('notes', lags(laggedEffects), 'lag', (e) => e.variable)
  if (faceMood?.status === 'ok') {
    add('visage', okCorr(faceMood.correlations), 'corr', corrKey)
    add('visage', tags(faceMood.tagEffects), 'tag', (e) => e.tagId)
    add('visage', lags(faceMood.laggedEffects), 'lag', (e) => e.variable)
  }
  const leverKeys = new Set([...leverVariables].map((v) => FACTOR_ALIAS[v] ?? v))
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
function AlsoLine({ others }) {
  const clear = others.filter((o) => o.item.evidence !== 'incertain')
  if (!clear.length) return null
  const parts = [...new Set(clear.map((o) => `${KIND_LABEL[o.kind]} (${o.source}) ${evidenceLabel(o.item.evidence).toLowerCase()}`))]
  return <p className="reco-link-also">Autres mesures : {parts.join(' · ')}</p>
}

function SourceChip({ source }) {
  return source === 'visage' ? <span className="reco-link-src">visage</span> : null
}

function LinkItem({ link }) {
  const { kind, source, item, others } = link
  const face = source === 'visage'
  const extra = (
    <>
      <SourceChip source={source} />
      <AlsoLine others={others} />
    </>
  )
  if (kind === 'tag') return <TagEffectCard effect={item} measure={face ? 'bien-être estimé' : 'bien-être'} extra={extra} />
  if (kind === 'lag') {
    // D6 : le bien-être estimé ne propose jamais de piste
    const effect = face ? { ...item, action: null } : item
    return <LaggedEffectCard effect={effect} measure={face ? 'bien-être estimé du jour' : 'bien-être du jour'} extra={extra} />
  }
  return <CorrelationCard item={item} measure={face ? 'bien-être estimé' : 'bien-être'} extra={extra} />
}

function pendingText(t) {
  if (t.weekendOnly) return `${t.label} (pas encore comparable : jours avec et sans jamais du même type, semaine ou week-end)`
  return `${t.label} (${Math.min(t.nWith, MIN_TAG_DAYS)}/${MIN_TAG_DAYS} jours avec${t.nWithout < MIN_TAG_DAYS ? `, ${t.nWithout}/${MIN_TAG_DAYS} sans` : ''})`
}

/**
 * « Autres liens repérés » (POL-7c, maquette I163 §4) : une seule liste, un verdict par facteur, les liens nets
 * d'abord (5 visibles, puis « Voir N autres liens »), les incertains repliés.
 */
function LinksSection({ analysis, levers = [] }) {
  const leverVariables = new Set(levers.map((l) => l.variable))
  const links = mergeLinks(analysis, leverVariables)
  const pending = [
    ...(analysis.tagEffects?.status === 'ok' ? analysis.tagEffects.pending : []),
    ...(analysis.faceMood?.status === 'ok' && analysis.faceMood.tagEffects?.status === 'ok'
      ? analysis.faceMood.tagEffects.pending.filter((t) => !t.weekendOnly)
      : []),
  ].filter((t, i, all) => all.findIndex((u) => u.tagId === t.tagId) === i)
  if (!links.length && !pending.length) return null
  const clear = links.filter((l) => l.item.evidence !== 'incertain')
  const uncertain = links.filter((l) => l.item.evidence === 'incertain')
  const list = (ls) => (
    <ul className="reco-link-list">
      {ls.map((l) => (
        <LinkItem key={`${l.kind}:${l.source}:${l.key}`} link={l} />
      ))}
    </ul>
  )
  const more = clear.length - LINKS_SHOWN
  const faceDays = analysis.faceMood?.status === 'ok' ? analysis.faceMood.faceDays : null
  return (
    <section className="reco-section" data-testid="reco-links">
      <h3 className="reco-section-title">{leverVariables.size > 0 ? 'Autres liens repérés' : 'Liens repérés'}</h3>
      {faceDays != null && (
        <p className="reco-section-hint">« visage » : avec votre bien-être estimé, sur {faceDays} jours, sans aucune note.</p>
      )}
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
            {uncertain.length === 1 ? 'Voir le lien incertain' : `Voir les ${uncertain.length} liens incertains`}
          </summary>
          <p className="reco-section-hint">Trop tôt pour dire : peut-être le hasard.</p>
          {list(uncertain)}
        </details>
      )}
      {pending.length > 0 && (
        <p className="reco-tag-pending">En cours de collecte : {pending.map(pendingText).join(' · ')}</p>
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
        Chaque jour avec au moins {FACE_MOOD_MIN_READINGS} lectures au déverrouillage reçoit un bien-être estimé
        (médiane de ses lectures), comparée à chaque facteur comme une note donnée à la dernière lecture : avant{' '}
        {DAY_OVER_HOUR} h, ce que vous faites après elle ne compte pas. Mêmes garde-fous que pour vos notes :
        week-end pris en compte, jours qui se ressemblent, nombre de facteurs testés. Le bien-être estimé ne
        vient que de votre visage (et de vos notes si vous en donnez) : aucun de ces facteurs ne sert à
        l’estimer, sinon le lien serait circulaire.
      </p>
      <p>
        Habitudes : bien-être estimé les jours avec chaque tag (ceux de vos notes, ou mesurés par le téléphone)
        contre les jours sans, le lendemain pour le soir ; le stress ressenti fait partie du bien-être, il
        n’est jamais comparé. Effets décalés : ce que vous avez fait {LAGS[0]} à {LAGS[LAGS.length - 1]} jours
        avant, à bien-être de la veille égal, liens solides seulement.
      </p>
      <p>
        C’est une estimation, moins précise qu’une note : un lien est une hypothèse à observer, pas une
        cause, et aucun comportement n’est jugé bon ou mauvais d’avance.
      </p>
    </>
  )
}

// ─── Bientôt : ce qui attend encore des données ──────────────────────────────

/**
 * Une ligne discrète par bloc qui n'a pas encore assez de données (POL-7) : jamais une carte presque vide.
 * Rien n'est calculé ici, seuls les compteurs déjà rendus par les analyses sont repris.
 */
function soonLines({ faceMood, tagEffects, laggedEffects, gut } = {}, showGut = false) {
  const lines = []
  // Aucune note du ventre : la carte lilas suffit (un seul seuil visible, VC-12)
  if (showGut && gut?.status === 'too_early') {
    lines.push({ id: 'gut', label: 'Votre ventre et vos repas', progress: `${Math.min(gut.noteDays, gut.minDays)}/${gut.minDays} jours` })
  }
  if (faceMood && faceMood.status !== 'ok' && faceMood.status !== 'no_face') {
    lines.push({
      id: 'face',
      label: 'Avec votre bien-être estimé',
      progress: `${Math.min(faceMood.currentDays ?? 0, FACE_MOOD_MIN_DAYS)}/${FACE_MOOD_MIN_DAYS} jours`,
    })
  }
  if (tagEffects?.status === 'no_tags') {
    lines.push({ id: 'tags', label: 'Vos habitudes', progress: 'ajoutez des tags à vos notes' })
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
        Tags : bien-être les jours avec chaque tag comparé aux jours sans ; pour les
        habitudes du soir, c’est le lendemain qui compte. Les week-ends sont comparés aux
        week-ends et les jours de semaine entre eux. Le stress ressenti fait partie de votre
        bien-être : il n’est pas présenté comme sa cause.
      </p>
      <p>
        Liens « la veille » ou « 2 jours avant » : bien-être comparé à ce que vous avez fait {LAGS[0]} à {LAGS[LAGS.length - 1]} jours
        avant, à bien-être de la veille égal (une bonne passe qui dure n’est pas créditée à
        vos comportements) et à journée égale (sommeil, pas… du jour même).
      </p>
      <p>
        Pistes : « Chez vous » quand le lien tient même en comptant tous les facteurs testés
        (q &lt; {LEVER_PERSONAL_Q.toString().replace('.', ',')}) ; au plus une « À vérifier » quand il est plus fragile (q &lt; {LEVER_MAX_Q.toString().replace('.', ',')}).
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
 * Pied de page (POL-7) : la mise en garde en petit, puis une seule note « Comment c’est calculé » qui réunit
 * la méthode des liens, celle du bien-être estimé et le modèle de prédiction (calculé seulement à l’ouverture).
 */
function MethodFooter({ analysis, advanced, onOpenAdvanced }) {
  const correlationsOk = analysis.correlations.status !== 'not_enough_data'
  const faceOk = analysis.faceMood && analysis.faceMood.status !== 'no_face'
  // Données vierges : la carte lilas suffit, pas de note de méthode sur rien
  if (!correlationsOk && !faceOk) return null
  return (
    <footer className="reco-footer">
      <p className="reco-disclaimer">
        Hypothèses tirées de vos seules données, calculées sur votre téléphone : pas un avis médical.
      </p>
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

function AnalysisView({ analysis, teaserShown = false, advanced, onOpenAdvanced, showGut = false }) {
  const { correlations: result } = analysis
  const soon = soonLines(analysis, showGut)
  const gut = showGut ? <GutLinks gut={analysis.gut} /> : null

  if (result.status === 'not_enough_data') {
    return (
      <div data-testid="reco-basic-waiting">
        {/* VC-12 : sous la carte lilas, un seul seuil visible ; celui du bien-être passe dans ses « détails » */}
        {!teaserShown && <NotEnoughData currentDays={result.currentDays} minDays={result.minDays} />}
        {gut}
        {analysis.faceMood?.status === 'ok' && (
          <LinksSection analysis={{ faceMood: analysis.faceMood }} />
        )}
        {/* Habitudes et effets décalés attendent les mêmes notes que la carte lilas : seul le visage a son compteur */}
        <SoonSection lines={soon.filter((l) => l.id === 'face' || l.id === 'gut')} />
        <MethodFooter analysis={analysis} advanced={advanced} onOpenAdvanced={onOpenAdvanced} />
      </div>
    )
  }

  const levers = result.levers ?? []
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

      {gut}

      <section className="reco-section">
        <h3 className="reco-section-title">Pistes à tester</h3>
        <p className="reco-section-hint">
          Ce qui va de pair avec un meilleur bien-être dans vos données, et sur quoi vous pouvez agir.
        </p>
        {levers.length > 0 ? (
          <ol className="reco-advice-list">
            {levers.map((l, i) => (
              <LeverCard key={l.variable} rank={i + 1} lever={l} lag={lagByVariable.get(l.variable)} />
            ))}
          </ol>
        ) : (
          <p className="reco-empty-levers">
            Aucune piste ne se dégage encore nettement de vos données : les liens observés
            peuvent être dus au hasard. Continuez à noter votre bien-être chaque jour.
          </p>
        )}
      </section>

      <LinksSection analysis={analysis} levers={levers} />

      <SoonSection lines={soon} />

      <MethodFooter analysis={analysis} advanced={advanced} onOpenAdvanced={onOpenAdvanced} />
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
              <> <span className="reco-overfit-warn">⚠ Plus de variables que de jours — R² entraînement non fiable.</span></>
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
            {String(modelInfo.lagDays).replace('.', ',')} jours</strong> : un repas compte pour les jours suivants, de moins en moins.
          </p>
          <p>
            La régularisation Ridge{modelInfo.lambda != null && <> (λ = {String(modelInfo.lambda).replace('.', ',')})</>} est
            choisie par validation croisée : plus vos données sont bruitées, plus les effets sont prudemment réduits vers
            zéro. Seuls les effets d’au moins {String(MIN_ADVICE_EFFECT).replace('.', ',')} écart-type deviennent des
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
                  <span className="reco-residual-actual">Réel : <strong>{r.actual.toFixed(1).replace('.', ',')}</strong></span>
                  <span className="reco-residual-pred">Prédit : <strong>{r.predicted.toFixed(1).replace('.', ',')}</strong></span>
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
      <summary className="reco-debug-title">🛠 Debug — Données Recommandations</summary>
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
  if (r.weekendControl?.applied) parts.push('week-end pris en compte')
  return parts.join(' · ')
}

export default function Recommendations() {
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
  const [details, toggleDetails] = useDetailsMode()
  const [focus] = useState(() => homeFocus())
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
          if (alive) setAnalyses((a) => ({ ...a, [tab]: result }))
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
  const waiting = current?.correlations?.status === 'not_enough_data'
  const meta = analysisMetaLine(current)

  return (
    <section className="reco-page">
      {meta && <p className="reco-meta-line">{meta}</p>}
      <h2 className="page-title">Vos analyses</h2>
      {/* Données vierges : la carte lilas seule (rien à nuancer encore) */}
      {current && !waiting && (
        <p className="reco-intro">
          Des liens repérés dans vos données, pas des causes ni un diagnostic.
        </p>
      )}

      {waiting && (
        <PistesTeaser
          focus={focus}
          details={details}
          onToggleDetails={toggleDetails}
          onPistesPage
          extraDetail={wellbeingWaitLine(current.correlations)}
        />
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Calcul des analyses…</p>
        </div>
      )}

      {error && <div className="error-msg" role="alert">{error}</div>}

      {!loading && !error && (
        <>
          {debugMode && <RecoDebugPanel entries={debugEntries} totalDbCount={totalDbCount} />}
          <AnalysisView
            analysis={current}
            teaserShown={waiting}
            advanced={analyses.advanced}
            onOpenAdvanced={() => setWantAdvanced(true)}
            showGut={showGut}
          />
        </>
      )}
    </section>
  )
}
