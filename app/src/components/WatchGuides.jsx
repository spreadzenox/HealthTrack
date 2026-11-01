/**
 * Guides pas à pas pour faire arriver les données d'une montre / bague dans Health Connect
 * (puis dans HealthTrack). Cas pilote : les montres Huawei / Honor, qui n'écrivent pas dans
 * Health Connect — l'app libre Gadgetbridge les prend en charge (GT 6 Pro depuis la 0.88, déc. 2025)
 * et écrit dans Health Connect depuis la 0.89 (févr. 2026).
 * Sources : gadgetbridge.org/basics/pairing/huawei-honor-pairing/,
 * gadgetbridge.org/basics/integrations/health-connect/ (consultées le 11/10/2026).
 */
import { watchGuidesFor } from '../data/watchGuides'
import './WatchGuides.css'

export default function WatchGuides() {
  return (
    <section className="watch-guides" aria-labelledby="watch-guides-title">
      <h3 id="watch-guides-title" className="watch-guides-title">Votre montre n’apparaît pas ?</h3>
      <p className="watch-guides-intro">
        Choisissez sa marque : on vous montre comment envoyer ses mesures vers Health Connect.
      </p>
      {watchGuidesFor().map((g) => (
        <details key={g.id} id={`guide-${g.id}`} className="watch-guide">
          <summary>{g.title}</summary>
          <p className="watch-guide-intro">{g.intro}</p>
          <ol className="watch-guide-steps">
            {g.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {g.caveats && <p className="watch-guide-caveats">{g.caveats}</p>}
          {g.links && (
            <p className="watch-guide-links">
              {g.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </details>
      ))}
    </section>
  )
}
