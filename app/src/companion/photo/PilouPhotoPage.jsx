/**
 * Route `/pilou/photo` (Réglages › Pilou, et après le nom à l'onboarding), enregistrée seulement si l'interrupteur
 * de build PILOU_PHOTO est allumé. La fiche part vers le Studio Pilou du lot STUDIO, qui l'enregistre sur le
 * téléphone (normaliser, `incertains` affichés « À vérifier ») ; tant que sa route n'est pas sur main, Réglages.
 */
import { useNavigate } from 'react-router-dom'
import PilouPhotoFlow from './PilouPhotoFlow.jsx'

export const STUDIO_PATH = '/settings'

export default function PilouPhotoPage() {
  const navigate = useNavigate()
  return (
    <PilouPhotoFlow
      onStudio={(style) => navigate(STUDIO_PATH, { state: style ? { pilouStyle: style } : null })}
      onLater={() => navigate(STUDIO_PATH)}
    />
  )
}
