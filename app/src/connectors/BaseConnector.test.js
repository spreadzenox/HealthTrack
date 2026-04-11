import { describe, it, expect } from 'vitest'
import { BaseConnector } from './BaseConnector'

describe('BaseConnector', () => {
  it('throws if id or name is missing', () => {
    expect(() => new BaseConnector({ name: 'Test' })).toThrow()
    expect(() => new BaseConnector({ id: 'test' })).toThrow()
  })

  it('stores id, name, description and dataTypes', () => {
    const c = new BaseConnector({
      id: 'test_connector',
      name: 'Test',
      description: 'A test connector',
      dataTypes: ['steps', 'sleep'],
    })
    expect(c.id).toBe('test_connector')
    expect(c.name).toBe('Test')
    expect(c.description).toBe('A test connector')
    expect(c.dataTypes).toEqual(['steps', 'sleep'])
  })

  it('isAvailable returns false by default', async () => {
    const c = new BaseConnector({ id: 'x', name: 'X' })
    expect(await c.isAvailable()).toBe(false)
  })

  it('checkPermissions returns not_asked by default', async () => {
    const c = new BaseConnector({ id: 'x', name: 'X' })
    expect(await c.checkPermissions()).toBe('not_asked')
  })

  it('requestPermissions returns denied by default', async () => {
    const c = new BaseConnector({ id: 'x', name: 'X' })
    expect(await c.requestPermissions()).toBe('denied')
  })

  it('sync returns zero counts by default', async () => {
    const c = new BaseConnector({ id: 'x', name: 'X' })
    const result = await c.sync({ since: new Date(), writer: async () => {} })
    expect(result.synced).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.errors).toEqual([])
  })
})
