import { describe, it, expect, beforeEach } from 'vitest'
import {
  HEALTH_CONNECT_READ_WINDOW_DAYS,
  noteFirstGrant,
  syncSince,
  readsAllFailed,
  historyOptions,
} from './syncWindow'
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-23T10:00:00Z')

describe('syncWindow', () => {
  beforeEach(() => localStorage.clear())

  it('laisse une marge sous la limite de 30 jours de Health Connect', () => {
    expect(HEALTH_CONNECT_READ_WINDOW_DAYS).toBe(29)
  })

  describe('noteFirstGrant', () => {
    it('note la date de première autorisation sur une installation neuve', () => {
      noteFirstGrant('hc', NOW)
      expect(getConnectorSettings('hc').firstGrantAt).toBe(NOW.toISOString())
    })

    it('ne remplace jamais une date déjà notée', () => {
      setConnectorSettings('hc', { firstGrantAt: '2026-10-01T00:00:00.000Z' })
      noteFirstGrant('hc', NOW)
      expect(getConnectorSettings('hc').firstGrantAt).toBe('2026-10-01T00:00:00.000Z')
    })

    it('ne note rien pour un connecteur déjà synchronisé (autorisation ancienne, date inconnue)', () => {
      setConnectorSettings('hc', { lastSyncAt: '2026-06-01T00:00:00.000Z' })
      noteFirstGrant('hc', NOW)
      expect(getConnectorSettings('hc').firstGrantAt).toBeUndefined()
    })
  })

  describe('syncSince', () => {
    it('première synchro sans fenêtre de lecture : remonte de N jours', () => {
      const since = syncSince({ now: NOW, settings: {}, latestAt: null, historyDays: 180, readWindowDays: null })
      expect(since.getTime()).toBe(NOW.getTime() - 180 * DAY)
    })

    it('première synchro Health Connect : bornée à première autorisation − 29 j', () => {
      const firstGrantAt = new Date(NOW.getTime() - 2 * DAY).toISOString()
      const since = syncSince({ now: NOW, settings: { firstGrantAt }, latestAt: null, historyDays: 180, readWindowDays: 29 })
      expect(since.getTime()).toBe(new Date(firstGrantAt).getTime() - 29 * DAY)
    })

    it('ne recule pas une demande plus courte que la fenêtre', () => {
      const since = syncSince({ now: NOW, settings: { firstGrantAt: NOW.toISOString() }, latestAt: null, historyDays: 7, readWindowDays: 29 })
      expect(since.getTime()).toBe(NOW.getTime() - 7 * DAY)
    })

    it('sans date de première autorisation connue, la borne part de maintenant', () => {
      const since = syncSince({ now: NOW, settings: {}, latestAt: null, historyDays: 180, readWindowDays: 29 })
      expect(since.getTime()).toBe(NOW.getTime() - 29 * DAY)
    })

    it('synchro incrémentale : depuis la dernière synchro moins 2 h', () => {
      const lastSyncAt = new Date(NOW.getTime() - DAY).toISOString()
      const since = syncSince({ now: NOW, settings: { lastSyncAt }, latestAt: null, historyDays: 180, readWindowDays: 29 })
      expect(since.getTime()).toBe(NOW.getTime() - DAY - 2 * 60 * 60 * 1000)
    })

    it('utilisateur existant sans date notée : pas de borne même après une longue absence', () => {
      const lastSyncAt = new Date(NOW.getTime() - 60 * DAY).toISOString()
      const since = syncSince({ now: NOW, settings: { lastSyncAt }, latestAt: null, historyDays: 180, readWindowDays: 29 })
      expect(since.getTime()).toBe(NOW.getTime() - 60 * DAY - 2 * 60 * 60 * 1000)
    })

    it('reprise depuis la dernière donnée stockée, bornée elle aussi', () => {
      const latestAt = new Date(NOW.getTime() - 100 * DAY).toISOString()
      const since = syncSince({ now: NOW, settings: { firstGrantAt: NOW.toISOString() }, latestAt, historyDays: 180, readWindowDays: 29 })
      expect(since.getTime()).toBe(NOW.getTime() - 29 * DAY)
    })
  })

  describe('readsAllFailed', () => {
    it('vrai quand rien n\'est importé et qu\'il y a des erreurs', () => {
      expect(readsAllFailed({ synced: 0, skipped: 0, errors: ['steps: boom'] })).toBe(true)
    })
    it('faux quand au moins une donnée est importée', () => {
      expect(readsAllFailed({ synced: 3, skipped: 0, errors: ['sleep: boom'] })).toBe(false)
    })
    it('faux quand rien à importer mais aucune erreur', () => {
      expect(readsAllFailed({ synced: 0, skipped: 0, errors: [] })).toBe(false)
      expect(readsAllFailed(null)).toBe(false)
    })
  })

  describe('historyOptions', () => {
    it('toutes les durées sans fenêtre de lecture', () => {
      expect(historyOptions(null).map((o) => o.days)).toEqual([7, 30, 90, 180, 365, 730])
    })
    it('avec la fenêtre Health Connect : 7 jours et « 30 jours » (29 j lisibles)', () => {
      expect(historyOptions(29).map((o) => o.days)).toEqual([7, 29])
      expect(historyOptions(29)[1].label).toBe('30 jours')
    })
  })
})
