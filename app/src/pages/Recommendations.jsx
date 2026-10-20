import { useState, useEffect, useMemo } from 'react'
import { listEntriesForAnalysis, countAllEntries } from '../storage/localHealthStorage'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import {
  buildDailyDataset,
  localDateKey,
  MIN_DAYS_BASIC,
  MIN_DAYS_ADVANCED,
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
import { formatSigned, evidenceLabel, scoreDecimals } from '../utils/format'
import { useAutoSync } from '../hooks/useAutoSync'
import './Recommendations.css'

// ─── Correlation bar chart (SVG) ─────────────────────────────────────────────

function formatR(r) {
  return formatSigned(r, 2)
}

function CorrelationBar({ label, r, impact, uncertain }) {
  const pct = Math.round(Math.abs(impact) * 100)
  // Green = positive correlation with wellbeing, red = negative correlation.
  const isPositive = r >= 0
  return (
    <div className={'reco-corr-row' + (uncertain ? ' reco-corr-row-uncertain' : '')}>
      <span className="reco-corr-label">{label}</span>
      <div className="reco-corr-bar-wrap">
        <div
          className={'reco-corr-bar ' + (isPositive ? 'reco-corr-pos' : 'reco-corr-neg')}
          style={{ width: `${pct}%` }}
          aria-label={`${pct}%`}
        />
      </div>
      <span className="reco-corr-value">{formatR(r)}</span>
    </div>
  )
}

// ─── Importance bar (ML tab) ──────────────────────────────────────────────────

function ImportanceBar({ label, importance, direction }) {
  // importance is already normalised to [0,1] where 1 = strongest variable
  const pct = Math.round(importance * 100)
  return (
    <div className="reco-corr-row">
      <span className="reco-corr-label">{label}</span>
      <div className="reco-corr-bar-wrap">
        <div
          className={'reco-corr-bar ' + (direction === 'positive' ? 'reco-corr-pos' : 'reco-corr-neg')}
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

const EVIDENCE_CLASS = {
  solide: 'reco-evidence-solid',
  'à confirmer': 'reco-evidence-tentative',
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
  personal: { badge: 'Chez vous : lien net', className: 'reco-evidence-solid' },
  toVerify: { badge: 'À vérifier : peut-être le hasard', className: 'reco-evidence-tentative' },
}

function LeverCard({ rank, lever }) {
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
          {toVerify ? 'Lien possible' : `Lien ${lever.strength}`} avec votre bien-être (r = {formatR(lever.r)}, ≈ {days} jours indépendants)
          {weekendShift && <> · r = {formatR(lever.rRaw)} sans tenir compte du week-end</>}
        </p>
        {stage ? (
          <span className={'reco-evidence ' + stage.className}>{stage.badge}</span>
        ) : (
          <span className={'reco-evidence ' + (EVIDENCE_CLASS[lever.evidence] ?? '')}>
            {evidenceLabel(lever.evidence)}
          </span>
        )}
      </div>
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

function TagEffectCard({ effect }) {
  const when = effect.effectDay === 'next' ? 'Le lendemain' : 'Le jour même'
  const rawDiff = effect.diffRaw ?? effect.diff
  const weekendShift = Math.abs(effect.diff - rawDiff) >= TAG_WEEKEND_SHIFT
  const digits = scoreDecimals(effect.meanWith, effect.meanWithout, rawDiff)
  return (
    <li className={'reco-tag-card' + (effect.evidence === 'incertain' ? ' reco-tag-card-uncertain' : '')}>
      <p className="reco-tag-name">
        <span aria-hidden>{effect.emoji}</span> {effect.label}
      </p>
      <p className="reco-tag-compare">
        {when} : bien-être <strong>{frScore(effect.meanWith, digits)} / 5</strong> contre{' '}
        {frScore(effect.meanWithout, digits)} sans{' '}
        <span className={rawDiff < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
          ({formatSigned(rawDiff, digits)} point{Math.abs(rawDiff) >= 2 ? 's' : ''})
        </span>
      </p>
      {weekendShift && (
        <p className="reco-tag-compare">
          📅 Week-end comparé au week-end, semaine à la semaine :{' '}
          <span className={effect.diff < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
            {frDiff(effect.diff)} point{Math.abs(effect.diff) >= 2 ? 's' : ''}
          </span>
        </p>
      )}
      <p className="reco-tag-days">
        {effect.nWith} jour{effect.nWith > 1 ? 's' : ''} avec · {effect.nWithout} sans
        {effect.auto && ` · ${autoSourceNote(effect.tagId)}`}
      </p>
      <span className={'reco-evidence ' + (EVIDENCE_CLASS[effect.evidence] ?? '')}>
        {evidenceLabel(effect.evidence)}
      </span>
    </li>
  )
}

function TagsSection({ result }) {
  return (
    <section className="reco-section">
      <h3 className="reco-section-title">🏷️ Vos habitudes</h3>
      {result.status === 'no_tags' ? (
        <p className="reco-section-hint">
          Ajoutez des tags (alcool, café…) en notant votre bien-être : comparaison après{' '}
          {MIN_TAG_DAYS} jours avec et {MIN_TAG_DAYS} sans.
        </p>
      ) : (
        <>
          <p className="reco-section-hint">
            Bien-être les jours avec chaque tag, contre les jours sans (le lendemain pour le soir).
          </p>
          {result.effects.length > 0 ? (
            <ul className="reco-tag-list">
              {result.effects.map((e) => (
                <TagEffectCard key={e.tagId} effect={e} />
              ))}
            </ul>
          ) : (
            <p className="reco-empty-levers">
              Pas encore assez de jours pour comparer : il faut {MIN_TAG_DAYS} jours avec un tag
              et {MIN_TAG_DAYS} sans.
            </p>
          )}
          {result.pending.length > 0 && (
            <p className="reco-tag-pending">
              En cours de collecte :{' '}
              {result.pending
                .map((t) =>
                  t.weekendOnly
                    ? `${t.emoji} ${t.label} (pas encore comparable : jours avec et sans jamais du même type, semaine ou week-end)`
                    : `${t.emoji} ${t.label} (${Math.min(t.nWith, MIN_TAG_DAYS)}/${MIN_TAG_DAYS} jours avec${t.nWithout < MIN_TAG_DAYS ? `, ${t.nWithout}/${MIN_TAG_DAYS} sans` : ''})`,
                )
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </section>
  )
}

// ─── Lagged effects (« la veille », « 2 jours avant ») ───────────────────────

function LaggedEffectCard({ effect }) {
  const points = Math.abs(effect.effectPerSd) >= 2 ? 'points' : 'point'
  return (
    <li className={'reco-tag-card reco-lag-card' + (effect.evidence === 'incertain' ? ' reco-tag-card-uncertain' : '')}>
      <p className="reco-tag-name">{effect.label}</p>
      <p className="reco-tag-compare">
        {effect.when}, {effect.sdText} de plus que d’habitude → bien-être du jour{' '}
        <span className={effect.effectPerSd < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
          <strong>{frDiff(effect.effectPerSd)} {points}</strong>
        </span>
      </p>
      {effect.action && <p className="reco-tag-compare">🎯 Piste : {effect.action}</p>}
      {effect.action && effect.againstNorm && <AgainstNormNote />}
      <p className="reco-tag-days">
        Lien {effect.strength} (r = {formatR(effect.r)}, ≈ {Math.round(effect.nEff)} jours indépendants)
      </p>
      <span className={'reco-evidence ' + (EVIDENCE_CLASS[effect.evidence] ?? '')}>
        {evidenceLabel(effect.evidence)}
      </span>
    </li>
  )
}

function LaggedEffectsSection({ result }) {
  const lags = `${LAGS[0]} à ${LAGS[LAGS.length - 1]} jours`
  return (
    <section className="reco-section">
      <h3 className="reco-section-title">⏳ Effets décalés</h3>
      {result.status === 'not_enough_data' ? (
        <p className="reco-section-hint">
          Effet {lags} plus tard : {result.currentDays} sur {MIN_LAG_PAIRS} jours notés dont la
          veille aussi.
        </p>
      ) : (
        <>
          <p className="reco-section-hint">
            Ce que vous avez fait {lags} avant · liens solides seulement.
          </p>
          {result.effects.length > 0 ? (
            <ul className="reco-tag-list">
              {result.effects.map((e) => (
                <LaggedEffectCard key={e.variable} effect={e} />
              ))}
            </ul>
          ) : (
            <p className="reco-empty-levers">
              Aucun effet décalé net dans vos données pour l&apos;instant (sommeil, pas, activité et
              cigarettes testés {lags} avant, quand ils sont mesurés).
            </p>
          )}
        </>
      )}
    </section>
  )
}

// ─── Not enough data placeholder ─────────────────────────────────────────────

function NotEnoughData({ currentDays, minDays, tabLabel }) {
  const remaining = minDays - currentDays
  return (
    <div className="reco-not-enough">
      <div className="reco-not-enough-icon" aria-hidden>📊</div>
      <p className="reco-not-enough-title">
        Données insuffisantes pour les {tabLabel}
      </p>
      <p className="reco-not-enough-hint">
        {currentDays === 0
          ? `Enregistrez votre bien-être chaque jour pour activer cette fonctionnalité (les données alimentaires ou de sommeil seules ne suffisent pas).`
          : `Il manque encore ${remaining} jour${remaining > 1 ? 's' : ''} avec un score bien-être (vous en avez ${currentDays}). Pensez à enregistrer votre bien-être quotidiennement.`}
      </p>
      <p className="reco-not-enough-min">
        Seuil minimum : <strong>{minDays} jours</strong> avec score bien-être
      </p>
    </div>
  )
}

// ─── Week-end control note ───────────────────────────────────────────────────

function WeekendNote({ control }) {
  if (!control) return null
  if (!control.applied) {
    return (
      <p>
        📅 Pas encore assez de jours de week-end et de semaine notés ({MIN_WEEKEND_DAYS} de chaque)
        pour tenir compte du jour de la semaine.
      </p>
    )
  }
  return (
    <p>
      📅 Liens calculés en tenant compte du week-end (bien-être moyen :{' '}
      <strong>{frScore(control.weekendMean)} le week-end</strong>,{' '}
      <strong>{frScore(control.weekdayMean)} en semaine</strong>) : une habitude plus fréquente
      le samedi n'est pas créditée de la bonne humeur du week-end.
    </p>
  )
}

/**
 * Variables déjà présentées ailleurs dans l'onglet : « Écran tard » est comparé dans « Vos habitudes »
 * (soirées mesurées par le téléphone), ne pas le répéter en variable continue.
 */
const CHART_HIDDEN_VARIABLES = new Set(['screen_late_minutes'])

/**
 * Corrélations : les liens au moins « à confirmer » visibles, les incertains (souvent ~35 sur 45,
 * possiblement dus au hasard) repliés derrière « Voir les N liens incertains ». Une variable déjà
 * proposée en piste (même r) n'est pas répétée : la section devient « Autres liens ».
 */
function CorrelationsSection({ correlations, levers = [] }) {
  const leverVariables = new Set(levers.map((l) => l.variable))
  const shown = correlations.filter(
    (c) => !CHART_HIDDEN_VARIABLES.has(c.variable) && !leverVariables.has(c.variable),
  )
  if (shown.length === 0) return null
  const clear = shown.filter((c) => c.evidence !== 'incertain')
  const uncertain = shown.filter((c) => c.evidence === 'incertain')
  const others = leverVariables.size > 0
  const bars = (list) => (
    <div className="reco-corr-chart">
      {list.map((c) => (
        <CorrelationBar
          key={c.variable}
          label={c.label}
          r={c.r}
          impact={Math.abs(c.r)}
          uncertain={c.evidence === 'incertain'}
        />
      ))}
    </div>
  )
  return (
    <section className="reco-section">
      <h3 className="reco-section-title">📈 {others ? 'Autres liens' : 'Corrélations'} avec votre bien-être</h3>
      <p className="reco-section-hint">
        Vert = va de pair avec un meilleur bien-être · Rouge = avec un moins bon.
      </p>
      {clear.length > 0 ? bars(clear) : (
        <p className="reco-empty-levers">
          Aucun {others ? 'autre ' : ''}lien net pour l’instant : continuez à noter votre bien-être.
        </p>
      )}
      {uncertain.length > 0 && (
        <details className="reco-corr-more">
          <summary>
            {uncertain.length === 1 ? 'Voir le lien incertain' : `Voir les ${uncertain.length} liens incertains`}
          </summary>
          <p className="reco-section-hint">Barres pâles = lien incertain, possiblement dû au hasard.</p>
          {bars(uncertain)}
        </details>
      )}
    </section>
  )
}

/**
 * Facteurs comparés à l'humeur estimée par la Lecture du visage (mood/faceMoodDays.js) : la science personnelle sans
 * aucune note à saisir. Visible même sans notes ; rien tant qu'aucune lecture du visage n'existe.
 */
export function FaceMoodSection({ result }) {
  if (!result || result.status === 'no_face') return null
  const title = <h3 className="reco-section-title">🙂 Avec votre humeur estimée (visage)</h3>
  if (result.status !== 'ok') {
    const n = result.currentDays
    return (
      <section className="reco-section" data-testid="face-mood-section">
        {title}
        <p className="reco-section-hint">
          {n} jour{n > 1 ? 's' : ''} sur {FACE_MOOD_MIN_DAYS} avec au moins {FACE_MOOD_MIN_READINGS} lectures du
          visage au déverrouillage. Ensuite, votre sommeil, vos pas, votre écran, vos réseaux… seront comparés à
          votre humeur estimée, sans aucune note à donner.
        </p>
      </section>
    )
  }
  const shown = result.correlations.filter((c) => !CHART_HIDDEN_VARIABLES.has(c.variable))
  const clear = shown.filter((c) => c.evidence !== 'incertain')
  const uncertain = shown.filter((c) => c.evidence === 'incertain')
  const bars = (list) => (
    <div className="reco-corr-chart">
      {list.map((c) => (
        <CorrelationBar key={c.variable} label={c.label} r={c.r} impact={Math.abs(c.r)} uncertain={c.evidence === 'incertain'} />
      ))}
    </div>
  )
  return (
    <section className="reco-section" data-testid="face-mood-section">
      {title}
      <p className="reco-section-hint">
        Sur {result.faceDays} jours estimés par la Lecture du visage, sans aucune note. Vert = va de pair avec une
        meilleure humeur estimée · Rouge = avec une moins bonne.
      </p>
      {clear.length > 0 ? bars(clear) : (
        <p className="reco-empty-levers">Aucun lien net pour l’instant avec votre humeur estimée.</p>
      )}
      {uncertain.length > 0 && (
        <details className="reco-corr-more">
          <summary>
            {uncertain.length === 1 ? 'Voir le lien incertain' : `Voir les ${uncertain.length} liens incertains`}
          </summary>
          <p className="reco-section-hint">Barres pâles = lien incertain, possiblement dû au hasard.</p>
          {bars(uncertain)}
        </details>
      )}
      <details className="reco-method-note">
        <summary>Comment c&apos;est calculé</summary>
        <p>
          Chaque jour avec au moins {FACE_MOOD_MIN_READINGS} lectures au déverrouillage reçoit une humeur estimée
          (médiane de ses lectures), comparée à chaque facteur comme une note donnée à la dernière lecture : avant{' '}
          {DAY_OVER_HOUR} h, ce que vous faites après elle ne compte pas. Mêmes garde-fous que pour vos notes :
          week-end pris en compte, jours qui se ressemblent, nombre de facteurs testés. L&apos;humeur estimée ne
          vient que de votre visage (et de vos notes si vous en donnez) : aucun de ces facteurs ne sert à
          l&apos;estimer, sinon le lien serait circulaire.
        </p>
        <p>
          C&apos;est une estimation, moins précise qu&apos;une note : un lien est une hypothèse à observer, pas une
          cause, et aucun comportement n&apos;est jugé bon ou mauvais d&apos;avance.
        </p>
      </details>
    </section>
  )
}

// ─── Basic tab ────────────────────────────────────────────────────────────────

function BasicTab({ analysis }) {
  const { correlations: result, tagEffects, laggedEffects, totalDays } = analysis

  if (result.status === 'not_enough_data') {
    return (
      <>
        <NotEnoughData
          currentDays={result.currentDays}
          minDays={result.minDays}
          tabLabel="recommandations basiques"
        />
        <FaceMoodSection result={analysis.faceMood} />
      </>
    )
  }

  const { datasetDays, reliability, correlations } = result
  const levers = result.levers ?? []

  return (
    <div className="reco-tab-content">
      <p className="reco-meta">
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} notés</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}
        {result.weekendControl?.applied && ' · week-end pris en compte'}.
        {reliability === 'exploratory' && (
          <> <span className="reco-reliability-warn">⚠ Données exploratoires — continuez à enregistrer votre bien-être pour améliorer la fiabilité (objectif : 10 jours).</span></>
        )}
      </p>
      <details className="reco-method-note">
        <summary>Comment c&apos;est calculé</summary>
        <p>
          Corrélation de Pearson entre chaque variable et le bien-être, corrigée pour les jours qui
          se ressemblent (autocorrélation) et pour le nombre de variables testées
          (Benjamini-Hochberg). Un jour sans mesure (montre non portée, pas de pesée) est ignoré
          pour cette mesure, jamais compté comme 0. Un jour noté avant {DAY_OVER_HOUR} h, seuls les pas,
          séances, cigarettes et temps d&apos;écran d&apos;avant la note comptent : ce qui suit ne peut pas
          l&apos;expliquer.
          {result.nutritionDays != null && result.nutritionDays < datasetDays && (
            <>
              {' '}Alimentation connue sur {result.nutritionDays} jour{result.nutritionDays > 1 ? 's' : ''} sur {datasetDays} :
              un jour sans repas saisi ne compte pas comme 0 kcal (un oubli n'est pas un jeûne), et sans aucun
              repas saisi sur les 10 jours précédents, l'alimentation du jour est ignorée.
            </>
          )}
        </p>
        <WeekendNote control={result.weekendControl} />
        <p>
          Tags : bien-être les jours avec chaque tag comparé aux jours sans ; pour les
          habitudes du soir, c&apos;est le lendemain qui compte. Les week-ends sont comparés aux
          week-ends et les jours de semaine entre eux. Le stress ressenti fait partie de votre
          humeur : il n&apos;est pas présenté comme sa cause.
        </p>
        <p>
          Liens « la veille » ou « 2 jours avant » : bien-être comparé à ce que vous avez fait {LAGS[0]} à {LAGS[LAGS.length - 1]} jours
          avant, à bien-être de la veille égal (une bonne passe qui dure n&apos;est pas créditée à
          vos comportements) et à journée égale (sommeil, pas… du jour même).
        </p>
        <p>
          Pistes : « Chez vous » quand le lien tient même en comptant tous les facteurs testés
          (q &lt; {LEVER_PERSONAL_Q.toString().replace('.', ',')}) ; au plus une « À vérifier » quand il est plus fragile (q &lt; {LEVER_MAX_Q.toString().replace('.', ',')}).
        </p>
        <p>
          Tout est calculé sur votre téléphone. Ce sont des hypothèses : une corrélation ne prouve
          pas une cause, et d&apos;autres choses peuvent changer ces jours-là. Essayez une piste
          deux semaines et observez. Aucun comportement n&apos;est jugé bon ou mauvais d&apos;avance :
          quand vos données vont à l&apos;inverse de l&apos;hypothèse générale, la piste le dit.
        </p>
      </details>

      <section className="reco-section">
        <h3 className="reco-section-title">🎯 Pistes à tester</h3>
        <p className="reco-section-hint">
          Ce qui va de pair avec un meilleur bien-être dans vos données, et sur quoi vous pouvez agir.
        </p>
        {levers.length > 0 ? (
          <ol className="reco-advice-list">
            {levers.map((l, i) => (
              <LeverCard key={l.variable} rank={i + 1} lever={l} />
            ))}
          </ol>
        ) : (
          <p className="reco-empty-levers">
            Aucune piste ne se dégage encore nettement de vos données : les liens observés
            peuvent être dus au hasard. Continuez à noter votre bien-être chaque jour.
          </p>
        )}
      </section>

      <FaceMoodSection result={analysis.faceMood} />

      <TagsSection result={tagEffects} />

      <LaggedEffectsSection result={laggedEffects} />

      <CorrelationsSection correlations={correlations} levers={levers} />

      <p className="reco-disclaimer">
        Hypothèses tirées de vos seules données : pas un avis médical.
      </p>
    </div>
  )
}

// ─── Advanced tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ analysis }) {
  const { result, totalDays } = analysis

  if (result.status === 'not_enough_data') {
    return (
      <NotEnoughData
        currentDays={result.currentDays}
        minDays={result.minDays}
        tabLabel="recommandations avancées"
      />
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
              . Le premier mesure l&apos;ajustement aux jours vus ; le R² LOO prédit chaque jour sans l&apos;avoir vu :
              négatif ou bien plus bas, il signale un sur-apprentissage et le modèle est marqué peu fiable.</>
            )}
            {modelInfo?.overfit_risk && (
              <> <span className="reco-overfit-warn">⚠ Plus de variables que de jours — R² entraînement non fiable.</span></>
            )}
          </p>
          {modelInfo?.nFeaturesFinal != null && modelInfo?.nFeaturesCandidate != null && (
            <p>
              Variables retenues : <strong>{modelInfo.nFeaturesFinal}</strong> sur {modelInfo.nFeaturesCandidate}, les plus
              liées au bien-être sur les jours d&apos;entraînement ({MAX_FEATURES} au plus, une pour{' '}
              {Math.round(1 / MAX_FEATURES_RATIO)} jours, mesurées au moins un jour sur deux ; un jour sans mesure compte
              comme un jour habituel). Deux variables corrélées à plus de {Math.round(COLLINEARITY_MAX_R * 100)} % (comme
              les pas et les calories d&apos;activité) fausseraient l&apos;estimation : seule la plus liée est gardée.
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
                📅 Le week-end est une variable de contrôle : à habitudes égales,{' '}
                {Math.abs(modelInfo.weekendEffect) < 0.05
                  ? <>votre bien-être n&apos;est <strong>pas différent le week-end</strong>.</>
                  : <>votre bien-être est estimé à <strong>{frDiff(modelInfo.weekendEffect)}{' '}
                    point{Math.abs(modelInfo.weekendEffect) >= 2 ? 's' : ''} le week-end</strong> par rapport à la semaine.</>}
                {' '}Cet effet n&apos;est attribué à aucune habitude (sinon une habitude plus fréquente le samedi
                récupérerait l&apos;humeur propre au week-end).
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
            zéro. Seuls les effets d&apos;au moins {String(MIN_ADVICE_EFFECT).replace('.', ',')} écart-type deviennent des
            pistes. Le modèle est entraîné <strong>sans les {HOLD_OUT_DAYS} derniers jours</strong>, que « A-t-il vu
            juste ? » et la prédiction de l&apos;accueil prédisent donc sans les avoir vus.
          </p>
          </>)}
        </details>


      {topRecommendations?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            🤖 Pistes suggérées par le modèle
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
            🔬 Ce qui pèse le plus dans le modèle
          </h3>
          <p className="reco-section-hint">
            Vert = va avec un meilleur bien-être · rouge = moins bon · le plus influent = 100 %.
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
            📉 A-t-il vu juste ?
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

      <p className="reco-disclaimer">
        Hypothèses tirées de vos seules données, sur votre téléphone : pas un avis médical.
      </p>
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

const TABS = [
  { id: 'basic', label: 'Analyse simple', minDays: MIN_DAYS_BASIC },
  { id: 'advanced', label: 'Analyse avancée', minDays: MIN_DAYS_ADVANCED + HOLD_OUT_DAYS },
]

const TAB_TASKS = { basic: 'basicAnalysis', advanced: 'advancedAnalysis' }

export default function Recommendations() {
  useAutoSync()

  const [tab, setTab] = useState('basic')
  // Résultats par onglet, calculés dans un Web Worker et gardés en cache tant que les données ne
  // changent pas (perf D2) : un onglet déjà calculé s'affiche tout de suite.
  const [analyses, setAnalyses] = useState(() => ({ basic: peekAnalysis('basicAnalysis').result ?? null }))
  const [debugEntries, setDebugEntries] = useState([])
  const [totalDbCount, setTotalDbCount] = useState(null)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const debugMode = isDebugModeEnabled()

  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])

  useEffect(() => {
    let alive = true
    // Onglet déjà calculé et données inchangées : servi par le cache, sans recalcul
    getAnalysis(TAB_TASKS[tab])
      .then((result) => {
        if (alive) setAnalyses((a) => ({ ...a, [tab]: result }))
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
    }
  }, [tab, revision])

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

  const current = analyses[tab]
  const loading = current == null && !error

  return (
    <section className="reco-page">
      <h2 className="page-title">Analyses</h2>
      <p className="reco-intro">
        Ce qui va de pair avec votre <strong>bien-être</strong> dans vos données, calculé sur votre téléphone.
      </p>

      <nav className="reco-tabs" aria-label="Onglets recommandations">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'reco-tab-btn' + (tab === t.id ? ' reco-tab-btn-active' : '')}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
          >
            {t.label}
            <span className="reco-tab-min">≥ {t.minDays}j</span>
          </button>
        ))}
      </nav>

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
          {tab === 'basic' && <BasicTab analysis={current} />}
          {tab === 'advanced' && <AdvancedTab analysis={current} />}
        </>
      )}
    </section>
  )
}
