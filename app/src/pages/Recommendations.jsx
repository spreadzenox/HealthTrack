import { useState, useEffect, useMemo } from 'react'
import { listEntriesForAnalysis, countAllEntries } from '../storage/localHealthStorage'
import {
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  countTotalDataDays,
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
} from '../services/analysisEngine'
import { computeTagEffects, MIN_TAG_DAYS } from '../services/behaviorTags'
import { computeLaggedEffects, LAGS, MIN_LAG_PAIRS } from '../services/laggedEffects'
import { isDebugModeEnabled } from '../settings/debugMode'
import { formatSigned, evidenceLabel } from '../utils/format'
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

function LeverCard({ rank, lever }) {
  const days = Math.round(lever.nEff)
  const weekendShift = lever.rRaw != null && Math.abs(lever.rRaw - lever.r) >= WEEKEND_R_SHIFT
  return (
    <li className="reco-advice-card">
      <span className="reco-advice-rank">{rank}</span>
      <div className="reco-advice-content">
        <p className="reco-advice-text">{lever.action}</p>
        <p className="reco-advice-impact">
          Lien {lever.strength} avec votre bien-être (r = {formatR(lever.r)}, ≈ {days} jours indépendants)
          {weekendShift && <> · r = {formatR(lever.rRaw)} sans tenir compte du week-end</>}
        </p>
        <span className={'reco-evidence ' + (EVIDENCE_CLASS[lever.evidence] ?? '')}>
          {evidenceLabel(lever.evidence)}
        </span>
      </div>
    </li>
  )
}

// ─── Behaviour tags (« jours avec / sans ») ──────────────────────────────────

function frScore(v) {
  return v.toFixed(1).replace('.', ',')
}

function frDiff(v) {
  return formatSigned(v, 1)
}

// Show the week-end-controlled difference only when it really differs from the raw one.
const TAG_WEEKEND_SHIFT = 0.1

function TagEffectCard({ effect }) {
  const when = effect.effectDay === 'next' ? 'Le lendemain' : 'Le jour même'
  const rawDiff = effect.diffRaw ?? effect.diff
  const weekendShift = Math.abs(effect.diff - rawDiff) >= TAG_WEEKEND_SHIFT
  return (
    <li className={'reco-tag-card' + (effect.evidence === 'incertain' ? ' reco-tag-card-uncertain' : '')}>
      <p className="reco-tag-name">
        <span aria-hidden>{effect.emoji}</span> {effect.label}
      </p>
      <p className="reco-tag-compare">
        {when} : bien-être <strong>{frScore(effect.meanWith)} / 5</strong> contre{' '}
        {frScore(effect.meanWithout)} sans{' '}
        <span className={rawDiff < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
          ({frDiff(rawDiff)} point{Math.abs(rawDiff) >= 2 ? 's' : ''})
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
      </p>
      <span className={'reco-evidence ' + (EVIDENCE_CLASS[effect.evidence] ?? '')}>
        {evidenceLabel(effect.evidence)}
      </span>
    </li>
  )
}

function TagsSection({ entries }) {
  const result = useMemo(() => computeTagEffects(entries), [entries])
  return (
    <section className="reco-section">
      <h3 className="reco-section-title">🏷️ Vos habitudes</h3>
      {result.status === 'no_tags' ? (
        <p className="reco-section-hint">
          Ajoutez des tags (alcool, café après 14 h, écran tard, stress…) quand vous notez votre
          bien-être. Après {MIN_TAG_DAYS} jours avec et {MIN_TAG_DAYS} jours sans, vous verrez
          ici comment chacun va de pair avec votre bien-être.
        </p>
      ) : (
        <>
          <p className="reco-section-hint">
            Votre bien-être les jours avec chaque tag, comparé aux jours sans. Pour les habitudes
            du soir, c&apos;est le lendemain qui compte. Les week-ends sont comparés aux week-ends
            et les jours de semaine entre eux. Ce sont des hypothèses : d&apos;autres choses
            peuvent changer ces jours-là.
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
        {effect.when}, {effect.format(effect.sd)} de plus que d’habitude → bien-être du jour{' '}
        <span className={effect.effectPerSd < 0 ? 'reco-tag-diff-neg' : 'reco-tag-diff-pos'}>
          <strong>{frDiff(effect.effectPerSd)} {points}</strong>
        </span>
      </p>
      {effect.action && <p className="reco-tag-compare">🎯 Piste : {effect.action}</p>}
      <p className="reco-tag-days">
        Lien {effect.strength} (r = {formatR(effect.r)}, ≈ {Math.round(effect.nEff)} jours indépendants)
      </p>
      <span className={'reco-evidence ' + (EVIDENCE_CLASS[effect.evidence] ?? '')}>
        {evidenceLabel(effect.evidence)}
      </span>
    </li>
  )
}

function LaggedEffectsSection({ entries }) {
  const result = useMemo(() => computeLaggedEffects(entries), [entries])
  const lags = `${LAGS[0]} à ${LAGS[LAGS.length - 1]} jours`
  return (
    <section className="reco-section">
      <h3 className="reco-section-title">⏳ Effets décalés</h3>
      {result.status === 'not_enough_data' ? (
        <p className="reco-section-hint">
          Ce que vous faites (sommeil, pas, activité, cigarettes) peut agir sur votre bien-être
          {' '}{lags} plus tard. Il faut des notes de bien-être sur des jours qui se suivent :{' '}
          {result.currentDays} sur {MIN_LAG_PAIRS} pour l&apos;instant (un jour compte quand la
          veille est aussi notée).
        </p>
      ) : (
        <>
          <p className="reco-section-hint">
            Votre bien-être comparé à ce que vous avez fait {lags} avant, à bien-être de la veille
            égal (une bonne passe qui dure n&apos;est pas créditée à vos habitudes) et à journée
            égale (sommeil, pas… du jour même), week-end compris. Seuls les liens solides sont
            affichés. Ce sont des hypothèses : une corrélation ne prouve pas une cause.
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
      <p className="reco-meta">
        📅 Pas encore assez de jours de week-end et de semaine notés ({MIN_WEEKEND_DAYS} de chaque)
        pour tenir compte du jour de la semaine.
      </p>
    )
  }
  return (
    <p className="reco-meta">
      📅 Liens calculés en tenant compte du week-end (bien-être moyen :{' '}
      <strong>{frScore(control.weekendMean)} le week-end</strong>,{' '}
      <strong>{frScore(control.weekdayMean)} en semaine</strong>) : une habitude plus fréquente
      le samedi n'est pas créditée de la bonne humeur du week-end.
    </p>
  )
}

// ─── Basic tab ────────────────────────────────────────────────────────────────

function BasicTab({ entries }) {
  const result = useMemo(() => computeBasicCorrelations(entries), [entries])
  const totalDays = useMemo(() => countTotalDataDays(entries), [entries])

  if (result.status === 'not_enough_data') {
    return (
      <NotEnoughData
        currentDays={result.currentDays}
        minDays={result.minDays}
        tabLabel="recommandations basiques"
      />
    )
  }

  const { datasetDays, reliability, correlations } = result
  const levers = result.levers ?? []

  return (
    <div className="reco-tab-content">
      <p className="reco-meta">
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} avec score bien-être</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}.
        Méthode : corrélation de Pearson entre chaque variable et le bien-être, corrigée pour
        les jours qui se ressemblent (autocorrélation) et pour le nombre de variables testées
        (Benjamini-Hochberg). Un jour sans mesure (montre non portée, pas de pesée) est ignoré
        pour cette mesure, jamais compté comme 0.
        {result.nutritionDays != null && result.nutritionDays < datasetDays && (
          <>
            {' '}Alimentation connue sur {result.nutritionDays} jour{result.nutritionDays > 1 ? 's' : ''} sur {datasetDays} :
            un jour sans repas saisi ne compte pas comme 0 kcal (un oubli n'est pas un jeûne), et sans aucun
            repas saisi sur les 10 jours précédents, l'alimentation du jour est ignorée.
          </>
        )}
        {reliability === 'exploratory' && (
          <> <span className="reco-reliability-warn">⚠ Données exploratoires — continuez à enregistrer votre bien-être pour améliorer la fiabilité (objectif : 10 jours).</span></>
        )}
      </p>
      <WeekendNote control={result.weekendControl} />

      <section className="reco-section">
        <h3 className="reco-section-title">🎯 Pistes à tester</h3>
        <p className="reco-section-hint">
          Ce sur quoi vous pouvez agir et qui va de pair avec un meilleur bien-être dans vos
          données. Ce sont des hypothèses : une corrélation ne prouve pas une cause. Essayez
          une piste pendant deux semaines et observez.
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

      <TagsSection entries={entries} />

      <LaggedEffectsSection entries={entries} />

      {correlations.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">📈 Corrélations avec votre bien-être</h3>
          <p className="reco-section-hint">
            Vert = va de pair avec un meilleur bien-être · Rouge = avec un moins bon.
            Barres pâles = lien incertain, possiblement dû au hasard.
          </p>
          <div className="reco-corr-chart">
            {correlations.map((c) => (
              <CorrelationBar
                key={c.variable}
                label={c.label}
                r={c.r}
                impact={Math.abs(c.r)}
                uncertain={c.evidence === 'incertain'}
              />
            ))}
          </div>
        </section>
      )}

      <p className="reco-disclaimer">
        Ces résultats sont uniquement basés sur vos propres données et ne constituent pas un avis médical.
      </p>
    </div>
  )
}

// ─── Advanced tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ entries }) {
  const result = useMemo(() => computeAdvancedAnalysis(entries), [entries])
  const totalDays = useMemo(() => countTotalDataDays(entries), [entries])

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
        Analyse sur <strong>{datasetDays} jour{datasetDays > 1 ? 's' : ''} avec score bien-être</strong>
        {totalDays > datasetDays && ` (${totalDays} jours de données au total)`}.
        Modèle : <em>{method}</em>.
        {modelInfo?.r2 != null && (
          <> R² entraînement : <strong>{r2Display}</strong>
          {r2LooDisplay != null
            ? <> · R² LOO (hors-échantillon) : <strong>{r2LooDisplay}</strong></>
            : null
          }
          .</>
        )}
        {modelInfo?.nFeaturesFinal != null && modelInfo?.nFeaturesCandidate != null && (
          <> Variables retenues : <strong>{modelInfo.nFeaturesFinal}</strong> sur {modelInfo.nFeaturesCandidate} (les plus liées au bien-être, {MAX_FEATURES} au plus,
          mesurées au moins un jour sur deux ; un jour sans mesure compte comme un jour habituel).</>
        )}
        {modelInfo?.overfit_risk && (
          <> <span className="reco-overfit-warn">⚠ Plus de variables que de jours — R² entraînement non fiable.</span></>
        )}
        {isModelUnreliable && (
          <> <span className="reco-reliability-warn">⚠ Modèle non fiable (R² LOO négatif) — recommandations à titre indicatif uniquement. Continuez à enregistrer vos données pour améliorer la précision.</span></>
        )}
        {isModelReliable && (
          <> <span className="reco-reliability-ok">✓ Le modèle généralise correctement (R² LOO positif).</span></>
        )}
      </p>
      {modelInfo?.weekendEffect != null && (
        <p className="reco-meta">
          📅 Le jour de la semaine est pris en compte : à habitudes égales,{' '}
          {Math.abs(modelInfo.weekendEffect) < 0.05
            ? <>votre bien-être n'est <strong>pas différent le week-end</strong>.</>
            : <>votre bien-être est estimé à <strong>{frDiff(modelInfo.weekendEffect)}{' '}
              point{Math.abs(modelInfo.weekendEffect) >= 2 ? 's' : ''} le week-end</strong> par
              rapport à la semaine. Cet effet n'est attribué à aucune habitude.</>}
        </p>
      )}
      {modelInfo?.droppedCollinear?.length > 0 && (
        <p className="reco-meta reco-meta--dropped">
          Variables redondantes écartées :{' '}
          {modelInfo.droppedCollinear
            .map((d) => `${d.label} (≈ ${d.keptInsteadLabel})`)
            .join(', ')}
          . Elles évoluent presque exactement comme une variable déjà retenue : les garder
          fausserait l'estimation de leur effet.
        </p>
      )}
      {modelInfo?.method === 'ols_linear_regression' && (
        <details className="reco-method-note">
          <summary>Comment fonctionne ce modèle ?</summary>
          <p>
            Chaque type de donnée est enregistré à une fréquence différente (ex : pas quotidiens, repas plusieurs fois/jour, bien-être manuellement). Pour harmoniser, toutes les entrées sont agrégées par <strong>jour calendaire</strong> (somme pour les pas/calories/nutriments, moyenne pour la fréquence cardiaque et le bien-être). Les nutriments sont ensuite <strong>lissés sur {modelInfo.lagDays} jours</strong> avec une pondération décroissante (un repas d'aujourd'hui influence le bien-être des ~10 prochains jours, avec un impact qui décroît linéairement).
          </p>
          <p>
            Le modèle est une régression linéaire multiple (OLS + Ridge) entraîné <em>entièrement sur vos données locales</em>. Pour limiter le sur-apprentissage, une <strong>pré-sélection</strong> retient les variables les plus corrélées au bien-être sur les données d'entraînement ({MAX_FEATURES} au plus, et pas plus d'une pour {Math.round(1 / MAX_FEATURES_RATIO)} jours de données), en écartant les <strong>doublons</strong> (deux variables corrélées à plus de {Math.round(COLLINEARITY_MAX_R * 100)} %, comme les pas et les calories d'activité : seule la plus liée au bien-être est gardée). La force de la régularisation Ridge{modelInfo.lambda != null && <> (λ = {String(modelInfo.lambda).replace('.', ',')})</>} est choisie automatiquement par validation croisée : plus vos données sont bruitées, plus les effets estimés sont prudemment réduits vers zéro. Seuls les effets d'au moins {String(MIN_ADVICE_EFFECT).replace('.', ',')} écart-type sont proposés comme pistes. Le <strong>R² entraînement</strong> mesure à quel point le modèle s'ajuste aux données qu'il a vues — il peut être élevé simplement parce qu'il y a plus de variables que de jours. Le <strong>R² LOO</strong> (Leave-One-Out) est une mesure honnête : pour chaque jour, le modèle est ré-entraîné sans ce jour puis prédit. Un R² LOO négatif ou très inférieur au R² entraînement signale un sur-apprentissage — dans ce cas le modèle est marqué comme non fiable et les recommandations sont indicatives.
          </p>
          <p>
            Le <strong>week-end</strong> entre dans le modèle comme variable de contrôle (non
            réduite par Ridge) dès qu'il y a au moins {MIN_WEEKEND_DAYS} jours notés de chaque
            sorte : sinon une habitude plus fréquente le samedi récupérerait la bonne (ou mauvaise)
            humeur propre au week-end.
          </p>
          <p>
            Pour éviter le sur-apprentissage dans la section « Prédit vs réel », le modèle est entraîné sur toutes les données <strong>sauf les {HOLD_OUT_DAYS} derniers jours</strong>. Ces jours sont ensuite prédits sans que le modèle les ait vus, ce qui garantit des prédictions honnêtement hors-échantillon. La prédiction affichée sur le tableau de bord utilise également ce modèle.
          </p>
          <p>
            Les barres d'importance sont <strong>relatives</strong> : la variable la plus influente vaut 100%, les autres sont exprimées en proportion.
          </p>
        </details>
      )}


      {topRecommendations?.length > 0 && (
        <section className="reco-section">
          <h3 className="reco-section-title">
            🤖 Pistes suggérées par le modèle
          </h3>
          <p className="reco-section-hint">
            Seuls les facteurs sur lesquels vous pouvez agir, et dont l'effet estimé va dans le
            sens attendu, sont proposés. Ce sont des hypothèses issues d'une régression sur vos
            données, pas des certitudes.
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
            🔬 Importance des variables (coefficients standardisés)
          </h3>
          <p className="reco-section-hint">
            Vert = va de pair avec un meilleur bien-être · Rouge = avec un moins bon.
            Taille de la barre = poids de la variable dans le modèle (une association, pas une preuve de cause).
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
            📉 Bien-être prédit vs réel
          </h3>
          <p className="reco-section-hint">
            Le modèle a été entraîné sur toutes les données <strong>sauf</strong> les {HOLD_OUT_DAYS} derniers jours.
            Ces prédictions sont donc hors-échantillon — le modèle n'a jamais vu ces jours pendant l'entraînement.
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
        Le modèle est entraîné uniquement sur vos données locales et ne partage aucune information.
        Ces résultats ne constituent pas un avis médical.
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
  { id: 'basic', label: 'Recommandations basiques', minDays: MIN_DAYS_BASIC },
  { id: 'advanced', label: 'Recommandations avancées', minDays: MIN_DAYS_ADVANCED + HOLD_OUT_DAYS },
]

export default function Recommendations() {
  useAutoSync()

  const [tab, setTab] = useState('basic')
  const [entries, setEntries] = useState([])
  const [totalDbCount, setTotalDbCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const debugMode = isDebugModeEnabled()

  const load = async () => {
    try {
      // Load entries per type with independent caps so high-frequency types
      // (e.g. heart_rate) cannot crowd out lower-frequency ones (wellbeing, sleep…)
      const [data, dbTotal] = await Promise.all([
        listEntriesForAnalysis(),
        debugMode ? countAllEntries() : Promise.resolve(null),
      ])
      setEntries(data)
      if (dbTotal !== null) setTotalDbCount(dbTotal)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])

  return (
    <section className="reco-page">
      <h2 className="page-title">Recommandations</h2>
      <p className="reco-intro">
        Analyse locale de vos données de santé pour identifier les facteurs qui influencent
        le plus votre <strong>bien-être</strong>. Tout est calculé directement sur votre appareil.
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
          {debugMode && <RecoDebugPanel entries={entries} totalDbCount={totalDbCount} />}
          {tab === 'basic' && <BasicTab entries={entries} />}
          {tab === 'advanced' && <AdvancedTab entries={entries} />}
        </>
      )}
    </section>
  )
}
