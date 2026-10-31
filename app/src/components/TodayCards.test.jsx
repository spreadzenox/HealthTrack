import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GutCard, MeasureTiles, PistesTeaser } from './TodayCards'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
}))

const wrap = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('MeasureTiles', () => {
  const tiles = [
    { key: 'sleep', label: 'Sommeil', value: '7 h 32', sources: ['Health Connect · Garmin'] },
    { key: 'hrv', label: 'VFC nuit', value: null, sources: [] },
    { key: 'steps', label: 'Pas', value: '3 456', sources: ['Montre Huawei'] },
  ]

  it('montre les chiffres, et leur source en mode détails', () => {
    const { rerender } = wrap(<MeasureTiles tiles={tiles} />)
    expect(screen.getByText('7 h 32')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('Health Connect · Garmin')).not.toBeInTheDocument()
    rerender(<BrowserRouter><MeasureTiles tiles={tiles} details /></BrowserRouter>)
    expect(screen.getByText('Health Connect · Garmin')).toBeInTheDocument()
    expect(screen.getByText('aucune source')).toBeInTheDocument()
  })

  it('rien de mesuré : une seule ligne au lieu de trois tuiles « — » (VC-26)', () => {
    wrap(<MeasureTiles tiles={tiles.map((t) => ({ ...t, value: null }))} />)
    expect(screen.getByRole('link', { name: 'Ajouter une source' })).toHaveAttribute('href', '/connectors')
    // Pas de montre supposée (POL-PLAY-2) : le téléphone peut donner pas et nuits
    expect(screen.getByText(/peuvent venir de votre téléphone/)).toBeInTheDocument()
    expect(screen.queryByText(/votre montre/)).not.toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('GutCard', () => {
  beforeEach(async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(1)
  })

  it('note Calme / Gêne / Douleur en un geste, horodaté, et prévient les autres écrans', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const updated = vi.fn()
    window.addEventListener('health-entries-updated', updated)
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    wrap(<GutCard read={async () => []} now={morning} />)
    expect(await screen.findByText(/Un geste suffit/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gêne' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith({ type: 'gut', source: 'app_gut', payload: { level: 'discomfort' } }))
    await waitFor(() => expect(updated).toHaveBeenCalled())
    window.removeEventListener('health-entries-updated', updated)
  })

  it('montre la dernière note du jour, et le bilan de 7 jours en mode détails', async () => {
    const at = new Date()
    at.setHours(8, 15, 0, 0)
    const read = async () => [{ type: 'gut', source: 'app_gut', at: at.toISOString(), payload: { level: 'calm' } }]
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    wrap(<GutCard read={read} details onToggleDetails={() => {}} now={morning} />)
    expect(await screen.findByText('Dernière note : Calme, à 08:15.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('7 jours · 1 note : 1 calme · 6 jours sans note')).toBeInTheDocument()
  })

  it('« Quand consulter » : une phrase fixe dans les détails, jamais sans eux (POL-PLAY-60)', async () => {
    const { WHEN_TO_SEE_DOCTOR } = await import('../services/today')
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    const { unmount } = wrap(<GutCard read={async () => []} now={morning} />)
    await screen.findByText(/Un geste suffit/)
    expect(screen.queryByText(WHEN_TO_SEE_DOCTOR)).not.toBeInTheDocument()
    unmount()
    wrap(<GutCard read={async () => []} details onToggleDetails={() => {}} now={morning} />)
    const line = await screen.findByText(WHEN_TO_SEE_DOCTOR)
    expect(line).toHaveClass('gut-consult-note')
    expect(line).not.toHaveClass('mono')
    expect(WHEN_TO_SEE_DOCTOR).toMatch(/Sang dans les selles.*parlez-en rapidement à votre médecin\.$/)
    // POL-PLAY-91 (I202) : antécédent familial de cancer du côlon ou de MICI
    expect(WHEN_TO_SEE_DOCTOR).toMatch(/un proche \(parent, frère, sœur\) qui a eu un cancer du côlon ou une maladie inflammatoire de l’intestin/)
  })

  it('dit « hier » pour une note de la veille, le jour de la semaine ensuite, la date au-delà (POL-PLAY-4)', async () => {
    const at = (daysAgo) => {
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      d.setHours(10, 19, 0, 0)
      return d
    }
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    const note = (d) => async () => [{ type: 'gut', source: 'app_gut', at: d.toISOString(), payload: { level: 'pain' } }]
    const { unmount } = wrap(<GutCard read={note(at(1))} now={morning} />)
    expect(await screen.findByText('Dernière note : Douleur, hier à 10:19.')).toBeInTheDocument()
    unmount()
    const three = at(3)
    const weekday = three.toLocaleDateString('fr-FR', { weekday: 'long' })
    const r2 = wrap(<GutCard read={note(three)} now={morning} />)
    expect(await screen.findByText(`Dernière note : Douleur, ${weekday} à 10:19.`)).toBeInTheDocument()
    r2.unmount()
    const old = at(10)
    const date = old.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    wrap(<GutCard read={note(old)} now={morning} />)
    expect(await screen.findByText(`Dernière note : Douleur, le ${date} à 10:19.`)).toBeInTheDocument()
  })
})

describe('GutCard — bilan du soir (I170)', () => {
  beforeEach(async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(1)
  })

  it('le soir, demande la journée en un geste et l’enregistre comme un bilan (scope « day »)', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const now = new Date()
    now.setHours(20, 30, 0, 0)
    wrap(<GutCard read={async () => []} now={now} />)
    expect(await screen.findByText('Et votre ventre aujourd’hui, dans l’ensemble ?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Journée : Calme' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith({ type: 'gut', source: 'app_gut', payload: { level: 'calm', scope: 'day' } }))
  })

  it('le soir, une seule question : la note d’un moment précis attend derrière un lien (POL-PLAY-12)', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const now = new Date()
    now.setHours(20, 30, 0, 0)
    wrap(<GutCard read={async () => []} now={now} />)
    await screen.findByText('Et votre ventre aujourd’hui, dans l’ensemble ?')
    expect(screen.queryByRole('button', { name: 'Gêne' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Un geste suffit/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Noter un moment précis' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gêne' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith({ type: 'gut', source: 'app_gut', payload: { level: 'discomfort' } }))
    expect(screen.getByText('Et votre ventre aujourd’hui, dans l’ensemble ?')).toBeInTheDocument()
  })

  it('le soir, « Noter un moment précis » et « Selles » sur une même ligne d’actions (POL-PLAY-29)', async () => {
    const now = new Date()
    now.setHours(20, 30, 0, 0)
    const { container } = wrap(<GutCard read={async () => []} now={now} />)
    await screen.findByText('Et votre ventre aujourd’hui, dans l’ensemble ?')
    const row = container.querySelector('.gut-card-actions')
    expect(row).not.toBeNull()
    expect(within(row).getByRole('button', { name: 'Noter un moment précis' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Selles' })).toBeInTheDocument()
    expect(row.querySelectorAll('svg')).toHaveLength(2)
  })

  it('pas de question le matin ; une fois répondu, une ligne de remerciement', async () => {
    const morning = new Date()
    morning.setHours(9, 0, 0, 0)
    const { unmount } = wrap(<GutCard read={async () => []} now={morning} />)
    await screen.findByText(/Un geste suffit/)
    expect(screen.queryByText(/dans l’ensemble/)).not.toBeInTheDocument()
    unmount()
    const evening = new Date()
    evening.setHours(21, 0, 0, 0)
    const at = new Date(evening)
    at.setHours(20, 0, 0, 0)
    const read = async () => [{ type: 'gut', source: 'app_gut', at: at.toISOString(), payload: { level: 'discomfort', scope: 'day' } }]
    wrap(<GutCard read={read} now={evening} />)
    expect(await screen.findByText('Bilan du jour : Gêne. Merci !')).toBeInTheDocument()
    expect(screen.queryByText(/dans l’ensemble/)).not.toBeInTheDocument()
    expect(screen.getByText(/Un geste suffit/)).toBeInTheDocument()
  })
})

describe('GutCard — rappel du bilan par notification (I170 étape 2)', () => {
  const evening = () => {
    const d = new Date()
    d.setHours(20, 30, 0, 0)
    return d
  }

  beforeEach(() => {
    localStorage.removeItem('healthtrack_gut_evening')
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ goal: 'gut' }))
  })

  it('hors de l’app Android : aucune proposition', async () => {
    delete window.__healthtrackFakeGutEvening
    wrap(<GutCard read={async () => []} now={evening()} />)
    await screen.findByText(/dans l’ensemble/)
    expect(screen.queryByText(/chaque soir/)).not.toBeInTheDocument()
  })

  it('le soir, propose le rappel ; un geste l’allume (autorisation demandée)', async () => {
    const plugin = {
      status: vi.fn(async () => ({ enabled: false, minuteOfDay: 20 * 60 })),
      requestNotifications: vi.fn(async () => ({ asked: true, notifications: true })),
      configure: vi.fn(async (o) => ({ enabled: !!o.enabled, notifications: true, minuteOfDay: 20 * 60 })),
    }
    window.__healthtrackFakeGutEvening = plugin
    try {
      const { listEntries } = await import('../storage/localHealthStorage')
      listEntries.mockResolvedValue([])
      wrap(<GutCard read={async () => []} now={evening()} />)
      fireEvent.click(await screen.findByRole('button', { name: 'Me le demander chaque soir par notification' }))
      expect(await screen.findByText(/rappel chaque soir vers 20 h/)).toBeInTheDocument()
      expect(plugin.requestNotifications).toHaveBeenCalled()
      expect(plugin.configure).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    } finally {
      delete window.__healthtrackFakeGutEvening
    }
  })

  it('le matin, ou une fois le rappel choisi : rien', async () => {
    window.__healthtrackFakeGutEvening = { status: async () => ({ enabled: true }), configure: vi.fn() }
    try {
      const morning = new Date()
      morning.setHours(9, 0, 0, 0)
      const { unmount } = wrap(<GutCard read={async () => []} now={morning} />)
      await screen.findByText(/Un geste suffit/)
      expect(screen.queryByText(/chaque soir/)).not.toBeInTheDocument()
      unmount()
      localStorage.setItem('healthtrack_gut_evening', JSON.stringify({ enabled: true }))
      wrap(<GutCard read={async () => []} now={evening()} />)
      await screen.findByText(/dans l’ensemble/)
      expect(screen.queryByText(/chaque soir/)).not.toBeInTheDocument()
    } finally {
      delete window.__healthtrackFakeGutEvening
    }
  })
})

describe('GutCard onlyIfUsed (aucun objectif choisi, POL-4)', () => {
  it('ne montre rien sans note des 7 derniers jours', async () => {
    const read = vi.fn(async () => [])
    const { container } = wrap(<GutCard read={read} onlyIfUsed />)
    await waitFor(() => expect(read).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
  })

  it('reste affichée pour qui note son ventre', async () => {
    const read = async () => [{ type: 'gut', source: 'app_gut', at: new Date().toISOString(), payload: { level: 'calm' } }]
    wrap(<GutCard read={read} onlyIfUsed />)
    expect(await screen.findByRole('heading', { name: 'Votre ventre' })).toBeInTheDocument()
  })
})

describe('PistesTeaser', () => {
  const day = (back) => {
    const d = new Date()
    d.setDate(d.getDate() - back)
    return { type: 'food', at: d.toISOString() }
  }

  const remember = (summary) => localStorage.setItem('healthtrack_pistes_summary', JSON.stringify({ at: 'x', ...summary }))
  beforeEach(() => localStorage.clear())

  it('annonce les pistes déjà repérées par Analyses, la première en une ligne, toute la carte y mène (POL-PLAY-21)', async () => {
    remember({ gut: [], levers: ['Marcher davantage', 'Dormir plus'] })
    wrap(<PistesTeaser read={async () => [day(0)]} />)
    expect(await screen.findByText('2 pistes repérées')).toBeInTheDocument()
    expect(screen.getByText('Marcher davantage')).toBeInTheDocument()
    expect(screen.getByText(/pas des causes/)).toBeInTheDocument()
    expect(screen.getByText('2 pistes repérées').closest('a')).toHaveAttribute('href', '/recommendations')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('les pistes du ventre comptent tant que la carte ventre est montrée', async () => {
    remember({ gut: ['Oignon → ventre'], levers: [] })
    wrap(<PistesTeaser read={async () => [day(0)]} />)
    expect(await screen.findByText('1 piste repérée')).toBeInTheDocument()
    expect(screen.getByText('Oignon → ventre')).toBeInTheDocument()
  })

  it('sans aucune piste dans le résumé : le compte à rebours habituel', async () => {
    remember({ gut: [], levers: [] })
    wrap(<PistesTeaser read={async () => [day(0)]} />)
    expect(await screen.findByText('Vos pistes arrivent dans 20 jours')).toBeInTheDocument()
  })

  it('dans Analyses, la carte ne s’annonce jamais elle-même', async () => {
    remember({ gut: [], levers: ['Marcher davantage'] })
    wrap(<PistesTeaser read={async () => [day(0)]} onPistesPage />)
    expect(await screen.findByText('Vos pistes arrivent dans 20 jours')).toBeInTheDocument()
  })

  it('compte les jours avant les pistes et préfère attendre', async () => {
    wrap(<PistesTeaser read={async () => [day(0), day(1), day(1), day(3)]} />)
    expect(await screen.findByText('Vos pistes arrivent dans 18 jours')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Jours suivis' })).toHaveAttribute('aria-valuenow', '3')
    const count = document.querySelector('.pistes-count')
    expect(count).toHaveTextContent('3/21 jours avec un repas ou une note du ventre (6 dernières semaines)')
    // POL-PLAY-47 : le chiffre en mono, la phrase en Figtree
    expect(count).not.toHaveClass('mono')
    expect(count.querySelector('.mono')).toHaveTextContent(/^3\/21$/)
    expect(screen.getByText('On préfère attendre plutôt que de vous montrer de faux suspects.')).toBeInTheDocument()
  })

  const gut = (back) => ({ ...day(back), type: 'gut' })

  it('21 jours suivis mais peu de notes du ventre : le compte à rebours des notes, pas « assez de jours »', async () => {
    const entries = [...Array.from({ length: 25 }, (_, i) => day(i)), ...Array.from({ length: 10 }, (_, i) => gut(i))]
    wrap(<PistesTeaser read={async () => entries} />)
    expect(await screen.findByText('Vos pistes du ventre arrivent dans 18 jours')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Jours de notes du ventre' })).toHaveAttribute('aria-valuenow', '10')
    expect(document.querySelector('.pistes-count')).toHaveTextContent('10/28 jours avec une note du ventre (6 dernières semaines)')
    expect(screen.getByText('On préfère attendre plutôt que de vous montrer de faux suspects.')).toBeInTheDocument()
    expect(screen.queryByText(/Assez de jours/)).not.toBeInTheDocument()
  })

  it('dit les délais et la correction en mode détails, sans promettre plus que l’existant une fois prêt', async () => {
    wrap(<PistesTeaser read={async () => Array.from({ length: 30 }, (_, i) => gut(i))} details onToggleDetails={() => {}} />)
    expect(await screen.findByText('Assez de jours pour chercher des pistes')).toBeInTheDocument()
    expect(screen.getByText(/Aucune piste pour l’instant : elles se précisent à chaque note du ventre/)).toBeInTheDocument()
    expect(screen.getByText(/Délais testés : 0–4 h, 4–24 h, 24–48 h/)).toBeInTheDocument()
    expect(screen.getByText(/minimum 21 jours suivis et 28 jours de notes du ventre/)).toBeInTheDocument()
  })

  it('objectif énergie : compte les nuits avec une mesure du bien-être et parle sommeil → bien-être', async () => {
    const ago = (back, h) => {
      const d = new Date()
      d.setDate(d.getDate() - back)
      d.setHours(h, 0, 0, 0)
      return d.toISOString()
    }
    const entries = [
      { type: 'sleep', at: ago(1, 1), payload: { endDate: ago(1, 7) } }, { type: 'wellbeing', at: ago(1, 20) },
      { type: 'face_burst', at: ago(2, 9) },
    ]
    wrap(<PistesTeaser focus="energy" read={async () => entries} details onToggleDetails={() => {}} />)
    expect(await screen.findByText('Vos pistes arrivent dans 20 jours')).toBeInTheDocument()
    expect(document.querySelector('.pistes-count')).toHaveTextContent('1/21 nuits suivies d’une mesure du bien-être (6 dernières semaines)')
    expect(screen.getByText(/pistes sommeil → bien-être/)).toBeInTheDocument()
  })
})

describe('GutCard — forme des selles (I176)', () => {
  beforeEach(async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(1)
  })

  it('« Selles » s’ouvre sur trois formes ; un geste enregistre la forme et confirme', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    wrap(<GutCard read={async () => []} />)
    expect(screen.queryByRole('button', { name: 'Normales' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Selles' }))
    fireEvent.click(screen.getByRole('button', { name: 'Normales' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith(expect.objectContaining({ type: 'stool', source: 'app_stool', payload: { form: 'normal' } })))
    expect(await screen.findByText(/Selles notées : Normales, à \d\d:\d\d\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dures' })).not.toBeInTheDocument()
  })

  it('le type de Bristol seulement sur demande, et il fixe la forme', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    wrap(<GutCard read={async () => []} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Selles' }))
    expect(screen.queryByText('Petites boules dures, séparées')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Préciser le type (échelle de Bristol)' }))
    fireEvent.click(screen.getByRole('button', { name: /Petites boules dures/ }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith(expect.objectContaining({ payload: { form: 'hard', bristol: 1 } })))
    expect(await screen.findByText(/Selles notées : Dures · type 1/)).toBeInTheDocument()
  })
})
