/**
 * Onglet Objectifs, vue d'ensemble (refonte « Compagnon », étape 6a ; brief § 4, SPEC comprendre § 6.1 et § 6.2) :
 * une carte par objectif, avec le score sur 5 des 7 derniers jours, sa tendance en mots et 7 barres. Avant 7 jours
 * notés (bien-être) ou 14 (confort digestif), la carte dit combien il en reste. Toucher une carte ouvre ce qui va
 * avec cet objectif (l'ancien sous-onglet). Sans Pilou (étapes 8 à 12). La phrase « pas un diagnostic » de la SPEC
 * n'est pas reprise ici : elle se dit une fois ailleurs, jamais en refrain (SLOP-1).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LineIcon from '../components/LineIcon'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { notedDays, objectivesOverview, TREND_WORDS } from '../services/objectivesOverview'
import { IN_APP_SETTINGS } from '../config/distribution'
import { gutCardMode } from '../settings/onboarding'
import { isExampleMode } from '../storage/exampleMode'
import { appLocale } from '../i18n/locale.js'
import PilouGuide from '../companion/life/PilouGuide'
import { GUT_PISTES_MIN_NOTE_DAYS } from '../services/today'
import { TRIAL_TYPE, homeTrial } from '../services/trials'
import { listEntries } from '../storage/localHealthStorage'
import TrialLink from '../components/TrialLink'

const CARDS = {
  wellbeing: { title: 'Bien-être', tone: 'mint', to: '/recommendations/bien-etre', more: 'Ce qui va avec votre bien-être' },
  digestion: { title: 'Confort digestif', tone: 'peach', to: '/recommendations/ventre', more: 'Ce qui va avec votre confort digestif', 
    // POLISH-SIM-102, UPG-7 : les deux paliers nommés, comme dans Ma journée (DigestBlock)
    wait: `Pistes au ${GUT_PISTES_MIN_NOTE_DAYS}e jour noté.` },
}
const ARROW = { up: '↑', down: '↓', flat: '→' }
// L'échelle affichée va de 1 à 5 (wellbeingScale) : une barre pleine vaut 5, la plus petite 1
const SCALE_MIN = 1
const SCALE_MAX = 5

const n1 = (v) => v.toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const days = (n, word = '') => `${n} jour${n > 1 ? 's' : ''}${word ? ` ${word}${n > 1 ? 's' : ''}` : ''}`

const readStates = () => getAnalysis('dayStates').catch(() => null)
const readTrialRows = () => listEntries({ type: TRIAL_TYPE, limit: Infinity })

function Bars({ bars }) {
  return (
    <span className="objective-bars" aria-hidden="true">
      {bars.map((b) => (
        <span key={b.date} className={`objective-bar${b.value == null ? ' is-empty' : b.observed ? '' : ' is-estimated'}`}
          style={b.value == null ? undefined : { height: `${Math.max(8, ((b.value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)}%` }} />
      ))}
    </span>
  )
}

function Gauge({ noted, need }) {
  return (
    <span className="objective-gauge" aria-hidden="true">
      {Array.from({ length: need }, (_, i) => <span key={i} className={`objective-seg${i < noted ? ' is-full' : ''}`} />)}
    </span>
  )
}

function ObjectiveCard({ card }) {
  const c = CARDS[card.key]
  return (
    <li>
      <Link to={c.to} className="today-card objective-card" data-tone={c.tone} data-testid={`objective-${card.key}`}>
        <span className="objective-title">{c.title}</span>
        {card.state === 'score' && (
          <>
            <span className="objective-score"><span className="mono">{n1(card.score)}</span> / <span className="mono">5</span></span>
            {card.trend && <span className="objective-trend"><span aria-hidden="true">{ARROW[card.trend]} </span>{TREND_WORDS[card.trend]}</span>}
            <Bars bars={card.bars} />
            {/* UPG-6 : l’Accueil montre la note du jour, ici c’est la moyenne */}
            <span className="objective-note">Moyenne de vos 7 derniers jours</span>
          </>
        )}
        {card.state === 'waiting' && (
          <>
            <span className="objective-wait">Premier score dans {days(card.daysLeft, 'noté')}</span>
            <Gauge noted={card.noted} need={card.need} />
            <span className="objective-note">
              {c.wait ? `${c.wait} ` : ''}<span className="mono">{card.noted}</span> sur <span className="mono">{card.need}</span> jours notés, pas forcément d’affilée.
            </span>
          </>
        )}
        {card.state === 'quiet' && (
          <>
            <span className="objective-wait">Pas assez de notes cette semaine pour un score</span>
            <span className="objective-note"><span className="mono">{card.weekNoted}</span> sur <span className="mono">7</span> jours notés cette semaine.</span>
          </>
        )}
        <span className="objective-more">{c.more} <LineIcon name="chevron" size={16} className="objective-chevron" /></span>
      </Link>
    </li>
  )
}

export default function Objectives({ read = readStates, readTrials = readTrialRows, now }) {
  const [states, setStates] = useState(() => peekAnalysis('dayStates').result ?? undefined)
  const [revision, setRevision] = useState(0)
  // Pendant l'exemple (« Voir un exemple »), la digestion fictive s'affiche aussi
  const [gut] = useState(() => gutCardMode() !== 'hide' || isExampleMode())

  useEffect(() => {
    const onUpdate = () => setRevision((r) => r + 1)
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])
  useEffect(() => {
    let alive = true
    Promise.resolve().then(read).then((s) => alive && setStates(s ?? null)).catch(() => alive && setStates(null))
    return () => {
      alive = false
    }
  }, [read, revision])
  // POLISH-SIM-136 : l'essai en cours (bien-être ou digestion) ; sa page allume cet onglet, on le retrouve donc ici
  const [trial, setTrial] = useState(null)
  useEffect(() => {
    let alive = true
    Promise.resolve().then(readTrials).then((rows) => alive && setTrial(homeTrial(rows, now || new Date())))
      .catch(() => alive && setTrial(null))
    return () => {
      alive = false
    }
  }, [readTrials, revision, now])

  return (
    <section className="objectives-page">
      <h2 className="page-title">Objectifs</h2>
      {!isExampleMode() && <TrialLink trial={trial} className="objectives-trial" testId="objectives-trial" />}
      {states === undefined ? (
        <div className="loading"><div className="spinner" aria-hidden /><p>Calcul de vos scores…</p></div>
      ) : (() => {
        const cards = objectivesOverview(states, { gut, now: now || new Date() })
        // POLISH-SIM-76 et 93 : sans l'objectif digestion, les jours déjà notés restent gardés ; on dit où les retrouver
        const gutKept = gut ? 0 : notedDays(states, 'digestion')
        return (
          <>
            {/* Lot VIE (étape 12) : Pilou guide discret, une phrase, aucun chiffre */}
            <PilouGuide card={cards.find((c) => c.key === 'wellbeing')} />
            <ul className="objectives-list">
              {cards.map((card) => <ObjectiveCard key={card.key} card={card} />)}
            </ul>
            {gutKept > 0 && (
              <p className="objectives-gut-hidden" data-testid="objectives-gut-hidden">
                Vos notes de digestion ({days(gutKept)}) sont gardées. Pour les retrouver : {IN_APP_SETTINGS} › Paramètres › <Link to="/settings">Vos objectifs</Link>.
              </p>
            )}
          </>
        )
      })()}
    </section>
  )
}
