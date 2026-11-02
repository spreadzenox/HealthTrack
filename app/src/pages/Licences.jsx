import { FEATURES, STORE } from '../config/distribution'
import { APP_NAME } from '../config/brand'
import { LICENSE_URLS, licenseSections } from '../services/thirdPartyLicenses'

export default function Licences({ features = FEATURES, store = STORE }) {
  return (
    <section className="food-page licences-page">
      <h2 className="page-title">Licences</h2>
      <p className="page-intro">Les composants d’autres auteurs utilisés par {APP_NAME}, et leur licence.</p>
      {licenseSections(features, store).map((section) => (
        <div key={section.title} className="licences-section">
          <h3>{section.title}</h3>
          <ul className="licences-list">
            {section.items.map((item) => (
              <li key={item.name}>
                <span className="licences-name">{item.name}</span>
                {LICENSE_URLS[item.license]
                  ? <a className="licences-tag" href={LICENSE_URLS[item.license]} target="_blank" rel="noreferrer">{item.license}</a>
                  : <span className="licences-tag">{item.license}</span>}
                {item.note && <span className="licences-note">{item.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
