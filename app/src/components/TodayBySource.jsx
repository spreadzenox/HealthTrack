/**
 * « Vos données du jour » (TESTEUR-1d-b, retours du testeur iPhone du 06/11, maquette journal/maquettes/aujourdhui
 * §2.4) : une carte neutre par source, Montre, Téléphone, puis Noté par vous. Une source sans chiffre ne s'affiche
 * pas ; sans montre, un lien discret « Ajouter une montre » mène à Sources. Couleur au sens constant : la note du
 * bien-être en menthe, celle du ventre en pêche, tout le reste sur la surface neutre.
 */
import { Link } from 'react-router-dom'
import { todayBySource } from '../services/today'
import LineIcon from './LineIcon'
import './TodayBySource.css'

/**
 * Appareils d'où viennent les chiffres d'une carte : l'app d'origine quand Health Connect la donne
 * (« Health Connect · Garmin » → « Garmin »), sinon la source (« Montre Huawei », « Health Connect »).
 */
function sourcesLine(items) {
  const labels = items.flatMap((i) => i.sources || []).map((l) => l.split(' · ').pop())
  return [...new Set(labels)].join(', ')
}

/**
 * @param {{ tiles: object[], summary: object | null, entries: object[], showGut?: boolean, now?: Date }} props
 */
export default function TodayBySource({ tiles, summary, entries, showGut = false, now = new Date() }) {
  const groups = todayBySource({ tiles, summary, entries, now, showGut })
  // Rien du tout : ni titre ni lien (le statut du jour et « Noter » suffisent au premier jour)
  if (!groups.length) return null
  return (
    <section className="today-sources" aria-labelledby="today-sources-title">
      <h2 id="today-sources-title" className="today-sources-title">Vos données du jour</h2>
      {groups.map((g) => {
        const from = g.id === 'noted' ? '' : sourcesLine(g.items)
        return (
          <section key={g.id} className={`today-source is-${g.id}`} aria-label={g.title}>
            <header className="today-source-head">
              <h3 className="today-source-name">{g.title}</h3>
              {from && <span className="today-source-from mono">{from}</span>}
            </header>
            <ul className="today-source-items">
              {g.items.map((i) => (
                <li key={i.key} className="today-source-item" data-theme={i.theme || undefined}>
                  <span className="today-source-label">{i.label}</span>
                  <span className="today-source-value mono">{i.value}</span>
                  {i.when && <span className="today-source-when mono">{i.when}</span>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {!todayBySource.hasWatch(groups) && (
        <Link to="/connectors" className="today-sources-add">
          Ajouter une montre
          <LineIcon name="chevron" size={16} />
        </Link>
      )}
    </section>
  )
}
