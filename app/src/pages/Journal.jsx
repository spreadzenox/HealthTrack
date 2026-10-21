import JournalTabs from '../components/JournalTabs'
import DailyJournal from '../components/DailyJournal'

/** Onglet Journal, page « Jours » (jalon 2c-2) : le journal par jour, auparavant en bas de l'accueil. */
export default function Journal() {
  return (
    <section className="journal-page">
      <JournalTabs />
      <DailyJournal />
    </section>
  )
}
