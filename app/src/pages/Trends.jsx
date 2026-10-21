import JournalTabs from '../components/JournalTabs'
import FormeSection from '../components/FormeSection'
import WellbeingCharts from '../components/WellbeingCharts'

/**
 * Onglet Journal, page « Tendances » (jalon 2b) : la forme (radar, cœur, régularité du sommeil) et les
 * courbes du bien-être, auparavant sous l'accueil. L'accueil garde le résumé du jour de la maquette.
 */
export default function Trends() {
  return (
    <section className="journal-page">
      <JournalTabs />
      <h2 className="page-title">Vos tendances</h2>
      <p className="page-intro">Votre forme face à votre propre norme, et votre bien-être jour après jour.</p>
      <FormeSection />
      <WellbeingCharts />
    </section>
  )
}
