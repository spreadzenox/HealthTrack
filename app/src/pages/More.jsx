import { Link } from 'react-router-dom'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId, getUnseenEntries } from '../services/whatsNew'
import { FEATURES } from '../config/distribution'
import LineIcon from '../components/LineIcon'
import './More.css'

const ITEMS = [
  // Refonte « Compagnon », étape 1 : Sources quitte la barre d'onglets
  { to: '/connectors', icon: 'watch', title: 'Sources', desc: 'Montres, apps de santé, météo, lecture du visage' },
  { to: '/data', icon: 'folder', title: 'Sauvegarde', desc: 'Exporter et restaurer vos données' },
  { to: '/settings', icon: 'gear', title: 'Paramètres', desc: FEATURES.cigaretteSetting
    ? 'Apparence, Pilou, objectifs et habitudes, repas (IA), cigarettes, diagnostic'
    // POLISH-REGLAGES-DESC : la page porte surtout Pilou, les objectifs et les habitudes (refonte)
    : 'Apparence, Pilou, objectifs et habitudes, abonnement' },
  { to: '/nouveautes', icon: 'sparkle', title: 'Nouveautés', desc: 'Ce qui a changé dans l’application' },
  // Page statique (app/public), hors du routeur : aussi publiée par GitHub Pages et montrée par Health Connect
  // (sur iPhone, leurs versions propres : app Santé, iCloud, achats intégrés de l'App Store, sans montre Huawei)
  { href: FEATURES.iosStore ? '/confidentialite-iphone.html' : '/privacypolicy.html', icon: 'lock', title: 'Confidentialité', desc: 'Ce qui reste sur le téléphone, ce qui en sort et quand' },
  { href: FEATURES.iosStore ? '/conditions-iphone.html' : '/conditions.html', icon: 'document', title: 'Conditions', desc: 'Utilisation, abonnement et remboursements' },
  { to: '/licences', icon: 'document', title: 'Licences', desc: 'Composants et données d’autres auteurs' },
]

export default function More({ changelog = CHANGELOG }) {
  const unseen = getUnseenEntries(changelog, getLastSeenId()).length

  return (
    <section className="food-page">
      <h2 className="page-title">Réglages</h2>
      <ul className="more-list">
        {ITEMS.map((item) => {
          const Item = item.href ? 'a' : Link
          const target = item.href ? { href: item.href } : { to: item.to }
          return (
            <li key={item.to ?? item.href}>
              <Item {...target} className="more-item">
                <span className="more-icon" aria-hidden="true"><LineIcon name={item.icon} size={24} /></span>
                <span className="more-text">
                  <span className="more-title">{item.title}</span>
                  <span className="more-desc">{item.desc}</span>
                </span>
                {item.to === '/nouveautes' && unseen > 0 && (
                  <span className="more-badge">{unseen} non lue{unseen > 1 ? 's' : ''}</span>
                )}
                <LineIcon name="chevron" size={20} className="more-chevron" />
              </Item>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
