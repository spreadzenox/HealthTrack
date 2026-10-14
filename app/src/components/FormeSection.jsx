import HealthRadar from './HealthRadar'
import BaselineCards from './BaselineCards'
import SleepRegularityCard from './SleepRegularityCard'
import MethodNote from './MethodNote'
import { RADAR_BASELINE_DAYS } from '../services/radar'
import { RECENT_DAYS, BASELINE_DAYS } from '../services/baselines'
import { REGULARITY_DAYS } from '../services/sleepRegularity'

/**
 * Bloc « Votre forme » de l'accueil (nettoyage D1) : radar, cœur vs norme et régularité du sommeil
 * étaient trois sections avec chacune son titre et son « Comment c'est calculé ». Un seul titre,
 * une seule explication de méthode.
 */
export default function FormeSection() {
  return (
    <section className="forme" aria-labelledby="forme-title">
      <h3 id="forme-title" className="section-title">Votre forme</h3>
      <HealthRadar />
      <BaselineCards />
      <SleepRegularityCard />
      <MethodNote>
        Tout est comparé à <em>votre</em> norme, pas à une moyenne de population. Radar : chaque jour face aux{' '}
        {RADAR_BASELINE_DAYS} jours précédents, alerte seulement si au moins deux signaux s’écartent ensemble. Cœur :
        moyenne des {RECENT_DAYS} derniers jours face à votre moyenne ± 1 écart-type des {BASELINE_DAYS} jours
        précédents. Sommeil ({REGULARITY_DAYS} derniers jours) : l’indice (0 à 100) mesure la chance d’être dans le même
        état — endormi ou éveillé — à la même heure d’un jour au suivant. Une observation, pas un diagnostic.
      </MethodNote>
    </section>
  )
}
