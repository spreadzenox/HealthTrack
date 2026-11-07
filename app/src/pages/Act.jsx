/**
 * Onglet « Agir » (ORG-1 et ORG-1b, revue design du 07/11 ; leçon 14 : Journal = voir, Analyses = comprendre, Agir =
 * agir). En cours, Mes habitudes, Proposés par vos analyses, Terminés ; une section vide ne s'affiche pas. Au départ,
 * un état vide simple. En bas, toujours : vos essais figurent dans votre rapport médecin.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE } from '../services/today'
import { FODMAP_CHALLENGE_TYPE } from '../services/fodmapChallenge'
import { readPistesSummary } from '../services/pistesSummary'
import { actSections } from '../services/act'
import LineIcon from '../components/LineIcon'

const GUT_WINDOW_DAYS = 120

async function readAct() {
  const since = new Date(Date.now() - GUT_WINDOW_DAYS * 86_400_000).toISOString()
  const [challenges, gut] = await Promise.all([
    listEntries({ type: FODMAP_CHALLENGE_TYPE, limit: Infinity }),
    listEntries({ type: GUT_TYPE, since, limit: Infinity }),
  ])
  return { challenges, gut, pistes: readPistesSummary() }
}

function Section({ title, items, action }) {
  if (!items.length) return null
  return (
    <section className="act-section" aria-label={title}>
      <h2 className="act-section-title">{title}</h2>
      <ul className="act-list">
        {items.map((i) => (
          <li key={i.id}>
            <Link to={i.to} className="today-card act-card" data-tone="peach">
              <span className="act-card-body">
                <span className="act-card-title">{i.title}</span>
                {i.detail && <span className="act-card-detail">{i.detail}</span>}
              </span>
              {action ? <span className="act-card-action">{action}</span> : <LineIcon name="chevron" size={20} className="act-chevron" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Act({ read = readAct }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let alive = true
    read().then((d) => alive && setData(actSections(d))).catch(() => alive && setData({ current: [], proposed: [], done: [] }))
    return () => {
      alive = false
    }
  }, [read])
  if (!data) return null
  const empty = !data.current.length && !data.proposed.length && !data.done.length
  return (
    <section className="act-page" aria-labelledby="act-title">
      <h1 id="act-title" className="page-title">Agir</h1>
      {empty ? (
        <div className="today-card act-empty">
          <p className="act-empty-title">Rien en cours pour l’instant</p>
          <p className="act-empty-text">Quand vos analyses repèrent une piste, vous pourrez la vérifier ici par un essai.</p>
        </div>
      ) : (
        <>
          <Section title="En cours" items={data.current} />
          <Section title="Proposés par vos analyses" items={data.proposed} action="Commencer" />
          <Section title="Terminés" items={data.done} />
        </>
      )}
      <p className="act-report">Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin.</p>
    </section>
  )
}
