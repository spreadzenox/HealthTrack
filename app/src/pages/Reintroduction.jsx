/**
 * Réintroduction FODMAP guidée (jalon 7, I174 étape 7b) : les écrans au-dessus de la machine pure
 * `services/fodmapChallenge.js`. ① choix du groupe (étiquette d'état par groupe) → ② préparation (portions des 3 jours
 * modifiables, conseils, « Commencer » seulement après 3 jours de ventre calme) → ③ jour en cours (frise, « J'ai mangé
 * ma portion », « C'est supportable ? », reprise après une pause) → ④ résultat en une phrase, puis pause jusqu'à
 * 3 jours calmes. L'état et le verdict sont toujours recalculés depuis les notes du ventre ; l'entrée
 * `fodmap_challenge` ne garde que ce que la personne a fait. Jamais « intolérance », « allergie » ni « traitement ».
 *
 * Premium (variante play) : le guidage est premium ; un test déjà commencé se termine toujours (sa saisie est une
 * donnée, gratuite). La variante sideload n'a pas d'abonnement et garde tout.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GutCard } from '../components/TodayCards'
import LineIcon from '../components/LineIcon'
import { useEntitlement } from '../hooks/useEntitlement'
import { FEATURES } from '../config/distribution'
import { createEntry, listEntries, updateEntry } from '../storage/localHealthStorage'
import { GUT_TYPE, WHEN_TO_SEE_DOCTOR } from '../services/today'
import {
  pickableGroups, FODMAP_CHALLENGE_TYPE, FODMAP_CHALLENGE_SOURCE, CALM_DAYS_REQUIRED,
  findFood, findGroup, defaultPlan, startChallenge, challengeStatus, recordDose, answerTolerable,
  restartChallenge, canStartChallenge, groupResults, combinationsAvailable, verdictSentence, formatAmount,
  currentChallenge, calmDaysLeftText,
} from '../services/fodmapChallenge'
import {
  minuteToTime, portionReminderAvailable, portionReminderPrefs, setPortionReminder, timeToMinute,
} from '../services/fodmapReminder'
import { appLocale } from '../i18n/locale.js'

/** Notes du ventre relues : assez loin pour couvrir un test, sa pause et un redémarrage. */
const GUT_WINDOW_DAYS = 120

const defaultStore = {
  async read() {
    const since = new Date(Date.now() - GUT_WINDOW_DAYS * 86400000).toISOString()
    const [challenges, gut] = await Promise.all([
      listEntries({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
      listEntries({ type: GUT_TYPE, since, limit: Infinity }),
    ])
    return { challenges, gut }
  },
  create: (payload) => createEntry({ type: FODMAP_CHALLENGE_TYPE, source: FODMAP_CHALLENGE_SOURCE, payload, at: payload.startedAt }),
  update: (id, payload) => updateEntry(id, { payload }),
}

const fmt = formatAmount
const timeOf = (iso) => new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })

/**
 * Étiquette d'un groupe dans le choix : verdict du groupe, ou par aliment pour les fructanes ; rien tant qu'il n'est
 * pas testé (POL-PLAY-33 : « pas testé » répété sur chaque carte n'apprenait rien).
 */
function groupTag(group, result) {
  if (group.perFood) {
    const tested = group.foods.filter((f) => result.byFood[f.id])
    if (!tested.length) return null
    return tested.map((f) => `${f.label.toLowerCase()} : ${result.byFood[f.id].tag}`).join(' · ')
  }
  return result.verdict?.tag ?? null
}

function GroupTag({ group, result }) {
  const tag = groupTag(group, result)
  return tag ? <span className="fodmap-tag mono">{tag}</span> : null
}

function Disclaimer() {
  return (
    <p className="fodmap-note">
      À faire de préférence avec une diététicienne. {WHEN_TO_SEE_DOCTOR}
    </p>
  )
}

/** Frise J1 / J2 / J3 / pause, avec la portion de chaque jour. */
function Timeline({ challenge, status }) {
  const doses = challenge.doses || []
  const steps = challenge.plan.amounts.map((a, i) => {
    const day = i + 1
    let state = 'todo'
    if (status.stoppedAt === day) state = 'stopped'
    else if (status.stoppedAt != null && day > status.stoppedAt) state = 'skipped'
    else if (doses.length >= day) state = 'done'
    else if (status.day === day) state = 'now'
    return { key: `d${day}`, label: `J${day}`, text: fmt(a, challenge.plan), state }
  })
  const finished = status.state === 'washout' || status.state === 'done'
  steps.push({ key: 'pause', label: 'Pause', text: `${CALM_DAYS_REQUIRED} jours calmes`, state: status.state === 'done' ? 'done' : finished ? 'now' : 'todo' })
  return (
    <ol className="fodmap-timeline" aria-label="Déroulé du test">
      {steps.map((s) => (
        <li key={s.key} className={`fodmap-step is-${s.state}`}>
          <span className="fodmap-step-label mono">{s.label}</span>
          <span className="fodmap-step-text">{s.text}</span>
        </li>
      ))}
    </ol>
  )
}

/** « Me rappeler ma portion chaque jour à 12:00 » : seulement là où le téléphone sait programmer le rappel. */
function PortionReminderRow() {
  const [prefs, setPrefs] = useState(() => portionReminderPrefs())
  const [blocked, setBlocked] = useState(false)
  if (!portionReminderAvailable()) return null
  async function apply(next) {
    setPrefs(next)
    const r = await setPortionReminder(next)
    setBlocked(r.blocked)
  }
  return (
    <div className="fodmap-reminder">
      <label className="fodmap-reminder-row">
        <input
          type="checkbox" checked={prefs.enabled}
          onChange={(e) => apply({ ...prefs, enabled: e.target.checked })}
        />
        <span>Me rappeler ma portion chaque jour à</span>
        <input
          type="time" className="mono" value={minuteToTime(prefs.minute)} aria-label="Heure du rappel"
          onChange={(e) => {
            const minute = timeToMinute(e.target.value)
            if (minute != null) apply({ ...prefs, minute })
          }}
        />
      </label>
      {blocked && (
        <p className="fodmap-note" role="status">
          Les notifications sont bloquées : autorisez-les dans les réglages d’Android pour recevoir le rappel.
        </p>
      )}
    </div>
  )
}

// ─── ① Choix du groupe ──────────────────────────────────────────────────────

function ChooseGroup({ results, onPick, combos, focus = null }) {
  // N5 : ouvert depuis une piste « fructanes », le groupe passe en tête (l'aliment reste à choisir).
  const all = pickableGroups()
  const groups = focus ? all.sort((a, b) => (b.id === focus) - (a.id === focus)) : all
  return (
    <>
      <p className="fodmap-intro">
        Testez un groupe à la fois, sur 3 jours : une portion le 1er jour, le double le 2e, le triple le 3e. Vous notez
        votre ventre comme d’habitude ; l’app vous dit ce qui passe.
      </p>
      <ul className="fodmap-groups">
        {groups.map((g) => (
          <li key={g.id} className={g.id === focus ? 'is-focus' : undefined}>
            {g.foods.length === 1 ? (
              <button type="button" className="fodmap-group" onClick={() => onPick(g.id, g.foods[0].id)}>
                <span className="fodmap-group-name">{g.label}</span>
                <span className="fodmap-group-hint">{g.hint}</span>
                <GroupTag group={g} result={results[g.id]} />
                <span className="fodmap-group-chevron"><LineIcon name="chevron" size={20} /></span>
              </button>
            ) : (
              <div className="fodmap-group is-multi">
                <span className="fodmap-group-name">{g.label}</span>
                <span className="fodmap-group-hint">un aliment à la fois : le résultat vaut pour lui seul</span>
                <GroupTag group={g} result={results[g.id]} />
                <div className="fodmap-foods">
                  {g.foods.map((f) => (
                    <button key={f.id} type="button" className="fodmap-food" onClick={() => onPick(g.id, f.id)}>{f.label}</button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
        <li>
          <div className="fodmap-group is-disabled" aria-disabled="true">
            <span className="fodmap-group-name">Combinaisons</span>
            <span className="fodmap-group-hint">
              {combos ? 'bientôt : plusieurs groupes bien tolérés ensemble' : 'après 2 groupes bien tolérés'}
            </span>
          </div>
        </li>
      </ul>
    </>
  )
}

// ─── ② Préparation ──────────────────────────────────────────────────────────

function Prepare({ group, food, start, onBack, onStart, busy }) {
  const g = findGroup(group)
  const f = findFood(group, food)
  const [amounts, setAmounts] = useState(() => defaultPlan(group, food).amounts.map(String))
  const plan = defaultPlan(group, food)
  const parsed = amounts.map((a) => Number(String(a).replace(',', '.')))
  const valid = parsed.every((a) => Number.isFinite(a) && a > 0)
  return (
    <>
      <p className="fodmap-back"><button type="button" className="fodmap-link" onClick={onBack}>← Autre groupe</button></p>
      <article className="today-card fodmap-card">
        <p className="fodmap-kicker mono">{g.label}</p>
        <h3 className="today-card-title">{f.label}{f.example.toLowerCase() !== f.label.toLowerCase() && ` (${f.example})`}</h3>
        <fieldset className="fodmap-plan">
          <legend>Vos portions</legend>
          {[0, 1, 2].map((i) => (
            <label key={i} className="fodmap-plan-row">
              <span className="mono">Jour {i + 1}</span>
              <input
                type="text" inputMode="decimal" value={amounts[i]} aria-label={`Portion du jour ${i + 1}`}
                onChange={(e) => setAmounts((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
              />
              <span>{parsed[i] > 1 ? plan.units : plan.unit}</span>
            </label>
          ))}
          <p className="fodmap-plan-note">Repère général, à adapter avec votre diététicienne.</p>
        </fieldset>
        <ul className="fodmap-tips">
          <li>Pendant ces 3 jours, plutôt pas de repas dehors.</li>
          <li>Pas plus de café ni d’alcool que d’habitude.</li>
          <li>Les autres repas restent pauvres en FODMAP.</li>
        </ul>
        <PortionReminderRow />
        {start.reason === 'not_calm' && (
          <p className="fodmap-wait" role="status">
            On attend que votre ventre soit calme : ça rend le test lisible.{' '}
            Il faut {calmDaysLeftText(start.calmDays)}
            {' '}(notez votre ventre chaque jour, le bilan du soir suffit).
          </p>
        )}
        <button
          type="button" className="btn fodmap-cta" disabled={!start.ok || !valid || busy}
          onClick={() => onStart({ unit: plan.unit, units: plan.units, amounts: parsed })}
        >
          Commencer aujourd’hui
        </button>
      </article>
      <Disclaimer />
    </>
  )
}

// ─── ③ Jour en cours ────────────────────────────────────────────────────────

function Running({ challenge, status, busy, onDose, onAnswer, onRestart, onAbandon }) {
  const f = findFood(challenge.group, challenge.food)
  const doses = challenge.doses || []
  const last = doses[doses.length - 1]
  const portion = challenge.plan.amounts[doses.length]
  return (
    <>
      <article className="today-card fodmap-card" aria-labelledby="fodmap-run-title">
        <p className="fodmap-kicker mono">{findGroup(challenge.group).label} · test en cours</p>
        <h3 id="fodmap-run-title" className="today-card-title">
          {status.state === 'paused' ? `${f.label} : test en pause` : `${f.label} · jour ${status.day}`}
        </h3>
        <Timeline challenge={challenge} status={status} />
        {status.state === 'question' && (
          <div className="fodmap-question" role="group" aria-labelledby="fodmap-q">
            <p id="fodmap-q" className="fodmap-question-title">
              Vous avez noté une gêne après la portion du jour {status.question.day}. C’est supportable ?
            </p>
            <div className="fodmap-question-choices">
              <button type="button" className="btn" disabled={busy} onClick={() => onAnswer(true)}>Oui, continuer</button>
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => onAnswer(false)}>Non, arrêter</button>
            </div>
          </div>
        )}
        {status.state === 'paused' && (
          <>
            <p className="today-card-text">
              Deux jours sans portion : pour garder un résultat lisible, le test repart du jour 1. Les portions déjà
              prises restent dans vos données.
            </p>
            <button type="button" className="btn fodmap-cta" disabled={busy} onClick={onRestart}>Reprendre au jour 1</button>
          </>
        )}
        {status.canTakeDose && (
          <button type="button" className="btn fodmap-cta" disabled={busy} onClick={onDose}>
            J’ai mangé ma portion ({fmt(portion, challenge.plan)})
          </button>
        )}
        {status.doseTakenToday && status.state !== 'question' && (
          <p className="today-card-text">
            Portion du jour notée à {timeOf(last.at)}. Notez votre ventre dans les 24 h qui suivent
            {status.day < 3 ? ' ; la portion suivante, c’est demain.' : '.'}
          </p>
        )}
        {/^day\d$/.test(status.state) && (challenge.doses || []).length < 3 && <PortionReminderRow />}
      </article>
      {status.state !== 'paused' && <GutCard details={false} onToggleDetails={() => {}} />}
      <p className="fodmap-abandon">
        <button type="button" className="fodmap-link" disabled={busy} onClick={onAbandon}>Arrêter ce test</button>
      </p>
    </>
  )
}

// ─── ④ Résultat ─────────────────────────────────────────────────────────────

function Result({ challenge, status }) {
  return (
    <article className="today-card fodmap-card fodmap-result" aria-labelledby="fodmap-result-title">
      <p className="fodmap-kicker mono">{findGroup(challenge.group).label} · résultat</p>
      <h3 id="fodmap-result-title" className="fodmap-verdict">{verdictSentence(challenge, status.verdict)}</h3>
      <Timeline challenge={challenge} status={status} />
      <p className="today-card-text">
        Une estimation, pas un diagnostic.
        {status.verdict?.id !== 'tolerated' &&
          ' S’attendre à une gêne peut suffire à en ressentir : vous pourrez refaire le test plus tard.'}
      </p>
      {status.state === 'washout' && (
        <p className="fodmap-wait" role="status">
          Pause avant le test suivant : {calmDaysLeftText(status.calmDays)}.
          Mangez comme avant le test.
        </p>
      )}
    </article>
  )
}

function Locked() {
  return (
    <article className="today-card fodmap-card">
      <span className="fodmap-tag fodmap-tag--lead mono">premium</span>
      <h3 className="today-card-title">Testez vos aliments, un groupe à la fois</h3>
      <p className="today-card-text">
        Sur 3 jours, des portions croissantes et vos notes du ventre : l’app vous dit en une phrase ce qui passe
        (« Blé : une portion moyenne passe »). Vos notes du ventre restent gratuites.
      </p>
      <Link to="/premium" className="btn fodmap-cta">Débloquer</Link>
    </article>
  )
}

export default function Reintroduction({ now: nowProp = null, store = defaultStore }) {
  const [ent] = useEntitlement()
  const [data, setData] = useState(null)
  const [params] = useSearchParams()
  // 7c : ouvert depuis une piste ventre (« Vérifier avec une réintroduction guidée »), l'aliment est présélectionné.
  const [pick, setPick] = useState(() => {
    const group = params.get('groupe')
    const food = params.get('aliment')
    const f = findFood(group, food)
    return f && !f.retired ? { group, food } : null
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const now = nowProp ?? new Date()
  // Les actions lisent la même horloge que l'écran (sinon un test au 26/10 refusait la portion le 28/10)
  const clock = () => nowProp ?? new Date()

  const load = useCallback(async () => {
    try {
      setData(await store.read())
    } catch {
      setData({ challenges: [], gut: [] })
    }
  }, [store])
  useEffect(() => {
    load()
    window.addEventListener('health-entries-updated', load)
    return () => window.removeEventListener('health-entries-updated', load)
  }, [load])

  const view = useMemo(() => {
    if (!data) return null
    const live = data.challenges
      .filter((e) => e.payload?.group && !e.payload.abandonedAt)
      .map((e) => ({ entry: e, status: challengeStatus(e.payload, data.gut, now) }))
      .sort((a, b) => Date.parse(b.entry.payload.startedAt) - Date.parse(a.entry.payload.startedAt))
    const current = currentChallenge(data.challenges, data.gut, now)
    const results = groupResults(data.challenges, data.gut, now)
    return {
      current,
      results,
      combos: combinationsAvailable(results),
      start: canStartChallenge(data.challenges, data.gut, now),
      done: live.filter((c) => c.status.state === 'done'),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `now` change à chaque rendu sans prop
  }, [data, nowProp])

  async function run(fn) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
      await load()
    } catch (e) {
      setError(e?.message || 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const premium = !FEATURES.billing || ent.premium
  const current = view?.current
  const save = (fn) => run(() => store.update(current.entry.id, fn(current.entry.payload, data.gut, clock())))

  return (
    <section className="fodmap-page">
      <p className="fodmap-back"><Link to="/recommendations">← Analyses</Link></p>
      <h2 className="page-title">Réintroduction guidée</h2>
      {!view && <div className="loading"><div className="spinner" aria-hidden /></div>}
      {error && <p className="error-msg" role="alert">{error}</p>}

      {view && current && current.status.state === 'washout' && (
        <>
          <Result challenge={current.entry.payload} status={current.status} />
          <GutCard details={false} onToggleDetails={() => {}} />
        </>
      )}
      {view && current && current.status.state !== 'washout' && (
        <Running
          challenge={current.entry.payload} status={current.status} busy={busy}
          onDose={() => save((p, gut, t) => recordDose(p, gut, t))}
          onAnswer={(ok) => save((p, gut, t) => answerTolerable(p, gut, ok, t))}
          onRestart={() => save((p, gut, t) => restartChallenge(p, gut, t))}
          onAbandon={() => {
            if (window.confirm('Arrêter ce test ? Les portions et notes déjà prises restent dans vos données.')) {
              save((p) => ({ ...p, abandonedAt: clock().toISOString() }))
            }
          }}
        />
      )}

      {view && !current && !premium && <Locked />}
      {view && !current && premium && pick && (
        <Prepare
          key={`${pick.group}-${pick.food}`} group={pick.group} food={pick.food} start={view.start} busy={busy}
          onBack={() => setPick(null)}
          onStart={(plan) => run(async () => {
            await store.create(startChallenge({ group: pick.group, food: pick.food, plan }, clock()))
            setPick(null)
          })}
        />
      )}
      {view && !current && premium && !pick && (
        <>
          <ChooseGroup results={view.results} combos={view.combos} focus={findGroup(params.get('groupe'))?.id ?? null} onPick={(group, food) => setPick({ group, food })} />
          {view.done.length > 0 && (
            <article className="today-card fodmap-card" aria-labelledby="fodmap-done-title">
              <h3 id="fodmap-done-title" className="today-card-title">Vos résultats</h3>
              <ul className="fodmap-done">
                {view.done.map((c) => (
                  <li key={c.entry.id ?? c.entry.payload.startedAt}>{verdictSentence(c.entry.payload, c.status.verdict)}</li>
                ))}
              </ul>
              <p className="fodmap-tag mono">estimations de votre ventre, pas un diagnostic</p>
            </article>
          )}
          <Disclaimer />
        </>
      )}
    </section>
  )
}
