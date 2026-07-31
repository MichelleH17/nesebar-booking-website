import { describe, it, expect } from 'vitest'
import { shouldBlockDemoWrite, isDemoBlock, DEMO_BLOCK_MESSAGE } from '../shared/utils/demo'

describe('shouldBlockDemoWrite', () => {
  it('blocks demo mutations on /api', () => {
    expect(shouldBlockDemoWrite('demo', 'POST', '/api/reservations')).toBe(true)
    expect(shouldBlockDemoWrite('demo', 'PATCH', '/api/apartments/15B')).toBe(true)
    expect(shouldBlockDemoWrite('demo', 'DELETE', '/api/guide-items/3')).toBe(true)
  })
  it('allows demo reads', () => {
    expect(shouldBlockDemoWrite('demo', 'GET', '/api/reservations')).toBe(false)
    expect(shouldBlockDemoWrite('demo', 'HEAD', '/api/stats')).toBe(false)
  })
  it('allows demo auth calls (logout)', () => {
    expect(shouldBlockDemoWrite('demo', 'POST', '/api/auth/logout')).toBe(false)
  })
  it('allows nuxt-auth-utils internal session calls (useUserSession().clear())', () => {
    expect(shouldBlockDemoWrite('demo', 'DELETE', '/api/_auth/session')).toBe(false)
  })
  it('never blocks non-demo roles', () => {
    expect(shouldBlockDemoWrite('admin', 'POST', '/api/reservations')).toBe(false)
    expect(shouldBlockDemoWrite('family', 'DELETE', '/api/reservations/1')).toBe(false)
    expect(shouldBlockDemoWrite('guest', 'POST', '/api/reservations')).toBe(false)
  })
  it('ignores non-api paths', () => {
    expect(shouldBlockDemoWrite('demo', 'POST', '/kalendar')).toBe(false)
  })
})

describe('isDemoBlock', () => {
  it('detects the demo 403 in the real H3 error envelope', () => {
    // ofetch sets err.data to the whole error body; the flag is nested under body.data
    expect(isDemoBlock({ statusCode: 403, data: { statusCode: 403, message: 'x', data: { demo: true } } })).toBe(true)
    expect(isDemoBlock({ data: { data: { demo: true } } })).toBe(true)
  })
  it('ignores other errors and wrong nesting', () => {
    expect(isDemoBlock({ data: { demo: true } })).toBe(false)
    expect(isDemoBlock({ statusCode: 403, data: { message: 'Jen pro správce.' } })).toBe(false)
    expect(isDemoBlock({ statusCode: 409 })).toBe(false)
    expect(isDemoBlock(null)).toBe(false)
    expect(isDemoBlock(undefined)).toBe(false)
  })
})

describe('DEMO_BLOCK_MESSAGE', () => {
  it('is the Czech read-only message', () => {
    expect(DEMO_BLOCK_MESSAGE).toContain('ukázk')
  })
})
