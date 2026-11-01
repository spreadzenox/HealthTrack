// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PREMIUM_BENEFITS, PREMIUM_AI_DAILY, GOLD_AI_DAILY, deliveredBenefits, upcomingBenefits, goldPlayBenefits } from './premiumBenefits'
import { loadConfig } from '../../../relay/src/config.js'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))

describe('Avantages premium (VC-17)', () => {
  it('chaque avantage coché est relié à une fonction qui existe dans le dépôt', () => {
    expect(deliveredBenefits().length).toBeGreaterThan(0)
    for (const b of deliveredBenefits()) {
      expect(b.deliveredBy, b.id).toBeTruthy()
      expect(existsSync(repoRoot + b.deliveredBy), b.deliveredBy).toBe(true)
    }
  })

  it('le plafond IA annoncé est celui du relais', () => {
    expect(loadConfig({}).premiumDaily).toBe(PREMIUM_AI_DAILY)
    expect(loadConfig({}).goldDaily).toBe(GOLD_AI_DAILY)
  })

  it('Gold reprend les avantages livrés, avec son propre plafond IA', () => {
    const gold = goldPlayBenefits()
    expect(gold).toHaveLength(deliveredBenefits().length)
    expect(gold[0]).toBe(`Analyse IA des repas, ${GOLD_AI_DAILY} par jour`)
    expect(gold.join(' ')).not.toMatch(/erreur|précis|fiable|gemini|flash/i)
  })

  it('ce qui n’est pas livré n’est jamais coché', () => {
    expect(upcomingBenefits().map((b) => b.id)).toEqual([])
    expect(new Set(PREMIUM_BENEFITS.map((b) => b.id)).size).toBe(PREMIUM_BENEFITS.length)
  })
})
