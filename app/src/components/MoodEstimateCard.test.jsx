import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MoodEstimateCard from './MoodEstimateCard'

const NOW = new Date(2026, 9, 21, 12)
const estimate = {
  moment: { at: new Date(2026, 9, 21, 9).toISOString(), note: 3.4, low: 1.8, high: 5, label: 'plutôt bonne', today: true },
  day: { date: '2026-10-21', note: 3.4, low: 2.9, high: 3.9, label: 'plutôt bonne', readings: 4, quality: 0.9, framing: 6, spread: 0.4 },
  confidence: 'moyenne', model: 'va', baselineDays: 3, calibrationDays: 0, signals: ['visage'],
}
const days = [
  { date: '2026-10-17', note: 3 },
  { date: '2026-10-18', note: 2.8 },
  { date: '2026-10-19', note: 3.2 },
]

function renderCard(props) {
  return render(<BrowserRouter><MoodEstimateCard now={NOW} {...props} /></BrowserRouter>)
}

describe('MoodEstimateCard', () => {
  it('montre le bien-être estimé du jour en grand, l’écart à la moyenne, la courbe et la phrase simple', () => {
    renderCard({ data: { est: estimate, days } })
    expect(screen.getByText('Bien-être estimé')).toBeInTheDocument()
    expect(screen.getByText('3,7')).toBeInTheDocument()
    expect(screen.getByText('+0,3 vs moy.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /4 derniers jours estimés/ })).toBeInTheDocument()
    expect(screen.getByText('Un peu mieux que votre moyenne des 14 derniers jours.')).toBeInTheDocument()
  })

  it('le chevron ouvre des détails visuels : fourchette, badge de confiance, lectures, moyenne, modèle', () => {
    const toggle = vi.fn()
    const { rerender, container } = renderCard({ data: { est: estimate, days }, onToggleDetails: toggle })
    const chevron = screen.getByRole('button', { name: 'Afficher les détails' })
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(chevron)
    expect(toggle).toHaveBeenCalled()
    rerender(<BrowserRouter><MoodEstimateCard now={NOW} data={{ est: estimate, days }} details onToggleDetails={toggle} /></BrowserRouter>)
    expect(screen.getByRole('button', { name: 'Masquer les détails' })).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelector('.mood-range-band')).not.toBeNull()
    expect(screen.getByText('entre 3,3 et 4,1')).toBeInTheDocument()
    expect(screen.getByText('confiance moyenne')).toBeInTheDocument()
    expect(container.querySelectorAll('.mood-confidence-dots .is-on')).toHaveLength(2)
    expect(screen.getByText('4 lectures auj.')).toBeInTheDocument()
    expect(screen.getByText('moy. 3,4 sur 3 j')).toBeInTheDocument()
    expect(screen.getByText('deux modèles valence / éveil (HSEmotion)')).toBeInTheDocument()
    // la phrase simple reste : les détails s'ajoutent, ils ne remplacent plus
    expect(screen.getByText(/Un peu mieux/)).toBeInTheDocument()
  })

  it('« Noter moi-même » ouvre la note manuelle, aussi sans lecture du visage', () => {
    const add = vi.fn()
    const { rerender } = renderCard({ data: { est: estimate, days }, onAddManual: add })
    const manual = screen.getByRole('button', { name: 'Noter moi-même' })
    // 320 px, police ×1,3 : « Noter moi- / même » se coupait au trait d'union (revue C1 du 06/11 19:35)
    expect([...manual.querySelectorAll('span')].some((s) => s.textContent === 'moi-même' && s.style.whiteSpace === 'nowrap')).toBe(true)
    fireEvent.click(manual)
    expect(add).toHaveBeenCalledTimes(1)
    rerender(<BrowserRouter><MoodEstimateCard now={NOW} data={null} onAddManual={add} /></BrowserRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Noter moi-même' }))
    expect(add).toHaveBeenCalledTimes(2)
  })

  it('« Historique » ouvre l’historique du bien-être (POL-2)', () => {
    renderCard({ data: { est: estimate, days } })
    expect(screen.getByRole('link', { name: 'Historique' })).toHaveAttribute('href', '/bien-etre')
  })

  it('sans lecture aujourd’hui, montre la dernière lecture sans la comparer', () => {
    renderCard({ data: { est: { ...estimate, day: null, moment: { ...estimate.moment, today: false } }, days } })
    expect(screen.getByText(/^dernière lecture le .+ à \d\d:\d\d$/)).toBeInTheDocument()
    expect(document.querySelector('.mood-estimate-when').textContent).not.toMatch(/·/)
    expect(screen.queryByText(/vs moy\./)).not.toBeInTheDocument()
    expect(screen.getByText('Pas encore de lecture aujourd’hui.')).toBeInTheDocument()
  })

  it('sans aucune lecture du visage, invite à l’activer dans Sources', () => {
    renderCard({ data: null })
    expect(screen.getByRole('link', { name: 'L’activer dans Sources' })).toHaveAttribute('href', '/connectors')
  })

  it('ne montre rien pendant la lecture', () => {
    const { container } = renderCard({ data: undefined })
    expect(container).toBeEmptyDOMElement()
  })

  describe('rappel de la lecture au déverrouillage (POL-PLAY-84)', () => {
    it('absent par défaut', () => {
      renderCard({ data: { est: estimate, days } })
      expect(screen.queryByRole('note')).toBeNull()
    })

    it('une ligne discrète vers Sources, fermable ; aucun chiffre de précision', () => {
      const dismiss = vi.fn()
      renderCard({ data: { est: estimate, days }, unlockReminder: true, onDismissReminder: dismiss })
      const note = screen.getByRole('note')
      expect(note).toHaveTextContent('À chaque déverrouillage, bien plus de lectures')
      expect(note.textContent).not.toMatch(/%/)
      expect(screen.getByRole('link', { name: 'Voir dans Sources' })).toHaveAttribute('href', '/connectors')
      fireEvent.click(screen.getByRole('button', { name: 'Ne plus afficher ce rappel' }))
      expect(dismiss).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('link', { name: 'Voir dans Sources' }))
      expect(dismiss).toHaveBeenCalledTimes(2)
    })

    it('sans lecture : le rappel remplace l’invitation générique (pas deux fois la même chose)', () => {
      renderCard({ data: null, unlockReminder: true, onDismissReminder: () => {} })
      expect(screen.getByRole('note')).toBeInTheDocument()
      expect(screen.queryByText('L’activer dans Sources')).toBeNull()
    })
  })

  it('calibration de départ : demande la note du jour, avec la progression, tant que 3 jours ne sont pas notés', () => {
    const add = vi.fn()
    const est = { ...estimate, startCalibration: { done: 1, needed: 3, notedToday: false } }
    renderCard({ data: { est, days }, onAddManual: add })
    expect(screen.getByText('Réglage sur vous : 1 jour sur 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Noter mon bien-être du jour' }))
    expect(add).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Noter moi-même' })).toBeNull()
  })

  it('calibration de départ : une fois la note du jour donnée, rendez-vous demain', () => {
    const est = { ...estimate, startCalibration: { done: 2, needed: 3, notedToday: true } }
    renderCard({ data: { est, days }, onAddManual: vi.fn() })
    expect(screen.getByText('Réglage sur vous : 2 jours sur 3. Prochaine note demain.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Noter mon bien-être du jour' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Noter moi-même' })).toBeInTheDocument()
  })

  it('sans calibration en cours, rien de plus', () => {
    renderCard({ data: { est: estimate, days }, onAddManual: vi.fn() })
    expect(screen.queryByText(/Réglage sur vous/)).toBeNull()
  })
})

describe('MoodEstimateCard — ressenti du ventre (VENTRE-BE-2)', () => {
  it('les détails disent quand la note du ventre a compté', () => {
    const est = { ...estimate, day: { ...estimate.day, gut: { level: 'discomfort', shift: -0.3 } }, signals: ['visage', 'ventre'] }
    renderCard({ data: { est, days }, details: true })
    expect(screen.getByText('gêne au ventre comptée')).toBeInTheDocument()
  })
  it('aucune mention du ventre sans note du ventre', () => {
    renderCard({ data: { est: estimate, days }, details: true })
    expect(screen.queryByText(/au ventre/)).toBeNull()
  })
})
