/**
 * Entrée « Apparence de Pilou » dans Réglages (branchement minimal du lot STUDIO) : ouvre le Studio. Cachée tant que le
 * compagnon n'est pas visible (`studioEnabled`).
 */
import { Link } from 'react-router-dom'
import { nomDePilou } from './nom'
import { studioEnabled } from './flag'

export default function StudioSetting({ enabled = studioEnabled() }) {
  if (!enabled) return null
  const nom = nomDePilou()
  return (
    <div className="settings-block">
      <h3 className="section-title">Apparence de {nom}</h3>
      <p className="hint">Ses cheveux, ses yeux, ses lunettes : réglés à la main, gardés sur ce téléphone.</p>
      <Link className="btn btn-secondary settings-link-btn" to="/pilou/studio">Ouvrir le Studio {nom}</Link>
    </div>
  )
}
